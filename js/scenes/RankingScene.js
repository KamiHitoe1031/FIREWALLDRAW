/**
 * RankingScene.js
 * オンラインランキング表示画面
 */

class RankingScene extends Phaser.Scene {
  constructor() {
    super('RankingScene');
  }

  init(data) {
    this.selectedStage = data.stageId || 1;
    this.selectedDifficulty = data.difficulty || 'normal';
    this.fromScene = data.fromScene || 'StageSelectScene';
  }

  create() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // 背景
    this.createBackground();

    // タイトル
    this.add.text(WIDTH / 2, 30, 'オンラインランキング', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // ステージ選択
    this.createStageSelector(WIDTH / 2, 70);

    // 難易度タブ
    this.difficultyTabs = {};
    this.createDifficultyTab(WIDTH / 2 - 80, 110, 'normal', 'ノーマル');
    this.createDifficultyTab(WIDTH / 2 + 80, 110, 'hard', 'ハード');
    this.updateDifficultyTabs();

    // ランキングコンテナ
    this.rankingContainer = this.add.container(0, 150);

    // 戻るボタン
    this.createBackButton(WIDTH / 2, HEIGHT - 40);

    // ランキング読み込み
    this.loadRankings();
  }

  createBackground() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const graphics = this.add.graphics();
    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillRect(0, 0, WIDTH, HEIGHT);

    // ランキングエリア背景
    graphics.fillStyle(0x222244, 0.8);
    graphics.fillRoundedRect(20, 140, WIDTH - 40, HEIGHT - 210, 10);
  }

  createStageSelector(x, y) {
    const stages = window.gameData?.stages || DEFAULT_DATA.stages;
    const maxStage = stages.length;

    // 左矢印
    this.leftArrow = this.add.text(x - 120, y, '<', {
      fontSize: '24px',
      color: '#00aaff',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.leftArrow.on('pointerdown', () => {
      if (this.selectedStage > 1) {
        this.selectedStage--;
        this.updateStageDisplay();
        this.loadRankings();
      }
    });

    // ステージ表示
    this.stageText = this.add.text(x, y, '', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);
    this.updateStageDisplay();

    // 右矢印
    this.rightArrow = this.add.text(x + 120, y, '>', {
      fontSize: '24px',
      color: '#00aaff',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.rightArrow.on('pointerdown', () => {
      if (this.selectedStage < maxStage) {
        this.selectedStage++;
        this.updateStageDisplay();
        this.loadRankings();
      }
    });
  }

  updateStageDisplay() {
    const stages = window.gameData?.stages || DEFAULT_DATA.stages;
    const stage = stages.find(s => s.id === this.selectedStage);
    const name = stage ? stage.name : `ステージ ${this.selectedStage}`;
    this.stageText.setText(`Stage ${this.selectedStage}: ${name}`);

    // 矢印の有効/無効表示
    this.leftArrow.setAlpha(this.selectedStage > 1 ? 1 : 0.3);
    this.rightArrow.setAlpha(this.selectedStage < stages.length ? 1 : 0.3);
  }

  createDifficultyTab(x, y, id, label) {
    const width = 100;
    const height = 28;

    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    container.add(bg);

    const text = this.add.text(0, 0, label, {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);
    container.add(text);

    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      this.selectedDifficulty = id;
      this.updateDifficultyTabs();
      this.loadRankings();
    });

    this.difficultyTabs[id] = { container, bg, width, height };
  }

  updateDifficultyTabs() {
    Object.keys(this.difficultyTabs).forEach(id => {
      const tab = this.difficultyTabs[id];
      const isActive = id === this.selectedDifficulty;
      const { bg, width, height } = tab;

      bg.clear();
      if (isActive) {
        bg.fillStyle(id === 'hard' ? 0xaa4444 : 0x4444aa, 1);
        bg.lineStyle(2, 0xffffff, 1);
      } else {
        bg.fillStyle(0x333355, 1);
        bg.lineStyle(2, 0x666688, 1);
      }
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 5);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 5);
    });
  }

  async loadRankings() {
    const { WIDTH } = GAME_CONFIG;

    // ローディング表示
    this.rankingContainer.removeAll(true);
    const loading = this.add.text(WIDTH / 2, 100, '読み込み中...', {
      fontSize: '16px',
      color: '#888888',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);
    this.rankingContainer.add(loading);

    try {
      // API呼び出し（タイムアウト付き）
      const result = await window.rankingManager.getTopScores(
        this.selectedStage,
        this.selectedDifficulty,
        20
      );

      // シーンが既に破棄されていたら何もしない
      if (!this.scene || !this.scene.isActive()) return;

      this.rankingContainer.removeAll(true);

      if (!result.success) {
        this.showError(result.error || '通信エラーが発生しました');
        return;
      }

      this.displayRankings(result.rankings || []);
    } catch (e) {
      console.error('[RankingScene] loadRankings エラー:', e);
      if (this.scene && this.scene.isActive()) {
        this.rankingContainer.removeAll(true);
        this.showError('ランキングの読み込みに失敗しました');
      }
    }
  }

  displayRankings(rankings) {
    const { WIDTH } = GAME_CONFIG;
    const startY = 10;
    const rowHeight = 28;

    if (rankings.length === 0) {
      const noData = this.add.text(WIDTH / 2, 100, 'まだランキングがありません', {
        fontSize: '16px',
        color: '#888888',
        fontFamily: 'sans-serif'
      }).setOrigin(0.5);
      this.rankingContainer.add(noData);
      return;
    }

    // ヘッダー
    const headerY = startY;
    const headers = [
      { x: 50, text: '順位', width: 50 },
      { x: 130, text: 'プレイヤー', width: 120 },
      { x: 280, text: 'スコア', width: 100 },
      { x: 380, text: 'タイム', width: 80 }
    ];

    headers.forEach(h => {
      const text = this.add.text(h.x, headerY, h.text, {
        fontSize: '12px',
        color: '#888888',
        fontFamily: 'sans-serif'
      });
      this.rankingContainer.add(text);
    });

    // 区切り線
    const line = this.add.graphics();
    line.lineStyle(1, 0x444466, 1);
    line.moveTo(40, headerY + 20);
    line.lineTo(WIDTH - 40, headerY + 20);
    line.strokePath();
    this.rankingContainer.add(line);

    // ランキングデータ
    rankings.forEach((entry, index) => {
      const y = startY + 30 + index * rowHeight;
      const rank = index + 1;

      // 順位に応じた色
      let rankColor = '#ffffff';
      if (rank === 1) rankColor = '#ffd700';
      else if (rank === 2) rankColor = '#c0c0c0';
      else if (rank === 3) rankColor = '#cd7f32';

      // 順位
      const rankText = this.add.text(50, y, `${rank}`, {
        fontSize: '14px',
        color: rankColor,
        fontFamily: 'sans-serif',
        fontStyle: rank <= 3 ? 'bold' : 'normal'
      });
      this.rankingContainer.add(rankText);

      // プレイヤー名
      const nameText = this.add.text(130, y, entry.playerName || '---', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'sans-serif'
      });
      this.rankingContainer.add(nameText);

      // スコア
      const scoreText = this.add.text(280, y, entry.score.toLocaleString(), {
        fontSize: '14px',
        color: '#00ff00',
        fontFamily: 'sans-serif'
      });
      this.rankingContainer.add(scoreText);

      // タイム
      const timeStr = window.rankingManager.formatTime(entry.clearTime);
      const timeText = this.add.text(380, y, timeStr, {
        fontSize: '14px',
        color: '#aaaaaa',
        fontFamily: 'sans-serif'
      });
      this.rankingContainer.add(timeText);
    });
  }

  showError(message) {
    const { WIDTH } = GAME_CONFIG;
    const errorText = this.add.text(WIDTH / 2, 100, message, {
      fontSize: '14px',
      color: '#ff6666',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);
    this.rankingContainer.add(errorText);

    // リトライボタン
    const retryBtn = this.createButton(WIDTH / 2, 150, '再読み込み', 0x666666);
    retryBtn.on('pointerdown', () => {
      this.loadRankings();
    });
    this.rankingContainer.add(retryBtn);
  }

  createButton(x, y, label, color) {
    const width = 120;
    const height = 35;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.lineStyle(2, 0xffffff, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);

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
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.lineStyle(2, 0xffffff, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    });

    return container;
  }

  createBackButton(x, y) {
    const width = 150;
    const height = 40;
    const color = 0x666666;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.lineStyle(2, 0xffffff, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);

    const text = this.add.text(0, 0, '戻る', {
      fontSize: '16px',
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
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.lineStyle(2, 0xffffff, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    });

    container.on('pointerdown', () => {
      this.scene.start(this.fromScene, {
        difficulty: this.selectedDifficulty
      });
    });
  }
}

window.RankingScene = RankingScene;
