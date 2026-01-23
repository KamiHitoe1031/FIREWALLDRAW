/**
 * ResultScene.js
 * リザルト画面（難易度・セーブ対応版）
 */

class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  init(data) {
    this.result = data.result || 'gameover'; // 'clear' or 'gameover'
    this.stageId = data.stageId || 1;
    this.difficulty = data.difficulty || 'normal';
    this.score = data.score || 0;
    this.reward = data.reward || 0;
    this.waveReached = data.waveReached || 1;
    this.totalWaves = data.totalWaves || 5;
    this.isNewRecord = false;
  }

  create() {
    this.assetManager = new AssetManager(this);
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // 背景
    this.createBackground();

    // クリア時はセーブ処理
    if (this.result === 'clear') {
      this.processClearSave();
      this.showClearResult();
    } else {
      this.showGameOverResult();
    }

    // スコア表示
    this.add.text(WIDTH / 2, HEIGHT / 2 - 30, `SCORE: ${this.score}`, {
      fontSize: '32px',
      color: '#ffff00',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // ウェーブ到達表示
    this.add.text(WIDTH / 2, HEIGHT / 2 + 10, `WAVE: ${this.waveReached}/${this.totalWaves}`, {
      fontSize: '20px',
      color: '#aaaaaa',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // NEW RECORD表示
    if (this.isNewRecord) {
      const newRecordText = this.add.text(WIDTH / 2, HEIGHT / 2 + 45, 'NEW RECORD!', {
        fontSize: '20px',
        color: '#ff00ff',
        fontFamily: 'sans-serif',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: newRecordText,
        alpha: { from: 0.5, to: 1 },
        scale: { from: 1, to: 1.1 },
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }

    // ボタン配置
    this.createButtons();

    // 総コイン表示
    const totalCoins = SaveManager.getCoins();
    this.add.text(WIDTH / 2, HEIGHT - 50, `所持コイン: ${totalCoins}`, {
      fontSize: '18px',
      color: '#ffff00',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);
  }

  createBackground() {
    const graphics = this.add.graphics();

    // 暗い背景
    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    // 装飾パターン
    graphics.lineStyle(1, 0x333366, 0.3);
    for (let x = 0; x < GAME_CONFIG.WIDTH; x += 30) {
      graphics.lineBetween(x, 0, x, GAME_CONFIG.HEIGHT);
    }
    for (let y = 0; y < GAME_CONFIG.HEIGHT; y += 30) {
      graphics.lineBetween(0, y, GAME_CONFIG.WIDTH, y);
    }
  }

  processClearSave() {
    // セーブデータ取得
    const data = SaveManager.load();

    // 該当難易度のclearedStagesにstageIdを追加
    if (!data[this.difficulty].clearedStages.includes(this.stageId)) {
      data[this.difficulty].clearedStages.push(this.stageId);
    }

    // ハイスコア更新チェック
    const currentHighScore = data[this.difficulty].highScores[this.stageId] || 0;
    if (this.score > currentHighScore) {
      data[this.difficulty].highScores[this.stageId] = this.score;
      this.isNewRecord = true;
    }

    // コイン加算
    data.coins += this.reward;

    // セーブ
    SaveManager.save(data);
  }

  showClearResult() {
    const { WIDTH } = GAME_CONFIG;
    const diffName = DIFFICULTY_SETTINGS[this.difficulty].name;

    // タイトル
    const title = this.add.text(WIDTH / 2, 100, 'STAGE CLEAR!', {
      fontSize: '48px',
      color: '#00ff00',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // アニメーション
    this.tweens.add({
      targets: title,
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    });

    // ステージ情報
    this.add.text(WIDTH / 2, 150, `ステージ ${this.stageId}【${diffName}】`, {
      fontSize: '18px',
      color: '#aaaaaa',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // 報酬表示
    const rewardText = this.add.text(WIDTH / 2, 185, `+${this.reward} COINS`, {
      fontSize: '24px',
      color: '#ffff00',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: rewardText,
      scale: { from: 0.8, to: 1.2 },
      duration: 300,
      yoyo: true,
      delay: 500
    });

    // パーティクル風エフェクト
    this.createCelebrationEffect();
  }

  showGameOverResult() {
    const { WIDTH } = GAME_CONFIG;
    const diffName = DIFFICULTY_SETTINGS[this.difficulty].name;

    // タイトル
    const title = this.add.text(WIDTH / 2, 100, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff0000',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // アニメーション
    this.tweens.add({
      targets: title,
      scale: { from: 1.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Power2'
    });

    // ステージ情報
    this.add.text(WIDTH / 2, 150, `ステージ ${this.stageId}【${diffName}】`, {
      fontSize: '18px',
      color: '#aaaaaa',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // 敗北メッセージ
    this.add.text(WIDTH / 2, 185, 'CPUがウイルスに侵食された...', {
      fontSize: '16px',
      color: '#888888',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);
  }

  createButtons() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const buttonY = HEIGHT / 2 + 110;

    if (this.result === 'clear' && this.stageId < 10) {
      // クリア時で10ステージ未満: 3ボタン
      this.createButton(WIDTH / 2 - 140, buttonY, '次のステージへ', 0x0066aa, () => this.goNextStage());
      this.createButton(WIDTH / 2, buttonY, 'リトライ', 0x444466, () => this.retry());
      this.createButton(WIDTH / 2 + 140, buttonY, 'タイトルへ', 0x666666, () => this.goToTitle());
    } else if (this.result === 'clear' && this.stageId === 10) {
      // ステージ10クリア: 2ボタン + 特別メッセージ
      this.add.text(WIDTH / 2, buttonY - 50, 'おめでとう！全ステージクリア！', {
        fontSize: '18px',
        color: '#00ffff',
        fontFamily: 'sans-serif',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.createButton(WIDTH / 2 - 90, buttonY, 'リトライ', 0x444466, () => this.retry());
      this.createButton(WIDTH / 2 + 90, buttonY, 'タイトルへ', 0x666666, () => this.goToTitle());
    } else {
      // ゲームオーバー: 2ボタン
      this.createButton(WIDTH / 2 - 90, buttonY, 'リトライ', 0x444466, () => this.retry());
      this.createButton(WIDTH / 2 + 90, buttonY, 'タイトルへ', 0x666666, () => this.goToTitle());
    }
  }

  createButton(x, y, label, color, onClick) {
    const width = 120;
    const height = 40;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.lineStyle(2, 0xffffff, 1);
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

    return container;
  }

  createCelebrationEffect() {
    // 簡単なパーティクル風エフェクト
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * GAME_CONFIG.WIDTH;
      const y = -20;
      const particle = this.add.graphics();

      const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
      const color = colors[Math.floor(Math.random() * colors.length)];

      particle.fillStyle(color, 1);
      particle.fillRect(-4, -4, 8, 8);
      particle.x = x;
      particle.y = y;

      this.tweens.add({
        targets: particle,
        y: GAME_CONFIG.HEIGHT + 20,
        x: x + (Math.random() - 0.5) * 100,
        rotation: Math.random() * Math.PI * 4,
        duration: 2000 + Math.random() * 1000,
        delay: Math.random() * 500,
        ease: 'Sine.easeIn',
        onComplete: () => particle.destroy()
      });
    }
  }

  goNextStage() {
    const nextStageId = this.stageId + 1;

    this.scene.start('GameScene', {
      stageId: nextStageId,
      difficulty: this.difficulty
    });
    this.scene.launch('UIScene', {
      stageId: nextStageId,
      difficulty: this.difficulty
    });
  }

  retry() {
    this.scene.start('GameScene', {
      stageId: this.stageId,
      difficulty: this.difficulty
    });
    this.scene.launch('UIScene', {
      stageId: this.stageId,
      difficulty: this.difficulty
    });
  }

  goToTitle() {
    this.scene.start('TitleScene');
  }
}

window.ResultScene = ResultScene;
