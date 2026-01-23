/**
 * PlaceholderConfig.js
 * 各アセットのプレースホルダー設定を定義
 */

const PLACEHOLDER_CONFIG = {
  // === 敵 ===
  enemy_bug_small: {
    width: 24,
    height: 24,
    color: 0x00ff00,  // 緑
    shape: 'circle',
    label: 'バグ小'
  },
  enemy_bug_medium: {
    width: 32,
    height: 32,
    color: 0xffff00,  // 黄
    shape: 'circle',
    label: 'バグ中'
  },
  enemy_worm: {
    width: 32,
    height: 16,
    color: 0xff0000,  // 赤
    shape: 'rect',
    label: 'ワーム'
  },
  enemy_trojan: {
    width: 48,
    height: 48,
    color: 0x9900ff,  // 紫
    shape: 'rect',
    label: 'トロイ'
  },
  enemy_ransom: {
    width: 64,
    height: 64,
    color: 0x333333,  // 黒
    shape: 'rect',
    label: 'ランサム'
  },
  enemy_bomber: {
    width: 40,
    height: 40,
    color: 0xff6600,  // オレンジ
    shape: 'circle',
    label: 'ボマー'
  },
  enemy_shield: {
    width: 20,
    height: 20,
    color: 0x00ffff,  // シアン
    shape: 'circle',
    label: 'シールド'
  },
  enemy_spawner: {
    width: 48,
    height: 48,
    color: 0x9900ff,  // 紫
    shape: 'rect',
    label: 'スポナー'
  },
  enemy_stealth: {
    width: 20,
    height: 20,
    color: 0x888888,  // 灰色
    shape: 'circle',
    label: 'ステルス'
  },
  enemy_dasher: {
    width: 32,
    height: 32,
    color: 0xffff00,  // 黄色
    shape: 'rect',
    label: 'ダッシャー'
  },

  // === CPU ===
  cpu: {
    width: 64,
    height: 64,
    color: 0x00aaff,  // 水色
    shape: 'rect',
    label: 'CPU'
  },

  // === UI ===
  btn_start: {
    width: 200,
    height: 60,
    color: 0x00aa00,  // 緑
    shape: 'rect',
    label: 'START'
  },
  btn_retry: {
    width: 150,
    height: 50,
    color: 0x0066aa,  // 青
    shape: 'rect',
    label: 'RETRY'
  },
  btn_resume: {
    width: 150,
    height: 50,
    color: 0x00aa00,  // 緑
    shape: 'rect',
    label: 'RESUME'
  },
  btn_title: {
    width: 150,
    height: 50,
    color: 0x666666,  // 灰
    shape: 'rect',
    label: 'TITLE'
  },
  btn_pause: {
    width: 40,
    height: 30,
    color: 0x666666,
    shape: 'rect',
    label: '||'
  },
  arrow_warning: {
    width: 64,
    height: 64,
    color: 0xff0000,  // 赤
    shape: 'triangle',
    label: '!'
  },

  // === 壁アイコン ===
  icon_wall_basic: {
    width: 50,
    height: 50,
    color: 0x00aaff,
    shape: 'rect',
    label: '基本'
  },
  icon_wall_fire: {
    width: 50,
    height: 50,
    color: 0xff6600,
    shape: 'rect',
    label: '炎'
  },
  icon_wall_ice: {
    width: 50,
    height: 50,
    color: 0x00ffff,
    shape: 'rect',
    label: '氷'
  }
};

window.PLACEHOLDER_CONFIG = PLACEHOLDER_CONFIG;
