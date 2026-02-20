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
    this.load.spritesheet('enemy_bug_small', 'assets/images/enemies/bug_small.webp', {
      frameWidth: 48,
      frameHeight: 48
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

    // 新敵スプライト（Phase 2追加分）
    this.load.spritesheet('enemy_bomber', 'assets/images/enemies/bomber.png', {
      frameWidth: 40,
      frameHeight: 40
    });
    this.load.spritesheet('enemy_shield', 'assets/images/enemies/shield.png', {
      frameWidth: 20,
      frameHeight: 20
    });
    this.load.spritesheet('enemy_spawner', 'assets/images/enemies/spawner.png', {
      frameWidth: 48,
      frameHeight: 48
    });
    this.load.spritesheet('enemy_stealth', 'assets/images/enemies/stealth.png', {
      frameWidth: 20,
      frameHeight: 20
    });
    this.load.spritesheet('enemy_dasher', 'assets/images/enemies/dasher.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    // CPU（HP状態別の個別画像）
    this.load.image('cpu_happy', 'assets/images/cpu/cpu_happy.webp');
    this.load.image('cpu_worried', 'assets/images/cpu/cpu_worried.webp');
    this.load.image('cpu_scared', 'assets/images/cpu/cpu_scared.webp');
    this.load.image('cpu_critical', 'assets/images/cpu/cpu_critical.webp');

    // UI
    this.load.image('hp_bar_bg', 'assets/images/ui/hp_bar_bg.png');
    this.load.image('hp_bar_fill', 'assets/images/ui/hp_bar_fill.png');
    this.load.image('btn_start', 'assets/images/ui/btn_start.png');
    this.load.image('btn_retry', 'assets/images/ui/btn_retry.png');
    this.load.image('btn_title', 'assets/images/ui/btn_title.png');
    this.load.image('btn_pause', 'assets/images/ui/btn_pause.png');
    this.load.image('arrow_warning', 'assets/images/ui/arrow_warning.png');

    // 背景
    this.load.image('bg_game', 'assets/images/backgrounds/bg1.webp');
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

    // === 効果音（なくてもOK） ===
    this.load.audio('sfx_draw', 'assets/audio/sfx/draw_wall.mp3');
    this.load.audio('sfx_draw_cancel', 'assets/audio/sfx/draw_cancel.mp3');
    this.load.audio('sfx_hit', 'assets/audio/sfx/hit.mp3');
    this.load.audio('sfx_kill', 'assets/audio/sfx/kill.mp3');
    this.load.audio('sfx_cpu_damage', 'assets/audio/sfx/cpu_damage.mp3');
    this.load.audio('sfx_wave_start', 'assets/audio/sfx/wave_start.mp3');
    this.load.audio('sfx_wave_clear', 'assets/audio/sfx/wave_clear.mp3');
    this.load.audio('sfx_stage_clear', 'assets/audio/sfx/stage_clear.mp3');
    this.load.audio('sfx_game_over', 'assets/audio/sfx/game_over.mp3');
    this.load.audio('sfx_bomber_explode', 'assets/audio/sfx/bomber_explode.mp3');
    this.load.audio('sfx_shield_break', 'assets/audio/sfx/shield_break.mp3');
    this.load.audio('sfx_spawner_spawn', 'assets/audio/sfx/spawner_spawn.mp3');
    this.load.audio('sfx_stealth_toggle', 'assets/audio/sfx/stealth_toggle.mp3');
    this.load.audio('sfx_dasher_dash', 'assets/audio/sfx/dasher_dash.mp3');
    this.load.audio('sfx_button_click', 'assets/audio/sfx/button_click.mp3');
    this.load.audio('sfx_button_hover', 'assets/audio/sfx/button_hover.mp3');
    this.load.audio('sfx_new_record', 'assets/audio/sfx/new_record.mp3');
    this.load.audio('sfx_coin_reward', 'assets/audio/sfx/coin_reward.mp3');
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
