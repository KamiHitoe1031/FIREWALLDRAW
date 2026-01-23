/**
 * UIScene.js
 * HUD（並列起動）- 難易度対応版
 */

class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  init(data) {
    this.stageId = data.stageId || 1;
    this.difficulty = data.difficulty || 'normal';
  }

  create() {
    this.assetManager = new AssetManager(this);
    const { WIDTH, UI_TOP_HEIGHT, GAME_AREA_BOTTOM } = GAME_CONFIG;

    // ステージデータ取得
    const stagesData = this.cache.json.get('stages') || DEFAULT_DATA.stages;
    this.stageData = stagesData.find(s => s.id === this.stageId) || stagesData[0];
    this.totalWaves = this.stageData ? this.stageData.waves.length : 5;

    // 上部UI帯の背景
    this.createTopUI();

    // 下部UI帯の背景
    this.createBottomUI();

    // GameSceneからのイベントをリッスン
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('cpuDamaged', this.updateHP, this);
    gameScene.events.on('scoreChanged', this.updateScore, this);
    gameScene.events.on('waveCleared', this.updateWave, this);
  }

  createTopUI() {
    const { WIDTH } = GAME_CONFIG;
    const diffName = DIFFICULTY_SETTINGS[this.difficulty].name;

    // 背景
    const topBg = this.add.graphics();
    topBg.fillStyle(0x000000, 0.8);
    topBg.fillRect(0, 0, WIDTH, 50);
    topBg.lineStyle(2, 0x00aaff, 1);
    topBg.lineBetween(0, 50, WIDTH, 50);

    // ステージ・難易度表示
    this.add.text(20, 8, `Stage ${this.stageId}【${diffName}】`, {
      fontSize: '12px',
      color: '#888888',
      fontFamily: 'sans-serif'
    });

    // HPバー
    this.add.text(20, 28, 'HP:', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    });

    this.hpBar = this.assetManager.createHPBar(50, 25, 120, 18);

    // HPテキスト
    this.hpText = this.add.text(180, 28, `${GameData.cpuHp}/${GameData.cpuMaxHp}`, {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    });

    // スコア
    this.scoreText = this.add.text(WIDTH / 2, 25, 'SCORE: 0', {
      fontSize: '20px',
      color: '#ffff00',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // ウェーブ表示
    this.waveText = this.add.text(WIDTH - 130, 25, `WAVE 1/${this.totalWaves}`, {
      fontSize: '16px',
      color: '#00ff00',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // ポーズボタン
    this.createPauseButton();
  }

  createPauseButton() {
    const btn = this.add.container(GAME_CONFIG.WIDTH - 30, 25);

    const bg = this.add.graphics();
    bg.fillStyle(0x666666, 1);
    bg.lineStyle(2, 0xffffff, 1);
    bg.fillRoundedRect(-20, -15, 40, 30, 5);
    bg.strokeRoundedRect(-20, -15, 40, 30, 5);

    const text = this.add.text(0, 0, '||', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.add([bg, text]);
    btn.setSize(40, 30);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.togglePause();
    });
  }

  togglePause() {
    if (this.scene.isPaused('GameScene')) {
      this.scene.resume('GameScene');
      this.hidePauseOverlay();
    } else {
      this.scene.pause('GameScene');
      this.showPauseOverlay();
    }
  }

  showPauseOverlay() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    this.pauseOverlay = this.add.container(0, 0);

    // 半透明背景
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    // PAUSEテキスト
    const pauseText = this.add.text(WIDTH / 2, HEIGHT / 2 - 80, 'PAUSE', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.pauseOverlay.add([bg, pauseText]);

    // 再開ボタン
    this.createPauseButton2(WIDTH / 2, HEIGHT / 2, '再開', 0x00aa00, () => this.togglePause());

    // リトライボタン
    this.createPauseButton2(WIDTH / 2, HEIGHT / 2 + 55, 'リトライ', 0x444466, () => {
      this.hidePauseOverlay();
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('GameScene', {
        stageId: this.stageId,
        difficulty: this.difficulty
      });
      this.scene.launch('UIScene', {
        stageId: this.stageId,
        difficulty: this.difficulty
      });
    });

    // タイトルへボタン
    this.createPauseButton2(WIDTH / 2, HEIGHT / 2 + 110, 'タイトルへ', 0x666666, () => {
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('TitleScene');
    });
  }

  createPauseButton2(x, y, label, color, onClick) {
    const width = 150;
    const height = 40;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.lineStyle(2, 0xffffff, 1);
    bg.fillRoundedRect(-width/2, -height/2, width, height, 8);
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 8);

    const text = this.add.text(0, 0, label, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(color + 0x222222, 1);
      bg.lineStyle(2, 0xffff00, 1);
      bg.fillRoundedRect(-width/2, -height/2, width, height, 8);
      bg.strokeRoundedRect(-width/2, -height/2, width, height, 8);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.lineStyle(2, 0xffffff, 1);
      bg.fillRoundedRect(-width/2, -height/2, width, height, 8);
      bg.strokeRoundedRect(-width/2, -height/2, width, height, 8);
    });

    container.on('pointerdown', onClick);

    this.pauseOverlay.add(container);

    return container;
  }

  hidePauseOverlay() {
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }
  }

  createBottomUI() {
    const { WIDTH, GAME_AREA_BOTTOM } = GAME_CONFIG;

    // 背景
    const bottomBg = this.add.graphics();
    bottomBg.fillStyle(0x000000, 0.8);
    bottomBg.fillRect(0, GAME_AREA_BOTTOM, WIDTH, 50);
    bottomBg.lineStyle(2, 0x00aaff, 1);
    bottomBg.lineBetween(0, GAME_AREA_BOTTOM, WIDTH, GAME_AREA_BOTTOM);

    // 壁タイプ選択アイコン（将来の拡張用）
    this.createWallTypeIcons();
  }

  createWallTypeIcons() {
    const { WIDTH, GAME_AREA_BOTTOM } = GAME_CONFIG;
    const wallsData = this.cache.json.get('walls') || DEFAULT_DATA.walls;

    // アンロック済みの壁タイプのみ表示
    const unlockedWalls = GameData.unlockedWalls || ['basic'];
    const iconSize = 40;
    const spacing = 60;
    const startX = WIDTH / 2 - ((unlockedWalls.length - 1) * spacing) / 2;

    this.wallIcons = [];

    unlockedWalls.forEach((wallId, index) => {
      const wallData = wallsData.find(w => w.id === wallId);
      if (!wallData) return;

      const x = startX + index * spacing;
      const y = GAME_AREA_BOTTOM + 25;

      const container = this.add.container(x, y);

      // アイコン背景
      const bg = this.add.graphics();
      let color = parseInt(wallData.color);
      if (isNaN(color)) color = 0x00aaff;

      const isSelected = GameData.selectedWallType === wallId;
      bg.fillStyle(color, isSelected ? 1 : 0.5);
      bg.lineStyle(2, isSelected ? 0xffff00 : 0xffffff, 1);
      bg.fillRoundedRect(-iconSize/2, -iconSize/2, iconSize, iconSize, 5);
      bg.strokeRoundedRect(-iconSize/2, -iconSize/2, iconSize, iconSize, 5);

      // ラベル
      const label = this.add.text(0, 0, wallData.name.substring(0, 2), {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      container.add([bg, label]);
      container.setSize(iconSize, iconSize);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerdown', () => {
        GameData.selectedWallType = wallId;
        this.updateWallIconSelection();
      });

      this.wallIcons.push({ container, bg, wallId, color });
    });
  }

  updateWallIconSelection() {
    this.wallIcons.forEach(icon => {
      const isSelected = GameData.selectedWallType === icon.wallId;
      icon.bg.clear();
      icon.bg.fillStyle(icon.color, isSelected ? 1 : 0.5);
      icon.bg.lineStyle(2, isSelected ? 0xffff00 : 0xffffff, 1);
      icon.bg.fillRoundedRect(-20, -20, 40, 40, 5);
      icon.bg.strokeRoundedRect(-20, -20, 40, 40, 5);
    });
  }

  updateHP() {
    this.hpBar.updateHP(GameData.cpuHp, GameData.cpuMaxHp);
    this.hpText.setText(`${GameData.cpuHp}/${GameData.cpuMaxHp}`);

    // ダメージ時の演出
    this.tweens.add({
      targets: this.hpText,
      scale: 1.3,
      duration: 100,
      yoyo: true
    });
  }

  updateScore() {
    this.scoreText.setText(`SCORE: ${GameData.score}`);

    // スコア更新時の演出
    this.tweens.add({
      targets: this.scoreText,
      scale: 1.2,
      duration: 100,
      yoyo: true
    });
  }

  updateWave(data) {
    const currentWave = data ? data.currentWave + 1 : 1;
    const totalWaves = data ? data.totalWaves : this.totalWaves;
    this.waveText.setText(`WAVE ${currentWave}/${totalWaves}`);

    // ウェーブ変更演出
    this.tweens.add({
      targets: this.waveText,
      scale: 1.5,
      duration: 200,
      yoyo: true,
      ease: 'Bounce'
    });
  }

  shutdown() {
    // イベントリスナーをクリーンアップ
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.off('cpuDamaged', this.updateHP, this);
      gameScene.events.off('scoreChanged', this.updateScore, this);
      gameScene.events.off('waveCleared', this.updateWave, this);
    }
  }
}

window.UIScene = UIScene;
