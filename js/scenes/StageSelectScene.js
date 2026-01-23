/**
 * StageSelectScene.js
 * ステージ選択画面
 */

class StageSelectScene extends Phaser.Scene {
  constructor() {
    super('StageSelectScene');
  }

  init(data) {
    this.difficulty = data.difficulty || 'normal';
  }

  create() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // 背景
    this.createBackground();

    // タイトル
    const diffName = DIFFICULTY_SETTINGS[this.difficulty].name;
    this.add.text(WIDTH / 2, 40, `ステージ選択【${diffName}】`, {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // ステージデータ取得
    const stagesData = this.cache.json.get('stages') || DEFAULT_DATA.stages;
    console.log('[StageSelectScene] ステージデータ:', stagesData.length, '個のステージ', stagesData);

    // ステージボタンを配置（2行5列）
    const startX = 80;
    const startY = 120;
    const btnWidth = 120;
    const btnHeight = 100;
    const gapX = 130;
    const gapY = 140;

    stagesData.forEach((stage, index) => {
      const col = index % 5;
      const row = Math.floor(index / 5);
      const x = startX + col * gapX;
      const y = startY + row * gapY;

      this.createStageButton(x, y, btnWidth, btnHeight, stage);
    });

    // 戻るボタン
    this.createBackButton(WIDTH / 2, HEIGHT - 50);
  }

  createBackground() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    // グリッドパターン
    graphics.lineStyle(1, 0x333366, 0.3);
    for (let x = 0; x < GAME_CONFIG.WIDTH; x += 30) {
      graphics.lineBetween(x, 0, x, GAME_CONFIG.HEIGHT);
    }
    for (let y = 0; y < GAME_CONFIG.HEIGHT; y += 30) {
      graphics.lineBetween(0, y, GAME_CONFIG.WIDTH, y);
    }
  }

  createStageButton(x, y, width, height, stage) {
    const isCleared = SaveManager.isStageCleared(this.difficulty, stage.id);
    const isPlayable = SaveManager.isStagePlayable(this.difficulty, stage.id);
    const highScore = SaveManager.getHighScore(this.difficulty, stage.id);

    // コンテナを中心に配置（hitboxと描画を合わせる）
    const container = this.add.container(x + width/2, y + height/2);

    // 背景色決定
    let bgColor, borderColor, textColor;
    if (isCleared) {
      bgColor = 0x006600;
      borderColor = 0x00ff00;
      textColor = '#ffffff';
    } else if (isPlayable) {
      bgColor = 0x444466;
      borderColor = 0x8888aa;
      textColor = '#ffffff';
    } else {
      bgColor = 0x333333;
      borderColor = 0x555555;
      textColor = '#888888';
    }

    // 背景（中心からの相対座標で描画）
    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.lineStyle(3, borderColor, 1);
    bg.fillRoundedRect(-width/2, -height/2, width, height, 10);
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 10);

    // ステージ番号
    const numText = this.add.text(0, -25, `${stage.id}`, {
      fontSize: '32px',
      color: textColor,
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // ステージ名
    const nameText = this.add.text(0, 5, stage.name, {
      fontSize: '11px',
      color: textColor,
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    container.add([bg, numText, nameText]);

    // クリア済みマーク or ロックマーク
    if (isCleared) {
      const star = this.add.text(0, 30, '★', {
        fontSize: '18px',
        color: '#ffff00'
      }).setOrigin(0.5);
      container.add(star);

      // ハイスコア
      if (highScore > 0) {
        const scoreText = this.add.text(0, 45, `${highScore}`, {
          fontSize: '10px',
          color: '#aaaaaa',
          fontFamily: 'sans-serif'
        }).setOrigin(0.5);
        container.add(scoreText);
      }
    } else if (!isPlayable) {
      const lock = this.add.text(0, 30, '🔒', {
        fontSize: '20px'
      }).setOrigin(0.5);
      container.add(lock);
    }

    // インタラクティブ設定
    if (isPlayable) {
      container.setSize(width, height);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(bgColor + 0x222222, 1);
        bg.lineStyle(3, 0xffff00, 1);
        bg.fillRoundedRect(-width/2, -height/2, width, height, 10);
        bg.strokeRoundedRect(-width/2, -height/2, width, height, 10);
      });

      container.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(bgColor, 1);
        bg.lineStyle(3, borderColor, 1);
        bg.fillRoundedRect(-width/2, -height/2, width, height, 10);
        bg.strokeRoundedRect(-width/2, -height/2, width, height, 10);
      });

      container.on('pointerdown', () => {
        console.log('[StageSelectScene] ステージボタンクリック - stageId:', stage.id);
        this.startGame(stage.id);
      });
    }
  }

  createBackButton(x, y) {
    const width = 150;
    const height = 45;
    const color = 0x666666;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.lineStyle(2, 0xffffff, 1);
    bg.fillRoundedRect(-width/2, -height/2, width, height, 8);
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 8);

    const text = this.add.text(0, 0, '戻る', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x888888, 1);
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

    container.on('pointerdown', () => {
      this.scene.start('TitleScene');
    });
  }

  startGame(stageId) {
    console.log('[StageSelectScene] startGame called - stageId:', stageId, 'difficulty:', this.difficulty);
    try {
      console.log('[StageSelectScene] GameScene 開始中...');
      this.scene.start('GameScene', {
        stageId: stageId,
        difficulty: this.difficulty
      });
      console.log('[StageSelectScene] UIScene 起動中...');
      this.scene.launch('UIScene', {
        stageId: stageId,
        difficulty: this.difficulty
      });
      console.log('[StageSelectScene] シーン遷移完了');
    } catch (error) {
      console.error('[StageSelectScene] startGame でエラー:', error);
    }
  }
}

window.StageSelectScene = StageSelectScene;
