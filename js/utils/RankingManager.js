/**
 * RankingManager.js
 * オンラインランキングAPI通信管理
 */

class RankingManager {
  constructor() {
    this.apiUrl = 'https://firewall-ranking-api.eteandran.workers.dev';
    this.playerNameKey = 'firewall_player_name';
  }

  /**
   * スコアを送信
   * @param {string} playerName プレイヤー名
   * @param {number} stageId ステージID
   * @param {string} difficulty 難易度 ('normal' | 'hard')
   * @param {number} score スコア
   * @param {number} clearTime クリアタイム（ミリ秒）
   * @returns {Promise<{success: boolean, rank?: number, error?: string}>}
   */
  async submitScore(playerName, stageId, difficulty, score, clearTime) {
    try {
      const requestBody = {
        playerName,
        stageId,
        difficulty,
        score,
        clearTime
      };
      console.log('[RankingManager] スコア送信:', requestBody);

      const response = await fetch(`${this.apiUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[RankingManager] 送信結果:', data);
      return data;
    } catch (error) {
      console.error('[RankingManager] ランキング送信エラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ランキングを取得
   * @param {number} stageId ステージID
   * @param {string} difficulty 難易度 ('normal' | 'hard')
   * @param {number} limit 取得件数（デフォルト20）
   * @returns {Promise<{success: boolean, rankings?: Array, error?: string}>}
   */
  async getTopScores(stageId, difficulty, limit = 20) {
    try {
      const url = `${this.apiUrl}/rankings?stageId=${stageId}&difficulty=${difficulty}&limit=${limit}`;
      console.log('[RankingManager] ランキング取得:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[RankingManager] 取得結果:', data);
      return data;
    } catch (error) {
      console.error('[RankingManager] ランキング取得エラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 全ステージのベストスコアを取得
   * @param {string} difficulty 難易度
   * @returns {Promise<{success: boolean, bestScores?: Object, error?: string}>}
   */
  async getAllBestScores(difficulty) {
    try {
      const response = await fetch(
        `${this.apiUrl}/best-scores?difficulty=${difficulty}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('ベストスコア取得エラー:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * プレイヤー名をローカルストレージに保存
   * @param {string} name プレイヤー名
   */
  savePlayerName(name) {
    try {
      localStorage.setItem(this.playerNameKey, name);
    } catch (e) {
      console.warn('プレイヤー名の保存に失敗:', e);
    }
  }

  /**
   * 保存されたプレイヤー名を取得
   * @returns {string|null}
   */
  getPlayerName() {
    try {
      return localStorage.getItem(this.playerNameKey);
    } catch (e) {
      console.warn('プレイヤー名の取得に失敗:', e);
      return null;
    }
  }

  /**
   * プレイヤー名のバリデーション
   * @param {string} name プレイヤー名
   * @returns {{valid: boolean, error?: string}}
   */
  validatePlayerName(name) {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: '名前を入力してください' };
    }

    const trimmed = name.trim();

    if (trimmed.length === 0) {
      return { valid: false, error: '名前を入力してください' };
    }

    if (trimmed.length > 12) {
      return { valid: false, error: '名前は12文字以内にしてください' };
    }

    // 禁止文字チェック（基本的な制御文字のみ）
    if (/[\x00-\x1f]/.test(trimmed)) {
      return { valid: false, error: '使用できない文字が含まれています' };
    }

    return { valid: true };
  }

  /**
   * 時間をフォーマット
   * @param {number} ms ミリ秒
   * @returns {string} "mm:ss.ss" 形式
   */
  formatTime(ms) {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  }
}

// グローバルインスタンス作成
window.rankingManager = new RankingManager();
window.RankingManager = RankingManager;
