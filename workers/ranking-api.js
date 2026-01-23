/**
 * ranking-api.js
 * Cloudflare Workers - ファイアウォール・ドロー ランキングAPI
 */

// CORSヘッダー
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// KVキー生成
function getRankingKey(stageId, difficulty) {
  return `ranking:stage${stageId}:${difficulty}`;
}

// プレイヤー名バリデーション
function validatePlayerName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 12) return false;
  if (/[\x00-\x1f]/.test(trimmed)) return false;
  return true;
}

// スコア送信
async function handleSubmit(request, env) {
  try {
    const body = await request.json();
    const { playerName, stageId, difficulty, score, clearTime } = body;

    // バリデーション
    if (!validatePlayerName(playerName)) {
      return new Response(JSON.stringify({
        success: false,
        error: '無効なプレイヤー名です'
      }), { status: 400, headers: corsHeaders });
    }

    if (!stageId || stageId < 1 || stageId > 10) {
      return new Response(JSON.stringify({
        success: false,
        error: '無効なステージIDです'
      }), { status: 400, headers: corsHeaders });
    }

    if (!['normal', 'hard'].includes(difficulty)) {
      return new Response(JSON.stringify({
        success: false,
        error: '無効な難易度です'
      }), { status: 400, headers: corsHeaders });
    }

    if (typeof score !== 'number' || score < 0 || score > 999999999) {
      return new Response(JSON.stringify({
        success: false,
        error: '無効なスコアです'
      }), { status: 400, headers: corsHeaders });
    }

    if (typeof clearTime !== 'number' || clearTime < 0) {
      return new Response(JSON.stringify({
        success: false,
        error: '無効なクリアタイムです'
      }), { status: 400, headers: corsHeaders });
    }

    // 既存のランキングを取得
    const key = getRankingKey(stageId, difficulty);
    const existingData = await env.RANKING_KV.get(key);
    let rankings = existingData ? JSON.parse(existingData) : [];

    // 新エントリー追加
    const newEntry = {
      playerName: playerName.trim(),
      score,
      clearTime,
      timestamp: Date.now()
    };

    rankings.push(newEntry);

    // スコア降順でソート
    rankings.sort((a, b) => b.score - a.score);

    // 上位100件のみ保持
    rankings = rankings.slice(0, 100);

    // 保存
    await env.RANKING_KV.put(key, JSON.stringify(rankings));

    // 順位を計算
    const rank = rankings.findIndex(
      e => e.playerName === newEntry.playerName &&
           e.score === newEntry.score &&
           e.timestamp === newEntry.timestamp
    ) + 1;

    return new Response(JSON.stringify({
      success: true,
      rank: rank > 0 ? rank : null
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('Submit error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'サーバーエラーが発生しました'
    }), { status: 500, headers: corsHeaders });
  }
}

// ランキング取得
async function handleGetRankings(request, env) {
  try {
    const url = new URL(request.url);
    const stageId = parseInt(url.searchParams.get('stageId'));
    const difficulty = url.searchParams.get('difficulty');
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 100);

    // バリデーション
    if (!stageId || stageId < 1 || stageId > 10) {
      return new Response(JSON.stringify({
        success: false,
        error: '無効なステージIDです'
      }), { status: 400, headers: corsHeaders });
    }

    if (!['normal', 'hard'].includes(difficulty)) {
      return new Response(JSON.stringify({
        success: false,
        error: '無効な難易度です'
      }), { status: 400, headers: corsHeaders });
    }

    // ランキング取得
    const key = getRankingKey(stageId, difficulty);
    const data = await env.RANKING_KV.get(key);
    const rankings = data ? JSON.parse(data).slice(0, limit) : [];

    return new Response(JSON.stringify({
      success: true,
      rankings
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('GetRankings error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'サーバーエラーが発生しました'
    }), { status: 500, headers: corsHeaders });
  }
}

// 全ステージベストスコア取得
async function handleGetBestScores(request, env) {
  try {
    const url = new URL(request.url);
    const difficulty = url.searchParams.get('difficulty');

    if (!['normal', 'hard'].includes(difficulty)) {
      return new Response(JSON.stringify({
        success: false,
        error: '無効な難易度です'
      }), { status: 400, headers: corsHeaders });
    }

    const bestScores = {};

    for (let stageId = 1; stageId <= 10; stageId++) {
      const key = getRankingKey(stageId, difficulty);
      const data = await env.RANKING_KV.get(key);
      if (data) {
        const rankings = JSON.parse(data);
        if (rankings.length > 0) {
          bestScores[stageId] = rankings[0];
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      bestScores
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('GetBestScores error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'サーバーエラーが発生しました'
    }), { status: 500, headers: corsHeaders });
  }
}

// メインハンドラー
export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ルーティング
    if (path === '/submit' && request.method === 'POST') {
      return handleSubmit(request, env);
    }

    if (path === '/rankings' && request.method === 'GET') {
      return handleGetRankings(request, env);
    }

    if (path === '/best-scores' && request.method === 'GET') {
      return handleGetBestScores(request, env);
    }

    // ヘルスチェック
    if (path === '/' || path === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'firewall-ranking-api',
        version: '1.0.0'
      }), { headers: corsHeaders });
    }

    // 404
    return new Response(JSON.stringify({
      success: false,
      error: 'Not Found'
    }), { status: 404, headers: corsHeaders });
  }
};
