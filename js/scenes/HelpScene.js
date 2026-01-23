/**
 * HelpScene.js
 * ヘルプ画面（タブ切り替え式・スクロール対応）
 */

class HelpScene extends Phaser.Scene {
  constructor() {
    super('HelpScene');
  }

  create() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    this.currentTab = 'controls';

    // スクロール関連
    this.scrollY = 0;
    this.maxScrollY = 0;
    this.contentAreaTop = 110;
    this.contentAreaHeight = HEIGHT - 190;

    // 背景
    this.createBackground();

    // タイトル
    this.add.text(WIDTH / 2, 30, 'ヘルプ', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // タブボタン
    this.tabs = {};
    this.createTab(WIDTH / 2 - 150, 70, 'controls', '操作方法');
    this.createTab(WIDTH / 2, 70, 'difficulty', '難易度');
    this.createTab(WIDTH / 2 + 150, 70, 'enemies', '図鑑');

    // コンテンツエリア（マスク付き）
    this.contentContainer = this.add.container(0, this.contentAreaTop);
    this.setupContentMask();

    // スクロールバー
    this.createScrollbar();

    // マウスホイールイベント
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      this.handleScroll(deltaY);
    });

    // 戻るボタン（固定位置）
    this.createBackButton(WIDTH / 2, HEIGHT - 40);

    // 初期タブ表示
    this.showTab('controls');
  }

  setupContentMask() {
    const { WIDTH } = GAME_CONFIG;
    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(20, this.contentAreaTop, WIDTH - 40, this.contentAreaHeight);
    const mask = maskShape.createGeometryMask();
    this.contentContainer.setMask(mask);
  }

  createScrollbar() {
    const { WIDTH } = GAME_CONFIG;
    this.scrollbarBg = this.add.graphics();
    this.scrollbarBg.fillStyle(0x333333, 0.5);
    this.scrollbarBg.fillRect(WIDTH - 30, this.contentAreaTop, 8, this.contentAreaHeight);

    this.scrollbarThumb = this.add.graphics();
    this.scrollbarThumb.setVisible(false);
  }

  updateScrollbar() {
    const { WIDTH } = GAME_CONFIG;
    this.scrollbarThumb.clear();

    if (this.maxScrollY <= 0) {
      this.scrollbarThumb.setVisible(false);
      this.scrollbarBg.setVisible(false);
      return;
    }

    this.scrollbarBg.setVisible(true);
    this.scrollbarThumb.setVisible(true);
    const thumbHeight = Math.max(20, (this.contentAreaHeight / (this.contentAreaHeight + this.maxScrollY)) * this.contentAreaHeight);
    const thumbY = this.contentAreaTop + (this.scrollY / this.maxScrollY) * (this.contentAreaHeight - thumbHeight);

    this.scrollbarThumb.fillStyle(0x00aaff, 0.8);
    this.scrollbarThumb.fillRoundedRect(WIDTH - 30, thumbY, 8, thumbHeight, 4);
  }

  handleScroll(deltaY) {
    if (this.maxScrollY <= 0) return;

    this.scrollY += deltaY * 0.5;
    this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScrollY);
    this.contentContainer.y = this.contentAreaTop - this.scrollY;
    this.updateScrollbar();
  }

  createBackground() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    // コンテンツエリアの背景
    graphics.fillStyle(0x222244, 0.8);
    graphics.fillRoundedRect(20, 100, GAME_CONFIG.WIDTH - 40, GAME_CONFIG.HEIGHT - 180, 10);
  }

  createTab(x, y, id, label) {
    const width = 100;
    const height = 30;

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
      this.showTab(id);
    });

    this.tabs[id] = { container, bg, width, height };
    this.updateTabStyle(id, false);
  }

  updateTabStyle(id, isActive) {
    const tab = this.tabs[id];
    const { bg, width, height } = tab;

    bg.clear();
    if (isActive) {
      bg.fillStyle(0x4444aa, 1);
      bg.lineStyle(2, 0x00aaff, 1);
    } else {
      bg.fillStyle(0x333355, 1);
      bg.lineStyle(2, 0x666688, 1);
    }
    bg.fillRoundedRect(-width/2, -height/2, width, height, 5);
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 5);
  }

  showTab(tabId) {
    this.currentTab = tabId;

    // スクロール位置リセット
    this.scrollY = 0;
    this.maxScrollY = 0;
    this.contentContainer.y = this.contentAreaTop;

    // タブスタイル更新
    Object.keys(this.tabs).forEach(id => {
      this.updateTabStyle(id, id === tabId);
    });

    // コンテンツクリア
    this.contentContainer.removeAll(true);

    // コンテンツ表示
    let contentHeight = 0;
    switch (tabId) {
      case 'controls':
        contentHeight = this.showControlsContent();
        break;
      case 'difficulty':
        contentHeight = this.showDifficultyContent();
        break;
      case 'enemies':
        contentHeight = this.showEnemiesContent();
        break;
    }

    // スクロール範囲を計算
    this.maxScrollY = Math.max(0, contentHeight - this.contentAreaHeight + 20);
    this.updateScrollbar();
  }

  showControlsContent() {
    const startY = 20;
    const lineHeight = 24;
    let y = startY;

    const addLine = (text, color = '#ffffff', size = '14px') => {
      const t = this.add.text(40, y, text, {
        fontSize: size,
        color: color,
        fontFamily: 'sans-serif',
        wordWrap: { width: GAME_CONFIG.WIDTH - 100 }
      });
      this.contentContainer.add(t);
      y += lineHeight;
    };

    const addSection = (title) => {
      y += 5;
      addLine(title, '#00aaff', '16px');
      y += 5;
    };

    addSection('基本操作');
    addLine('・マウスをドラッグして光の壁を描く');
    addLine('・壁に触れたウイルスはダメージを受ける');
    addLine('・中央のCPUを守り抜こう！');

    addSection('ルール');
    addLine('・壁は同時に3本まで（アップグレードで増加）');
    addLine('・壁は5秒で消える（アップグレードで延長）');
    addLine('・短すぎる線は壁にならない（50px以上必要）');
    addLine('・長すぎる線は自動で切られる（最大300px）');

    addSection('コツ');
    addLine('・敵の進路を予測して壁を描こう');
    addLine('・複数の壁で敵を足止め！');
    addLine('・四方から来る敵に注意しよう');

    return y;
  }

  showDifficultyContent() {
    const startY = 20;
    let y = startY;

    // タイトル
    const title = this.add.text(40, y, 'ノーマルとハードの違い', {
      fontSize: '16px',
      color: '#00aaff',
      fontFamily: 'sans-serif'
    });
    this.contentContainer.add(title);
    y += 40;

    // 比較表
    const tableData = [
      ['項目', 'ノーマル', 'ハード'],
      ['壁の長さ', '300px', '200px'],
      ['敵の数', 'x1.0', 'x1.5'],
      ['敵のHP', 'x1.0', 'x1.2'],
      ['CPU HP', '10', '8']
    ];

    const colWidths = [120, 100, 100];
    const rowHeight = 30;
    const tableX = 100;

    tableData.forEach((row, rowIndex) => {
      let x = tableX;
      row.forEach((cell, colIndex) => {
        const isHeader = rowIndex === 0;
        const text = this.add.text(x, y, cell, {
          fontSize: isHeader ? '14px' : '13px',
          color: isHeader ? '#ffff00' : '#ffffff',
          fontFamily: 'sans-serif',
          fontStyle: isHeader ? 'bold' : 'normal'
        });
        this.contentContainer.add(text);
        x += colWidths[colIndex];
      });
      y += rowHeight;
    });

    y += 30;

    // 補足
    const bonus = this.add.text(40, y, 'ハードモードはやりごたえ抜群！\n腕に自信がある人は挑戦してみよう！', {
      fontSize: '14px',
      color: '#aaaaaa',
      fontFamily: 'sans-serif',
      lineSpacing: 8
    });
    this.contentContainer.add(bonus);
    y += 50;

    return y;
  }

  showEnemiesContent() {
    const enemies = [
      { name: 'バグ（小）', color: '🟢', hp: 10, speed: '速い', reward: 5, desc: '最も基本的なウイルス。数で押してくる。', stage: 1 },
      { name: 'バグ（中）', color: '🟡', hp: 25, speed: '普通', reward: 15, desc: '小型より頑丈。油断は禁物。', stage: 1 },
      { name: 'ワーム', color: '🔴', hp: 15, speed: 'とても速い', reward: 10, desc: '高速で突っ込んでくる。素早い対応が必要。', stage: 2 },
      { name: 'トロイ', color: '🟣', hp: 50, speed: '遅い', reward: 30, desc: '非常に頑丈。複数の壁で対処しよう。', stage: 3 },
      { name: 'ボマー', color: '🟠', hp: 20, speed: '速い', reward: 25, desc: '【爆発】壁に当たると自爆し、壁を破壊する！', stage: 4 },
      { name: 'シールド型', color: '🔵', hp: 15, speed: 'とても速い', reward: 35, desc: '【シールド】壁を1回だけすり抜けられる。', stage: 5 },
      { name: 'スポナー', color: '💜', hp: 40, speed: '遅い', reward: 40, desc: '【増殖】倒すと小型バグを3体召喚する！', stage: 6 },
      { name: 'ステルス型', color: '⚫', hp: 12, speed: 'とても速い', reward: 30, desc: '【透明】2秒ごとに透明/不透明を切り替える。', stage: 7 },
      { name: 'ダッシュ型', color: '💛', hp: 25, speed: '速い', reward: 30, desc: '【突進】3秒ごとに1秒間高速移動する。', stage: 8 },
      { name: 'ランサム', color: '⬛', hp: 80, speed: '普通', reward: 50, desc: '最強のウイルス。全力で迎え撃て！', stage: 10 }
    ];

    let y = 10;

    enemies.forEach(enemy => {
      // アイコンと名前
      const header = this.add.text(40, y, `${enemy.color} ${enemy.name}`, {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        fontStyle: 'bold'
      });
      this.contentContainer.add(header);

      // 登場ステージ
      const stageText = this.add.text(GAME_CONFIG.WIDTH - 100, y, `Stage ${enemy.stage}〜`, {
        fontSize: '11px',
        color: '#666666',
        fontFamily: 'sans-serif'
      });
      this.contentContainer.add(stageText);
      y += 18;

      // ステータス
      const stats = this.add.text(60, y, `HP: ${enemy.hp} / 速度: ${enemy.speed} / 報酬: ${enemy.reward}`, {
        fontSize: '11px',
        color: '#aaaaaa',
        fontFamily: 'sans-serif'
      });
      this.contentContainer.add(stats);
      y += 16;

      // 説明
      const desc = this.add.text(60, y, enemy.desc, {
        fontSize: '11px',
        color: '#888888',
        fontFamily: 'sans-serif'
      });
      this.contentContainer.add(desc);
      y += 26;
    });

    return y;
  }

  createBackButton(x, y) {
    const width = 150;
    const height = 40;
    const color = 0x666666;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.lineStyle(2, 0xffffff, 1);
    bg.fillRoundedRect(-width/2, -height/2, width, height, 8);
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 8);

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
}

window.HelpScene = HelpScene;
