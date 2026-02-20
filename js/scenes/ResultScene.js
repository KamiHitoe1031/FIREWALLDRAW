/**
 * ResultScene.js
 * リザルト画面（リッチUI版 - 背景画像・CPUキャラ・ランキングTOP10チェック対応）
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
    this.rankingEligible = false;
    this.rankingButtonContainer = null;
  }

  create() {
    this.assetManager = new AssetManager(this);
    this.soundManager = new SoundManager(this);
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // 背景
    this.createBackground();

    // クリア時はセーブ処理
    if (this.result === 'clear') {
      this.processClearSave();
      this.showClearResult();
      // ランキングTOP10チェック（非同期）
      this.checkRankingEligibility();
    } else {
      this.showGameOverResult();
    }

    // ボタン配置
    this.createButtons();

    // 総コイン表示
    const totalCoins = SaveManager.getCoins();
    const coinContainer = this.add.container(WIDTH / 2, HEIGHT - 25);
    const coinIcon = this.add.graphics();
    coinIcon.fillStyle(0xffdd00, 1);
    coinIcon.fillCircle(-50, 0, 8);
    coinIcon.fillStyle(0xffaa00, 1);
    coinIcon.fillCircle(-50, 0, 5);
    const coinText = this.add.text(0, 0, `${totalCoins}`, {
      fontSize: '14px',
      color: '#ffdd00',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    coinContainer.add([coinIcon, coinText]);
  }

  createBackground() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // bg_game画像を使用（あれば）
    if (this.textures.exists('bg_game')) {
      const bg = this.add.image(WIDTH / 2, HEIGHT / 2, 'bg_game');
      bg.setDisplaySize(WIDTH, HEIGHT);
    }

    // ダークオーバーレイ
    const overlay = this.add.graphics();
    if (this.result === 'clear') {
      // クリア: 暗めの青紫オーバーレイ
      overlay.fillStyle(0x0a0a1e, 0.75);
    } else {
      // ゲームオーバー: 暗い赤みオーバーレイ
      overlay.fillStyle(0x1a0a0a, 0.82);
    }
    overlay.fillRect(0, 0, WIDTH, HEIGHT);

    // 装飾: コーナーライン
    const deco = this.add.graphics();
    const accentColor = this.result === 'clear' ? 0x00aaff : 0xff3333;
    deco.lineStyle(2, accentColor, 0.4);
    // 左上
    deco.lineBetween(10, 10, 60, 10);
    deco.lineBetween(10, 10, 10, 60);
    // 右上
    deco.lineBetween(WIDTH - 10, 10, WIDTH - 60, 10);
    deco.lineBetween(WIDTH - 10, 10, WIDTH - 10, 60);
    // 左下
    deco.lineBetween(10, HEIGHT - 10, 60, HEIGHT - 10);
    deco.lineBetween(10, HEIGHT - 10, 10, HEIGHT - 60);
    // 右下
    deco.lineBetween(WIDTH - 10, HEIGHT - 10, WIDTH - 60, HEIGHT - 10);
    deco.lineBetween(WIDTH - 10, HEIGHT - 10, WIDTH - 10, HEIGHT - 60);
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

  /**
   * ランキングTOP10入り判定（非同期）
   */
  async checkRankingEligibility() {
    if (!window.rankingManager) {
      // ランキング機能なし → ボタン表示しない
      return;
    }

    try {
      const result = await window.rankingManager.getTopScores(this.stageId, this.difficulty, 10);

      if (!result.success || !Array.isArray(result.rankings)) {
        // 取得失敗 → 念のため表示（恩恵的判断）
        this.rankingEligible = true;
      } else if (result.rankings.length < 10) {
        // 10件未満 → 必ず入れる
        this.rankingEligible = true;
      } else {
        // 最下位スコアと比較
        const lowestScore = result.rankings[result.rankings.length - 1].score;
        this.rankingEligible = this.score > lowestScore;
      }
    } catch (e) {
      console.warn('[ResultScene] ランキングチェック失敗:', e);
      this.rankingEligible = true; // エラー時は表示
    }

    // ボタンを表示/非表示
    if (this.rankingEligible && this.rankingButtonContainer) {
      this.rankingButtonContainer.setVisible(true);
      this.rankingButtonContainer.setAlpha(0);
      this.tweens.add({
        targets: this.rankingButtonContainer,
        alpha: 1,
        duration: 300,
        ease: 'Power2'
      });
    }
  }

  showClearResult() {
    const { WIDTH } = GAME_CONFIG;
    const diffName = DIFFICULTY_SETTINGS[this.difficulty].name;

    // === CPUキャラ表示 ===
    this.showCpuCharacter('cpu_happy', 70, 55, 0.55);

    // === タイトル ===
    // 影テキスト
    this.add.text(WIDTH / 2 + 2, 32, `STAGE ${this.stageId} CLEAR!`, {
      fontSize: '30px',
      color: '#003300',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.5);

    const title = this.add.text(WIDTH / 2, 30, `STAGE ${this.stageId} CLEAR!`, {
      fontSize: '30px',
      color: '#00ff66',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: { from: 0.3, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 600,
      ease: 'Back.easeOut'
    });

    // 難易度バッジ
    const badgeContainer = this.add.container(WIDTH / 2, 58);
    const badge = this.add.graphics();
    badge.fillStyle(0x334455, 0.8);
    badge.fillRoundedRect(-40, -10, 80, 20, 10);
    badge.lineStyle(1, 0x00aaff, 0.6);
    badge.strokeRoundedRect(-40, -10, 80, 20, 10);
    const badgeText = this.add.text(0, 0, diffName, {
      fontSize: '11px',
      color: '#88ccff',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);
    badgeContainer.add([badge, badgeText]);

    // === 統計パネル ===
    const panelX = WIDTH / 2;
    const panelY = 78;
    const panelW = WIDTH - 80;
    const panelH = 200;

    // パネル背景
    const panel = this.add.graphics();
    panel.fillStyle(0x111133, 0.7);
    panel.fillRoundedRect(panelX - panelW / 2, panelY, panelW, panelH, 8);
    panel.lineStyle(1, 0x334466, 0.8);
    panel.strokeRoundedRect(panelX - panelW / 2, panelY, panelW, panelH, 8);

    // パネル上部のアクセントライン
    const accentLine = this.add.graphics();
    accentLine.fillStyle(0x00aaff, 1);
    accentLine.fillRoundedRect(panelX - panelW / 2, panelY, panelW, 3, { tl: 8, tr: 8, bl: 0, br: 0 });

    // 統計情報
    let y = panelY + 18;
    const leftX = panelX - panelW / 2 + 25;
    const rightX = panelX + panelW / 2 - 25;
    const labelStyle = { fontSize: '13px', color: '#8899aa', fontFamily: 'sans-serif' };
    const valueStyle = { fontSize: '13px', color: '#ffffff', fontFamily: 'sans-serif' };

    // クリアタイム
    this.addStatRow(leftX, rightX, y, 'CLEAR TIME', this.formatTime(this.stats.clearTime), labelStyle, valueStyle);
    y += 22;

    // 撃破数
    this.addStatRow(leftX, rightX, y, 'KILLS', `${this.stats.totalKills}`, labelStyle, valueStyle);
    y += 22;

    // 使用した壁
    const wallValStyle = {
      fontSize: '13px',
      color: this.stats.wallsUsed <= this.targetWalls ? '#00ff66' : '#ffffff',
      fontFamily: 'sans-serif'
    };
    this.addStatRow(leftX, rightX, y, 'WALLS USED', `${this.stats.wallsUsed} / ${this.targetWalls}`, labelStyle, wallValStyle);
    y += 28;

    // ボーナスセクション
    if (this.bonuses) {
      // ボーナス区切り線
      const bonusLine = this.add.graphics();
      bonusLine.lineStyle(1, 0x334466, 0.6);
      bonusLine.lineBetween(leftX, y - 4, rightX, y - 4);

      const bonusLabel = this.add.text(leftX, y, 'BONUS', {
        fontSize: '11px',
        color: '#00aaff',
        fontFamily: 'sans-serif',
        fontStyle: 'bold'
      });
      y += 18;

      if (this.bonuses.wallEconomy && this.bonuses.wallEconomy.rank !== '-') {
        this.addBonusRow(leftX + 10, rightX, y, `Wall Economy (${this.bonuses.wallEconomy.rank})`);
        y += 18;
      }
      if (this.bonuses.noDamage) {
        this.addBonusRow(leftX + 10, rightX, y, 'No Damage');
        y += 18;
      }
      if (this.bonuses.multiKill > 0) {
        this.addBonusRow(leftX + 10, rightX, y, `Multi Kill x${this.bonuses.multiKill}`);
        y += 18;
      }
    }

    // === スコアセクション ===
    const scoreY = panelY + panelH + 20;

    this.add.text(WIDTH / 2, scoreY, 'TOTAL SCORE', {
      fontSize: '12px',
      color: '#8899aa',
      fontFamily: 'sans-serif',
      letterSpacing: 4
    }).setOrigin(0.5);

    // スコアカウントアップアニメーション
    const scoreText = this.add.text(WIDTH / 2, scoreY + 28, '0', {
      fontSize: '38px',
      color: '#ffdd00',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // カウントアップ演出
    this.tweens.addCounter({
      from: 0,
      to: this.score,
      duration: 1200,
      ease: 'Power2',
      onUpdate: (tween) => {
        const val = Math.floor(tween.getValue());
        scoreText.setText(val.toLocaleString());
      }
    });

    // NEW RECORD表示
    if (this.isNewRecord) {
      this.soundManager.play('sfx_new_record');
      const newRecordBg = this.add.graphics();
      newRecordBg.fillStyle(0xff00ff, 0.2);
      newRecordBg.fillRoundedRect(WIDTH / 2 + 80, scoreY + 15, 60, 24, 12);

      const newRecordText = this.add.text(WIDTH / 2 + 110, scoreY + 27, 'NEW!', {
        fontSize: '14px',
        color: '#ff66ff',
        fontFamily: 'sans-serif',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: [newRecordText, newRecordBg],
        alpha: { from: 0.5, to: 1 },
        scale: { from: 0.9, to: 1.1 },
        duration: 400,
        yoyo: true,
        repeat: -1
      });
    }

    // 報酬表示
    this.soundManager.play('sfx_coin_reward');
    const rewardY = scoreY + 60;
    const rewardContainer = this.add.container(WIDTH / 2, rewardY);
    const rewardBg = this.add.graphics();
    rewardBg.fillStyle(0x443300, 0.5);
    rewardBg.fillRoundedRect(-60, -12, 120, 24, 12);
    const rewardText = this.add.text(0, 0, `+ ${this.reward} COINS`, {
      fontSize: '15px',
      color: '#ffdd00',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    rewardContainer.add([rewardBg, rewardText]);

    rewardContainer.setAlpha(0);
    this.tweens.add({
      targets: rewardContainer,
      alpha: 1,
      y: rewardY - 5,
      duration: 500,
      delay: 1300,
      ease: 'Power2'
    });

    // パーティクル風エフェクト
    this.createCelebrationEffect();
  }

  showGameOverResult() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const diffName = DIFFICULTY_SETTINGS[this.difficulty].name;

    // === CPUキャラ表示（パニック） ===
    const cpuSprite = this.showCpuCharacter('cpu_critical', WIDTH / 2, 120, 0.7);

    // CPUを震わせる
    if (cpuSprite) {
      this.tweens.add({
        targets: cpuSprite,
        x: cpuSprite.x + 3,
        duration: 50,
        yoyo: true,
        repeat: -1
      });
    }

    // === GAME OVER タイトル ===
    // 影
    this.add.text(WIDTH / 2 + 3, 203, 'GAME OVER', {
      fontSize: '44px',
      color: '#330000',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.6);

    const title = this.add.text(WIDTH / 2, 200, 'GAME OVER', {
      fontSize: '44px',
      color: '#ff3333',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: { from: 2, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 600,
      ease: 'Power3'
    });

    // 敗北メッセージ
    const msgText = this.add.text(WIDTH / 2, 240, 'CPUがウイルスに侵食された...', {
      fontSize: '13px',
      color: '#666677',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);
    msgText.setAlpha(0);
    this.tweens.add({
      targets: msgText,
      alpha: 0.8,
      duration: 500,
      delay: 600
    });

    // === ステージ情報 ===
    this.add.text(WIDTH / 2, 275, `Stage ${this.stageId}  [${diffName}]`, {
      fontSize: '14px',
      color: '#8888aa',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // === 情報パネル ===
    const panelW = 320;
    const panelH = 120;
    const panelX = WIDTH / 2;
    const panelY = 300;

    const panel = this.add.graphics();
    panel.fillStyle(0x110a0a, 0.6);
    panel.fillRoundedRect(panelX - panelW / 2, panelY, panelW, panelH, 8);
    panel.lineStyle(1, 0x442222, 0.6);
    panel.strokeRoundedRect(panelX - panelW / 2, panelY, panelW, panelH, 8);
    // 赤いアクセントライン
    panel.fillStyle(0xff3333, 1);
    panel.fillRoundedRect(panelX - panelW / 2, panelY, panelW, 3, { tl: 8, tr: 8, bl: 0, br: 0 });

    let y = panelY + 18;
    const leftX = panelX - panelW / 2 + 20;
    const rightX = panelX + panelW / 2 - 20;
    const labelStyle = { fontSize: '13px', color: '#887777', fontFamily: 'sans-serif' };
    const valueStyle = { fontSize: '13px', color: '#ddcccc', fontFamily: 'sans-serif' };

    // スコア
    this.addStatRow(leftX, rightX, y, 'SCORE', this.score.toLocaleString(), labelStyle,
      { fontSize: '13px', color: '#ffdd00', fontFamily: 'sans-serif', fontStyle: 'bold' });
    y += 24;

    // ウェーブ到達
    this.addStatRow(leftX, rightX, y, 'WAVE', `${this.waveReached} / ${this.totalWaves}`, labelStyle, valueStyle);
    y += 24;

    // 撃破数・壁
    this.addStatRow(leftX, rightX, y, 'KILLS / WALLS', `${this.stats.totalKills} / ${this.stats.wallsUsed}`, labelStyle, valueStyle);
  }

  /**
   * CPUキャラクターを表示
   */
  showCpuCharacter(textureKey, x, y, scale) {
    if (this.textures.exists(textureKey)) {
      const sprite = this.add.image(x, y, textureKey);
      sprite.setScale(scale);
      // ゆるいボブアニメーション
      this.tweens.add({
        targets: sprite,
        y: y - 4,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      return sprite;
    }
    return null;
  }

  /**
   * 統計行を追加
   */
  addStatRow(leftX, rightX, y, label, value, labelStyle, valueStyle) {
    this.add.text(leftX, y, label, labelStyle);
    this.add.text(rightX, y, value, valueStyle).setOrigin(1, 0);
  }

  /**
   * ボーナス行を追加
   */
  addBonusRow(leftX, rightX, y, text) {
    this.add.text(leftX, y, text, { fontSize: '11px', color: '#aabbcc', fontFamily: 'sans-serif' });
    this.add.text(rightX, y, '+', { fontSize: '12px', color: '#00ff66', fontFamily: 'sans-serif', fontStyle: 'bold' }).setOrigin(1, 0);
  }

  createButtons() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const buttonY = HEIGHT - 60;

    if (this.result === 'clear') {
      // ランキングボタン（非同期チェック後にフェードイン）
      this.rankingButtonContainer = this.createStyledButton(
        WIDTH / 2 - 180, buttonY, 'ランキング登録', 0x006688, 0x00aaff, () => this.showRankingInput()
      );
      this.rankingButtonContainer.setVisible(false); // 初期非表示

      if (this.stageId < 10) {
        this.createStyledButton(WIDTH / 2 - 50, buttonY, '次のステージ', 0x005599, 0x00aaff, () => this.goNextStage());
        this.createStyledButton(WIDTH / 2 + 75, buttonY, 'リトライ', 0x333355, 0x6677aa, () => this.retry());
        this.createStyledButton(WIDTH / 2 + 180, buttonY, 'タイトル', 0x333344, 0x556677, () => this.goToTitle());
      } else {
        // 全クリ
        this.add.text(WIDTH / 2, buttonY - 35, 'ALL STAGES CLEAR!', {
          fontSize: '15px',
          color: '#00ffff',
          fontFamily: 'sans-serif',
          fontStyle: 'bold'
        }).setOrigin(0.5);

        this.createStyledButton(WIDTH / 2 - 10, buttonY, 'リトライ', 0x333355, 0x6677aa, () => this.retry());
        this.createStyledButton(WIDTH / 2 + 110, buttonY, 'タイトル', 0x333344, 0x556677, () => this.goToTitle());
      }
    } else {
      // ゲームオーバー
      this.createStyledButton(WIDTH / 2 - 70, buttonY, 'リトライ', 0x443333, 0xff6666, () => this.retry());
      this.createStyledButton(WIDTH / 2 + 70, buttonY, 'タイトルへ', 0x333344, 0x556677, () => this.goToTitle());
    }
  }

  /**
   * スタイル付きボタン生成
   */
  createStyledButton(x, y, label, bgColor, borderColor, onClick) {
    const width = 100;
    const height = 34;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.9);
    bg.lineStyle(1, borderColor, 0.8);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);

    const text = this.add.text(0, 0, label, {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(bgColor + 0x222222, 0.95);
      bg.lineStyle(2, 0xffffff, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
      text.setColor('#ffff00');
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(bgColor, 0.9);
      bg.lineStyle(1, borderColor, 0.8);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
      text.setColor('#ffffff');
    });

    container.on('pointerdown', () => {
      this.soundManager.play('sfx_button_click');
      onClick();
    });

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
    dialogBg.fillStyle(0x1a1a3a, 1);
    dialogBg.lineStyle(2, 0x00aaff, 0.8);
    dialogBg.fillRoundedRect(-150, -100, 300, 200, 10);
    dialogBg.strokeRoundedRect(-150, -100, 300, 200, 10);
    // アクセントライン
    dialogBg.fillStyle(0x00aaff, 1);
    dialogBg.fillRect(-150, -100, 300, 3);
    this.dialogContainer.add(dialogBg);

    const titleText = this.add.text(0, -70, 'RANKING ENTRY', {
      fontSize: '16px',
      color: '#00ccff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.dialogContainer.add(titleText);

    const promptText = this.add.text(0, -42, '12 characters max', {
      fontSize: '11px',
      color: '#8899aa',
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
    this.inputElement.placeholder = 'Player Name';
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
      background: #0a0a20;
      color: #ffffff;
      z-index: 1000;
      outline: none;
    `;
    document.body.appendChild(this.inputElement);
    this.inputElement.focus();

    // 登録ボタン
    const submitBtn = this.createDialogButton(0, 50, 'SUBMIT', 0x005500, async () => {
      const name = this.inputElement.value.trim();
      if (name.length === 0) {
        alert('名前を入力してください');
        return;
      }
      await this.submitRanking(name);
    });
    this.dialogContainer.add(submitBtn);

    // キャンセルボタン
    const cancelBtn = this.createDialogButton(0, 90, 'CANCEL', 0x444444, () => {
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
    bg.lineStyle(1, 0x888888, 0.6);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);

    const text = this.add.text(0, 0, label, {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(color + 0x222222, 1);
      bg.lineStyle(2, 0xffff00, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.lineStyle(1, 0x888888, 0.6);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
    });

    container.on('pointerdown', () => {
      this.soundManager.play('sfx_button_click');
      onClick();
    });

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

    this.rankingContainer = this.add.container(0, 0);

    // オーバーレイ
    this.rankOverlay = this.add.graphics();
    this.rankOverlay.fillStyle(0x000011, 0.92);
    this.rankOverlay.fillRect(0, 0, WIDTH, HEIGHT);
    this.rankingContainer.add(this.rankOverlay);

    // 順位表示
    const myRankText = this.add.text(WIDTH / 2, 35, `#${myRank}`, {
      fontSize: '36px',
      color: '#ffdd00',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.rankingContainer.add(myRankText);

    const rankLabel = this.add.text(WIDTH / 2, 62, 'YOUR RANK', {
      fontSize: '11px',
      color: '#8899aa',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);
    this.rankingContainer.add(rankLabel);

    // ランキング取得
    const result = await window.rankingManager.getTopScores(this.stageId, this.difficulty, 10);

    const titleText = this.add.text(WIDTH / 2, 90, `Stage ${this.stageId} TOP 10`, {
      fontSize: '14px',
      color: '#00aaff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.rankingContainer.add(titleText);

    // テーブルヘッダー
    let y = 115;
    const headerStyle = { fontSize: '10px', color: '#556677', fontFamily: 'sans-serif' };
    const h1 = this.add.text(50, y, '#', headerStyle);
    const h2 = this.add.text(80, y, 'NAME', headerStyle);
    const h3 = this.add.text(WIDTH - 150, y, 'SCORE', headerStyle);
    const h4 = this.add.text(WIDTH - 60, y, 'TIME', headerStyle);
    this.rankingContainer.add([h1, h2, h3, h4]);

    // 区切り線
    const headerLine = this.add.graphics();
    headerLine.lineStyle(1, 0x334455, 0.5);
    headerLine.lineBetween(40, y + 14, WIDTH - 40, y + 14);
    this.rankingContainer.add(headerLine);
    y += 22;

    const rankings = result.success && Array.isArray(result.rankings) ? result.rankings : [];

    if (rankings.length === 0) {
      const noData = this.add.text(WIDTH / 2, y + 50, 'No ranking data', {
        fontSize: '14px',
        color: '#556677',
        fontFamily: 'sans-serif'
      }).setOrigin(0.5);
      this.rankingContainer.add(noData);
    } else {
      rankings.forEach((entry, index) => {
        const rank = index + 1;
        const isMe = rank === myRank;
        const color = isMe ? '#ffdd00' : '#ccddee';
        const style = { fontSize: '12px', color: color, fontFamily: 'sans-serif' };

        // ハイライト行
        if (isMe) {
          const hlBg = this.add.graphics();
          hlBg.fillStyle(0xffdd00, 0.08);
          hlBg.fillRect(40, y - 2, WIDTH - 80, 18);
          this.rankingContainer.add(hlBg);
        }

        const name = entry.playerName || '---';
        const t1 = this.add.text(50, y, `${rank}`, style);
        const t2 = this.add.text(80, y, name, style);
        const t3 = this.add.text(WIDTH - 150, y, entry.score.toLocaleString(), style);
        const t4 = this.add.text(WIDTH - 60, y, this.formatTime(entry.clearTime), style);
        this.rankingContainer.add([t1, t2, t3, t4]);
        y += 22;
      });
    }

    // 閉じるボタン
    const closeBtn = this.createDialogButton(WIDTH / 2, HEIGHT - 50, 'CLOSE', 0x444455, () => {
      this.closeRankingResult();
    });
    this.rankingContainer.add(closeBtn);
  }

  closeRankingResult() {
    if (this.rankingContainer) {
      this.rankingContainer.destroy();
      this.rankingContainer = null;
    }
  }

  createCelebrationEffect() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    for (let i = 0; i < 40; i++) {
      const x = Math.random() * WIDTH;
      const particle = this.add.graphics();

      const colors = [0x00ff66, 0x00aaff, 0xffdd00, 0xff66ff, 0x00ffff, 0xff8800];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 2 + Math.random() * 4;

      particle.fillStyle(color, 0.8);
      // ランダムに四角 or 円
      if (Math.random() > 0.5) {
        particle.fillRect(-size / 2, -size / 2, size, size);
      } else {
        particle.fillCircle(0, 0, size / 2);
      }
      particle.x = x;
      particle.y = -20 - Math.random() * 40;

      this.tweens.add({
        targets: particle,
        y: HEIGHT + 20,
        x: x + (Math.random() - 0.5) * 150,
        rotation: Math.random() * Math.PI * 6,
        alpha: { from: 0.9, to: 0 },
        duration: 2500 + Math.random() * 1500,
        delay: Math.random() * 800,
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
