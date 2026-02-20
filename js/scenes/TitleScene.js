/**
 * TitleScene.js
 * タイトル画面
 */

class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    this.assetManager = new AssetManager(this);
    this.soundManager = new SoundManager(this);
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // 背景
    if (this.textures.exists('bg_title')) {
      this.add.image(WIDTH / 2, HEIGHT / 2, 'bg_title');
    } else {
      this.createPlaceholderBackground();
    }

    // タイトルロゴ
    if (this.textures.exists('title_logo')) {
      this.add.image(WIDTH / 2, 100, 'title_logo');
    } else {
      this.createTitleText();
    }

    // 難易度選択ボタン
    this.createDifficultyButton(WIDTH / 2, HEIGHT / 2 - 30, 'normal', 'ノーマル', 0x00aa00);
    this.createDifficultyButton(WIDTH / 2, HEIGHT / 2 + 40, 'hard', 'ハード', 0xaa0000);

    // サブボタン
    this.createSubButton(WIDTH / 2 - 90, HEIGHT / 2 + 130, 'ヘルプ', () => {
      this.scene.start('HelpScene');
    });

    this.createSubButton(WIDTH / 2 + 90, HEIGHT / 2 + 130, 'データ管理', () => {
      this.scene.start('DataScene');
    });

    // コイン表示
    const coins = SaveManager.getCoins();
    this.add.text(WIDTH / 2, HEIGHT - 60, `所持コイン: ${coins}`, {
      fontSize: '18px',
      color: '#ffff00',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // バージョン表示
    this.add.text(WIDTH - 10, HEIGHT - 10, 'v1.1', {
      fontSize: '12px',
      color: '#666666',
      fontFamily: 'sans-serif'
    }).setOrigin(1, 1);
  }

  createPlaceholderBackground() {
    const graphics = this.add.graphics();

    // 背景グラデーション風
    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    // デジタルパターン
    graphics.lineStyle(1, 0x00aaff, 0.2);
    for (let x = 0; x < GAME_CONFIG.WIDTH; x += 40) {
      graphics.lineBetween(x, 0, x, GAME_CONFIG.HEIGHT);
    }
    for (let y = 0; y < GAME_CONFIG.HEIGHT; y += 40) {
      graphics.lineBetween(0, y, GAME_CONFIG.WIDTH, y);
    }

    // ランダムな光点
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * GAME_CONFIG.WIDTH;
      const y = Math.random() * GAME_CONFIG.HEIGHT;
      graphics.fillStyle(0x00aaff, Math.random() * 0.5);
      graphics.fillCircle(x, y, 2);
    }
  }

  createTitleText() {
    // タイトルテキスト
    const title1 = this.add.text(GAME_CONFIG.WIDTH / 2, 70, 'FIREWALL', {
      fontSize: '42px',
      color: '#00aaff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const title2 = this.add.text(GAME_CONFIG.WIDTH / 2, 120, 'DRAW', {
      fontSize: '42px',
      color: '#ff6600',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // アニメーション
    this.tweens.add({
      targets: [title1, title2],
      alpha: { from: 0.8, to: 1 },
      scale: { from: 1, to: 1.05 },
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  createDifficultyButton(x, y, difficulty, label, color) {
    const width = 200;
    const height = 50;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.lineStyle(3, 0xffffff, 1);
    bg.fillRoundedRect(-width/2, -height/2, width, height, 10);
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 10);

    const text = this.add.text(0, 0, label, {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    // ホバーエフェクト
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(color + 0x222222, 1);
      bg.lineStyle(3, 0xffff00, 1);
      bg.fillRoundedRect(-width/2, -height/2, width, height, 10);
      bg.strokeRoundedRect(-width/2, -height/2, width, height, 10);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.lineStyle(3, 0xffffff, 1);
      bg.fillRoundedRect(-width/2, -height/2, width, height, 10);
      bg.strokeRoundedRect(-width/2, -height/2, width, height, 10);
    });

    container.on('pointerdown', () => {
      this.soundManager.play('sfx_button_click');
      this.scene.start('StageSelectScene', { difficulty });
    });
  }

  createSubButton(x, y, label, onClick) {
    const width = 120;
    const height = 40;
    const color = 0x444466;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.lineStyle(2, 0x8888aa, 1);
    bg.fillRoundedRect(-width/2, -height/2, width, height, 8);
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 8);

    const text = this.add.text(0, 0, label, {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x5555aa, 1);
      bg.lineStyle(2, 0xaaaaff, 1);
      bg.fillRoundedRect(-width/2, -height/2, width, height, 8);
      bg.strokeRoundedRect(-width/2, -height/2, width, height, 8);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.lineStyle(2, 0x8888aa, 1);
      bg.fillRoundedRect(-width/2, -height/2, width, height, 8);
      bg.strokeRoundedRect(-width/2, -height/2, width, height, 8);
    });

    container.on('pointerdown', () => {
      this.soundManager.play('sfx_button_click');
      onClick();
    });
  }
}

window.TitleScene = TitleScene;
