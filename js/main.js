/**
 * main.js
 * ファイアウォール・ドロー - メインエントリーポイント
 * v1.1 - 難易度システム・セーブ対応
 */

// ゲーム定数
const GAME_CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,
  UI_TOP_HEIGHT: 50,
  UI_BOTTOM_HEIGHT: 50,
  GAME_AREA_TOP: 50,
  GAME_AREA_BOTTOM: 550,
  CPU_X: 400,
  CPU_Y: 300
};

// グローバルゲーム状態（レガシー互換用、新システムはSaveManagerを使用）
const GameData = {
  // 現在のゲーム状態（一時的なもの、セーブには含めない）
  currentStage: 1,
  currentWave: 0,
  score: 0,
  cpuHp: 10,
  cpuMaxHp: 10,
  selectedWallType: 'basic',
  unlockedWalls: ['basic'],
  availableWalls: ['basic'],

  // アップグレード（SaveManagerから読み込み）
  upgrades: {
    wall_duration: 0,
    wall_damage: 0,
    wall_count: 0,
    cpu_hp: 0
  },

  // セーブ/ロード (レガシー互換 - 実際はSaveManagerを使用)
  save() {
    // SaveManagerを使用
    console.log('GameData.save() is deprecated. Use SaveManager instead.');
  },

  load() {
    // SaveManagerからアップグレードを読み込み
    const data = SaveManager.load();
    this.upgrades = data.upgrades;
  },

  reset() {
    this.currentWave = 0;
    this.score = 0;
    this.cpuHp = this.cpuMaxHp;
    this.selectedWallType = 'basic';
  }
};

// Phaser設定
const config = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  // DOM要素サポート（DataSceneの入力欄用）
  dom: {
    createContainer: true
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    StageSelectScene,
    HelpScene,
    DataScene,
    GameScene,
    UIScene,
    ResultScene
  ]
};

// SaveManagerを初期化してからアップグレードを読み込み
GameData.load();

// ゲーム起動
const game = new Phaser.Game(config);

// グローバルにエクスポート
window.GAME_CONFIG = GAME_CONFIG;
window.GameData = GameData;
