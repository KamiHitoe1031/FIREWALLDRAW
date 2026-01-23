/**
 * ResultScene.js
 * リザルト画面（統計・ボーナス・ランキング対応版）
 */

class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  init(data) {
    this.result = data.result || 'gameover';
    this.stageId = data.stageId || 1;
    this.difficulty = data.difficulty || 'normal';
    this.score = data.score || 0;
    this.reward = data.reward || 0;
    this.waveReached = data.waveReached || 1;
    this.totalWaves = data.totalWaves || 5;
    this.stats = data.stats || { wallsUsed: 0, totalKills: 0, multiKillCount: 0, damageTaken: 0, clearTime: 0 };
    this.bonuses = data.bonuses || null;
    this.targetWalls = data.targetWalls || 20;
    this.isNewRecord = false;
    this.inputElement = null;
    this.rankingDisplayed = false;
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

    // ボタン配置
    this.createButtons();

    // 総コイン表示
    const totalCoins = SaveManager.getCoins();
    this.add.text(WIDTH / 2, HEIGHT - 30, `所持コイン: ${totalCoins}`, {
      fontSize: '14px',
      color: '#ffff00',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);
  }

  createBackground() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    graphics.lineStyle(1, 0x333366, 0.3);
    for (let x = 0; x < GAME_CONFIG.WIDTH; x += 30) {
      graphics.lineBetween(x, 0, x, GAME_CONFIG.HEIGHT);
    }
    for (let y = 0; y < GAME_CONFIG.HEIGHT; y += 30) {
      graphics.lineBetween(0, y, GAME_CONFIG.WIDTH, y);
    }
  }

  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  processClearSave() {
    const data = SaveManager.load();

    if (!data[this.difficulty].clearedStages.includes(this.stageId)) {
      data[this.difficulty].clearedStages.push(this.stageId);
    }

    const currentHighScore = data[this.difficulty].highScores[this.stageId] || 0;
    if (this.score > currentHighScore) {
      data[this.difficulty].highScores[this.stageId] = this.score;
      this.isNewRecord = true;
    }

    data.coins += this.reward;
    SaveManager.save(data);
  }

  showClearResult() {
    const { WIDTH } = GAME_CONFIG;
    const diffName = DIFFICULTY_SETTINGS[this.difficulty].name;

    // タイトル
    const title = this.add.text(WIDTH / 2, 35, `STAGE ${this.stageId} CLEAR!`, {
      fontSize: '32px',
      color: '#00ff00',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    });

    // 難易度表示
    this.add.text(WIDTH / 2, 65, `【${diffName}】`, {
      fontSize: '14px',
      color: '#aaaaaa',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // 統計情報表示
    let y = 95;
    const leftX = 80;
    const rightX = WIDTH - 80;

    // 区切り線
    const line1 = this.add.graphics();
    line1.lineStyle(1, 0x444466, 1);
    line1.lineBetween(40, y - 5, WIDTH - 40, y - 5);

    // クリアタイム
    this.add.text(leftX, y, 'クリアタイム', { fontSize: '13px', color: '#aaaaaa', fontFamily: 'sans-serif' });
    this.add.text(rightX, y, this.formatTime(this.stats.clearTime), { fontSize: '13px', color: '#ffffff', fontFamily: 'sans-serif' }).setOrigin(1, 0);
    y += 22;

    // 撃破数
    this.add.text(leftX, y, '撃破数', { fontSize: '13px', color: '#aaaaaa', fontFamily: 'sans-serif' });
    this.add.text(rightX, y, `${this.stats.totalKills}体`, { fontSize: '13px', color: '#ffffff', fontFamily: 'sans-serif' }).setOrigin(1, 0);
    y += 22;

    // 使用した壁
    this.add.text(leftX, y, '使用した壁', { fontSize: '13px', color: '#aaaaaa', fontFamily: 'sans-serif' });
    const wallColor = this.stats.wallsUsed <= this.targetWalls ? '#00ff00' : '#ffffff';
    this.add.text(rightX, y, `${this.stats.wallsUsed}本 / 目標${this.targetWalls}本`, { fontSize: '13px', color: wallColor, fontFamily: 'sans-serif' }).setOrigin(1, 0);
    y += 30;

    // ボーナスセクション
    if (this.bonuses) {
      const line2 = this.add.graphics();
      line2.lineStyle(1, 0x444466, 1);
      line2.lineBetween(40, y - 5, WIDTH - 40, y - 5);

      this.add.text(leftX, y, 'ボーナス', { fontSize: '14px', color: '#00aaff', fontFamily: 'sans-serif', fontStyle: 'bold' });
      y += 24;

      // 壁エコノミーボーナス
      if (this.bonuses.wallEconomy.rank !== '-') {
        this.add.text(leftX + 10, y, `・壁エコノミー（${this.bonuses.wallEconomy.rank}評価）`, { fontSize: '12px', color: '#ffffff', fontFamily: 'sans-serif' });
        this.add.text(rightX, y, '✓', { fontSize: '14px', color: '#00ff00', fontFamily: 'sans-serif' }).setOrigin(1, 0);
        y += 20;
      }

      // ノーダメージボーナス
      if (this.bonuses.noDamage) {
        this.add.text(leftX + 10, y, '・ノーダメージ', { fontSize: '12px', color: '#ffffff', fontFamily: 'sans-serif' });
        this.add.text(rightX, y, '✓', { fontSize: '14px', color: '#00ff00', fontFamily: 'sans-serif' }).setOrigin(1, 0);
        y += 20;
      }

      // マルチキルボーナス
      if (this.bonuses.multiKill > 0) {
        this.add.text(leftX + 10, y, `・マルチキル ×${this.bonuses.multiKill}回`, { fontSize: '12px', color: '#ffffff', fontFamily: 'sans-serif' });
        this.add.text(rightX, y, '✓', { fontSize: '14px', color: '#00ff00', fontFamily: 'sans-serif' }).setOrigin(1, 0);
        y += 20;
      }
    }
    y += 10;

    // 最終区切り線
    const line3 = this.add.graphics();
    line3.lineStyle(2, 0x00aaff, 1);
    line3.lineBetween(40, y, WIDTH - 40, y);
    y += 15;

    // TOTAL SCORE
    this.add.text(WIDTH / 2, y, 'TOTAL SCORE', { fontSize: '14px', color: '#aaaaaa', fontFamily: 'sans-serif' }).setOrigin(0.5);
    y += 20;

    const scoreText = this.add.text(WIDTH / 2, y, this.score.toLocaleString(), {
      fontSize: '36px',
      color: '#ffff00',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // NEW RECORD表示
    if (this.isNewRecord) {
      const newRecordText = this.add.text(WIDTH / 2 + 100, y, 'NEW!', {
        fontSize: '16px',
        color: '#ff00ff',
        fontFamily: 'sans-serif',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      this.tweens.add({
        targets: newRecordText,
        alpha: { from: 0.5, to: 1 },
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }

    // 報酬表示
    y += 35;
    this.add.text(WIDTH / 2, y, `+${this.reward} COINS`, {
      fontSize: '18px',
      color: '#ffff00',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // パーティクル風エフェクト
    this.createCelebrationEffect();
  }

  showGameOverResult() {
    const { WIDTH } = GAME_CONFIG;
    const diffName = DIFFICULTY_SETTINGS[this.difficulty].name;

    // タイトル
    const title = this.add.text(WIDTH / 2, 80, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff0000',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: { from: 1.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Power2'
    });

    // ステージ情報
    this.add.text(WIDTH / 2, 130, `ステージ ${this.stageId}【${diffName}】`, {
      fontSize: '18px',
      color: '#aaaaaa',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // 敗北メッセージ
    this.add.text(WIDTH / 2, 165, 'CPUがウイルスに侵食された...', {
      fontSize: '16px',
      color: '#888888',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // スコア表示
    this.add.text(WIDTH / 2, 220, `SCORE: ${this.score.toLocaleString()}`, {
      fontSize: '28px',
      color: '#ffff00',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // ウェーブ到達表示
    this.add.text(WIDTH / 2, 260, `WAVE: ${this.waveReached}/${this.totalWaves}`, {
      fontSize: '18px',
      color: '#aaaaaa',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // 統計情報
    if (this.stats) {
      let y = 300;
      this.add.text(WIDTH / 2, y, `撃破数: ${this.stats.totalKills}体 / 使用壁: ${this.stats.wallsUsed}本`, {
        fontSize: '14px',
        color: '#666666',
        fontFamily: 'sans-serif'
      }).setOrigin(0.5);
    }
  }

  createButtons() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const buttonY = HEIGHT - 90;

    if (this.result === 'clear') {
      // クリア時: ランキング登録、リトライ、タイトルへ
      if (this.stageId < 10) {
        this.createButton(WIDTH / 2 - 180, buttonY, 'ランキング登録', 0x006688, () => this.showRankingInput());
        this.createButton(WIDTH / 2 - 45, buttonY, '次へ', 0x0066aa, () => this.goNextStage());
        this.createButton(WIDTH / 2 + 65, buttonY, 'リトライ', 0x444466, () => this.retry());
        this.createButton(WIDTH / 2 + 175, buttonY, 'タイトル', 0x666666, () => this.goToTitle());
      } else {
        // ステージ10クリア
        this.add.text(WIDTH / 2, buttonY - 40, 'おめでとう！全ステージクリア！', {
          fontSize: '16px',
          color: '#00ffff',
          fontFamily: 'sans-serif',
          fontStyle: 'bold'
        }).setOrigin(0.5);

        this.createButton(WIDTH / 2 - 130, buttonY, 'ランキング登録', 0x006688, () => this.showRankingInput());
        this.createButton(WIDTH / 2, buttonY, 'リトライ', 0x444466, () => this.retry());
        this.createButton(WIDTH / 2 + 130, buttonY, 'タイトル', 0x666666, () => this.goToTitle());
      }
    } else {
      // ゲームオーバー
      this.createButton(WIDTH / 2 - 80, buttonY, 'リトライ', 0x444466, () => this.retry());
      this.createButton(WIDTH / 2 + 80, buttonY, 'タイトルへ', 0x666666, () => this.goToTitle());
    }
  }

  createButton(x, y, label, color, onClick) {
    const width = 100;
    const height = 36;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.lineStyle(2, 0xffffff, 1);
    bg.fillRoundedRect(-width/2, -height/2, width, height, 8);
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 8);

    const text = this.add.text(0, 0, label, {
      fontSize: '12px',
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

  showRankingInput() {
    if (this.inputElement) return;

    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // オーバーレイ
    this.overlay = this.add.graphics();
    this.overlay.fillStyle(0x000000, 0.8);
    this.overlay.fillRect(0, 0, WIDTH, HEIGHT);

    // 入力ダイアログ
    this.dialogContainer = this.add.container(WIDTH / 2, HEIGHT / 2);

    const dialogBg = this.add.graphics();
    dialogBg.fillStyle(0x222244, 1);
    dialogBg.lineStyle(2, 0x00aaff, 1);
    dialogBg.fillRoundedRect(-150, -100, 300, 200, 10);
    dialogBg.strokeRoundedRect(-150, -100, 300, 200, 10);
    this.dialogContainer.add(dialogBg);

    const titleText = this.add.text(0, -70, 'ランキング登録', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.dialogContainer.add(titleText);

    const promptText = this.add.text(0, -40, '名前を入力してください（12文字まで）', {
      fontSize: '12px',
      color: '#aaaaaa',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);
    this.dialogContainer.add(promptText);

    // DOM入力要素
    const canvas = this.sys.game.canvas;
    const rect = canvas.getBoundingClientRect();

    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.maxLength = 12;
    this.inputElement.value = window.rankingManager ? window.rankingManager.getPlayerName() : '';
    this.inputElement.placeholder = 'プレイヤー名';
    this.inputElement.style.cssText = `
      position: absolute;
      left: ${rect.left + WIDTH / 2 - 100}px;
      top: ${rect.top + HEIGHT / 2 - 15}px;
      width: 200px;
      font-size: 16px;
      padding: 8px;
      text-align: center;
      border: 2px solid #00aaff;
      border-radius: 5px;
      background: #111122;
      color: #ffffff;
      z-index: 1000;
    `;
    document.body.appendChild(this.inputElement);
    this.inputElement.focus();

    // 登録ボタン
    const submitBtn = this.createDialogButton(0, 50, '登録', 0x00aa00, async () => {
      const name = this.inputElement.value.trim();
      if (name.length === 0) {
        alert('名前を入力してください');
        return;
      }
      await this.submitRanking(name);
    });
    this.dialogContainer.add(submitBtn);

    // キャンセルボタン
    const cancelBtn = this.createDialogButton(0, 90, 'キャンセル', 0x666666, () => {
      this.closeRankingInput();
    });
    this.dialogContainer.add(cancelBtn);
  }

  createDialogButton(x, y, label, color, onClick) {
    const width = 120;
    const height = 32;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.lineStyle(2, 0xffffff, 1);
    bg.fillRoundedRect(-width/2, -height/2, width, height, 6);
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 6);

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
      bg.fillRoundedRect(-width/2, -height/2, width, height, 6);
      bg.strokeRoundedRect(-width/2, -height/2, width, height, 6);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.lineStyle(2, 0xffffff, 1);
      bg.fillRoundedRect(-width/2, -height/2, width, height, 6);
      bg.strokeRoundedRect(-width/2, -height/2, width, height, 6);
    });

    container.on('pointerdown', onClick);

    return container;
  }

  async submitRanking(name) {
    if (!window.rankingManager) {
      alert('ランキング機能が利用できません');
      this.closeRankingInput();
      return;
    }

    // 名前を保存
    window.rankingManager.savePlayerName(name);

    // スコア送信
    const result = await window.rankingManager.submitScore(
      name,
      this.stageId,
      this.difficulty,
      this.score,
      this.stats.clearTime
    );

    this.closeRankingInput();

    if (result.success) {
      this.showRankingResult(result.rank);
    } else {
      alert('送信に失敗しました: ' + (result.error || '不明なエラー'));
    }
  }

  closeRankingInput() {
    if (this.inputElement) {
      this.inputElement.remove();
      this.inputElement = null;
    }
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
    if (this.dialogContainer) {
      this.dialogContainer.destroy();
      this.dialogContainer = null;
    }
  }

  async showRankingResult(myRank) {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // オーバーレイ
    this.rankOverlay = this.add.graphics();
    this.rankOverlay.fillStyle(0x000000, 0.9);
    this.rankOverlay.fillRect(0, 0, WIDTH, HEIGHT);

    // 結果表示
    this.add.text(WIDTH / 2, 40, `あなたの順位: ${myRank}位`, {
      fontSize: '24px',
      color: '#ffff00',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // ランキング取得
    const rankings = await window.rankingManager.getTopScores(this.stageId, this.difficulty, 10);

    this.add.text(WIDTH / 2, 80, `Stage ${this.stageId} ランキング TOP10`, {
      fontSize: '16px',
      color: '#00aaff',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // ランキング表示
    let y = 110;
    const headerStyle = { fontSize: '12px', color: '#888888', fontFamily: 'sans-serif' };
    this.add.text(50, y, '順位', headerStyle);
    this.add.text(100, y, '名前', headerStyle);
    this.add.text(WIDTH - 150, y, 'スコア', headerStyle);
    this.add.text(WIDTH - 60, y, 'タイム', headerStyle);
    y += 20;

    rankings.forEach((entry, index) => {
      const rank = index + 1;
      const isMe = rank === myRank;
      const color = isMe ? '#ffff00' : '#ffffff';
      const style = { fontSize: '13px', color: color, fontFamily: 'sans-serif' };

      this.add.text(50, y, `${rank}`, style);
      this.add.text(100, y, entry.playerName, style);
      this.add.text(WIDTH - 150, y, entry.score.toLocaleString(), style);
      this.add.text(WIDTH - 60, y, this.formatTime(entry.clearTime), style);
      y += 22;
    });

    // 閉じるボタン
    this.createButton(WIDTH / 2, HEIGHT - 60, '閉じる', 0x666666, () => {
      this.rankOverlay.destroy();
    });
  }

  createCelebrationEffect() {
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
    this.cleanup();
    const nextStageId = this.stageId + 1;
    this.scene.start('GameScene', { stageId: nextStageId, difficulty: this.difficulty });
    this.scene.launch('UIScene', { stageId: nextStageId, difficulty: this.difficulty });
  }

  retry() {
    this.cleanup();
    this.scene.start('GameScene', { stageId: this.stageId, difficulty: this.difficulty });
    this.scene.launch('UIScene', { stageId: this.stageId, difficulty: this.difficulty });
  }

  goToTitle() {
    this.cleanup();
    this.scene.start('TitleScene');
  }

  cleanup() {
    if (this.inputElement) {
      this.inputElement.remove();
      this.inputElement = null;
    }
  }

  shutdown() {
    this.cleanup();
  }
}

window.ResultScene = ResultScene;
