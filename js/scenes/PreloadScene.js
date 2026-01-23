/**
 * PreloadScene.js
 * 全アセット読み込み（画像エラーを無視して続行）
 * JSON読み込み失敗時はDefaultDataにフォールバック
 */

class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
    this.failedJsonFiles = new Set();
  }

  preload() {
    // エラーを無視して続行（画像がなくてもOK）
    this.load.on('loaderror', (file) => {
      console.warn(`アセット読み込みスキップ: ${file.key} (${file.url})`);

      // JSON読み込み失敗を記録
      if (file.type === 'json') {
        this.failedJsonFiles.add(file.key);
      }
    });

    // === 画像読み込み（存在しなくてもエラーにならない） ===

    // 敵スプライト
    this.load.spritesheet('enemy_bug_small', 'assets/images/enemies/bug_small.png', {
      frameWidth: 24,
      frameHeight: 24
    });
    this.load.spritesheet('enemy_bug_medium', 'assets/images/enemies/bug_medium.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('enemy_worm', 'assets/images/enemies/worm.png', {
      frameWidth: 32,
      frameHeight: 16
    });
    this.load.spritesheet('enemy_trojan', 'assets/images/enemies/trojan.png', {
      frameWidth: 48,
      frameHeight: 48
    });
    this.load.spritesheet('enemy_ransom', 'assets/images/enemies/ransom.png', {
      frameWidth: 64,
      frameHeight: 64
    });

    // CPU
    this.load.spritesheet('cpu', 'assets/images/ui/cpu.png', {
      frameWidth: 64,
      frameHeight: 64
    });

    // UI
    this.load.image('hp_bar_bg', 'assets/images/ui/hp_bar_bg.png');
    this.load.image('hp_bar_fill', 'assets/images/ui/hp_bar_fill.png');
    this.load.image('btn_start', 'assets/images/ui/btn_start.png');
    this.load.image('btn_retry', 'assets/images/ui/btn_retry.png');
    this.load.image('btn_title', 'assets/images/ui/btn_title.png');
    this.load.image('btn_pause', 'assets/images/ui/btn_pause.png');
    this.load.image('arrow_warning', 'assets/images/ui/arrow_warning.png');

    // 背景
    this.load.image('bg_game', 'assets/images/backgrounds/circuit_board.png');
    this.load.image('bg_title', 'assets/images/backgrounds/title_bg.png');
    this.load.image('title_logo', 'assets/images/ui/title_logo.png');

    // 壁アイコン
    this.load.image('icon_wall_basic', 'assets/images/ui/icon_wall_basic.png');
    this.load.image('icon_wall_fire', 'assets/images/ui/icon_wall_fire.png');
    this.load.image('icon_wall_ice', 'assets/images/ui/icon_wall_ice.png');

    // === JSON（読み込み失敗時はDefaultDataを使用） ===
    // キャッシュ回避のためタイムスタンプを付加
    const cacheBuster = '?v=' + Date.now();
    this.load.json('enemies', 'assets/data/enemies.json' + cacheBuster);
    this.load.json('walls', 'assets/data/walls.json' + cacheBuster);
    this.load.json('stages', 'assets/data/stages.json' + cacheBuster);
    this.load.json('upgrades', 'assets/data/upgrades.json' + cacheBuster);

    // === 音声（なくてもOK） ===
    this.load.audio('bgm_game', 'assets/audio/bgm/game.mp3');
    this.load.audio('sfx_draw', 'assets/audio/sfx/draw_wall.mp3');
    this.load.audio('sfx_hit', 'assets/audio/sfx/hit.mp3');
    this.load.audio('sfx_kill', 'assets/audio/sfx/kill.mp3');
  }

  create() {
    // JSON読み込み失敗時のフォールバック処理
    this.applyFallbackData();

    // デバッグ: 読み込まれたステージデータを確認
    const loadedStages = this.cache.json.get('stages');
    console.log('[PreloadScene] 読み込まれたステージ数:', loadedStages ? loadedStages.length : 0);
    console.log('[PreloadScene] DEFAULT_DATA.stages数:', DEFAULT_DATA.stages.length);

    // グローバルにAssetManagerを設定
    this.game.assetManager = new AssetManager(this);

    this.scene.start('TitleScene');
  }

  /**
   * JSON読み込み失敗時にDefaultDataをキャッシュに登録
   */
  applyFallbackData() {
    // file://プロトコルではすべてのJSONが失敗する可能性が高い
    const isFileProtocol = window.location.protocol === 'file:';

    if (isFileProtocol) {
      console.info('file://プロトコルで実行中 - デフォルトデータを使用します');
    }

    // enemies
    if (this.failedJsonFiles.has('enemies') || !this.cache.json.has('enemies')) {
      console.info('enemies.json をデフォルトデータで代替');
      this.cache.json.add('enemies', DEFAULT_DATA.enemies);
    }

    // walls
    if (this.failedJsonFiles.has('walls') || !this.cache.json.has('walls')) {
      console.info('walls.json をデフォルトデータで代替');
      this.cache.json.add('walls', DEFAULT_DATA.walls);
    }

    // stages
    if (this.failedJsonFiles.has('stages') || !this.cache.json.has('stages')) {
      console.info('stages.json をデフォルトデータで代替');
      this.cache.json.add('stages', DEFAULT_DATA.stages);
    }

    // upgrades
    if (this.failedJsonFiles.has('upgrades') || !this.cache.json.has('upgrades')) {
      console.info('upgrades.json をデフォルトデータで代替');
      this.cache.json.add('upgrades', DEFAULT_DATA.upgrades);
    }
  }
}

window.PreloadScene = PreloadScene;
