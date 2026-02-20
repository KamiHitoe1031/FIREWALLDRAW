/**
 * HelpScene.js
 * ルール説明・ヘルプ画面（実際のゲーム素材を使用したリッチ版）
 * ページ切り替え式: 基本ルール → 壁の種類 → 敵図鑑
 */

class HelpScene extends Phaser.Scene {
  constructor() {
    super('HelpScene');
  }

  create() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    this.pageIndex = 0;
    this.totalPages = 3;

    // 背景
    if (this.textures.exists('bg_game')) {
      this.add.image(WIDTH / 2, HEIGHT / 2, 'bg_game').setDisplaySize(WIDTH, HEIGHT);
    }
    const overlay = this.add.graphics();
    overlay.fillStyle(0x0a0a1e, 0.82);
    overlay.fillRect(0, 0, WIDTH, HEIGHT);

    // ヘッダー
    this.add.text(WIDTH / 2, 22, 'HOW TO PLAY', {
      fontSize: '22px', color: '#00ccff', fontFamily: 'sans-serif', fontStyle: 'bold'
    }).setOrigin(0.5);

    // ページインジケーター
    this.pageLabels = ['基本ルール', '壁の種類', '敵図鑑'];
    this.indicatorTexts = [];
    for (let i = 0; i < this.totalPages; i++) {
      const t = this.add.text(WIDTH / 2 + (i - 1) * 120, 48, this.pageLabels[i], {
        fontSize: '12px', color: '#556677', fontFamily: 'sans-serif'
      }).setOrigin(0.5);
      this.indicatorTexts.push(t);
    }
    this.indicatorBar = this.add.graphics();

    // コンテンツコンテナ
    this.contentContainer = this.add.container(0, 0);

    // ナビゲーションボタン
    this.prevBtn = this.createNavButton(50, HEIGHT / 2, '<', () => this.changePage(-1));
    this.nextBtn = this.createNavButton(WIDTH - 50, HEIGHT / 2, '>', () => this.changePage(1));

    // 戻るボタン
    this.createBackButton(WIDTH / 2, HEIGHT - 30);

    // 初期ページ表示
    this.showPage(0);
  }

  changePage(delta) {
    const newIndex = this.pageIndex + delta;
    if (newIndex < 0 || newIndex >= this.totalPages) return;
    this.showPage(newIndex);
  }

  showPage(index) {
    this.pageIndex = index;

    // インジケーター更新
    this.indicatorTexts.forEach((t, i) => {
      t.setColor(i === index ? '#00ccff' : '#445566');
      t.setFontStyle(i === index ? 'bold' : 'normal');
    });
    this.indicatorBar.clear();
    this.indicatorBar.fillStyle(0x00ccff, 1);
    const barX = GAME_CONFIG.WIDTH / 2 + (index - 1) * 120;
    this.indicatorBar.fillRoundedRect(barX - 30, 58, 60, 2, 1);

    // ナビボタン表示制御
    this.prevBtn.setVisible(index > 0);
    this.nextBtn.setVisible(index < this.totalPages - 1);

    // コンテンツ切替
    this.contentContainer.removeAll(true);

    switch (index) {
      case 0: this.showBasicRules(); break;
      case 1: this.showWallTypes(); break;
      case 2: this.showEnemyGuide(); break;
    }
  }

  // ==============================
  // Page 1: 基本ルール
  // ==============================
  showBasicRules() {
    const { WIDTH } = GAME_CONFIG;
    const c = this.contentContainer;
    let y = 75;

    // --- セクション1: CPUを守れ ---
    const cpuKey = this.textures.exists('cpu_happy') ? 'cpu_happy' : null;
    if (cpuKey) {
      const cpu = this.add.image(80, y + 45, cpuKey).setScale(0.5);
      c.add(cpu);
      this.tweens.add({ targets: cpu, y: y + 41, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    const sec1Title = this.add.text(cpuKey ? 145 : 40, y, 'CPUちゃんを守れ！', {
      fontSize: '17px', color: '#00ff66', fontFamily: 'sans-serif', fontStyle: 'bold'
    });
    c.add(sec1Title);
    y += 24;

    const sec1Desc = this.add.text(cpuKey ? 145 : 40, y, [
      '中央にいるCPUちゃんがウイルスに',
      '攻撃されるとHPが減ります。',
      'HPが0になるとゲームオーバー！'
    ].join('\n'), {
      fontSize: '12px', color: '#aabbcc', fontFamily: 'sans-serif', lineSpacing: 5
    });
    c.add(sec1Desc);
    y += 65;

    // --- 区切り線 ---
    c.add(this.createDivider(y));
    y += 12;

    // --- セクション2: 壁を描いて防衛 ---
    const wallIcon = this.textures.exists('icon_wall_basic') ? 'icon_wall_basic' : null;
    if (wallIcon) {
      const icon = this.add.image(80, y + 40, wallIcon).setScale(0.7);
      c.add(icon);
    }

    const sec2Title = this.add.text(wallIcon ? 125 : 40, y, 'マウスで壁を描いて防衛', {
      fontSize: '17px', color: '#00aaff', fontFamily: 'sans-serif', fontStyle: 'bold'
    });
    c.add(sec2Title);
    y += 24;

    const sec2Desc = this.add.text(wallIcon ? 125 : 40, y, [
      'ドラッグで光の壁を描きます。',
      '壁に触れたウイルスはダメージを受けます。',
    ].join('\n'), {
      fontSize: '12px', color: '#aabbcc', fontFamily: 'sans-serif', lineSpacing: 5
    });
    c.add(sec2Desc);
    y += 45;

    // --- 区切り線 ---
    c.add(this.createDivider(y));
    y += 12;

    // --- セクション3: ルール詳細 ---
    const rules = [
      { icon: '||', text: '壁は同時に3本まで（アップグレードで増加）' },
      { icon: '>>',  text: '壁は5秒で消える（アップグレードで延長）' },
      { icon: '~~',  text: '短い線は壁にならない（50px以上必要）' },
      { icon: '<>',  text: '敵は上下左右から同時に攻めてくる！' },
    ];

    const sec3Title = this.add.text(40, y, 'ルール', {
      fontSize: '15px', color: '#ffdd00', fontFamily: 'sans-serif', fontStyle: 'bold'
    });
    c.add(sec3Title);
    y += 22;

    rules.forEach(rule => {
      const bullet = this.add.graphics();
      bullet.fillStyle(0x00aaff, 0.6);
      bullet.fillCircle(52, y + 7, 4);
      c.add(bullet);

      const text = this.add.text(66, y, rule.text, {
        fontSize: '11px', color: '#ccddee', fontFamily: 'sans-serif'
      });
      c.add(text);
      y += 20;
    });

    y += 10;
    // --- 区切り線 ---
    c.add(this.createDivider(y));
    y += 12;

    // --- セクション4: コツ ---
    const sec4Title = this.add.text(40, y, 'コツ', {
      fontSize: '15px', color: '#ff8800', fontFamily: 'sans-serif', fontStyle: 'bold'
    });
    c.add(sec4Title);
    y += 22;

    const tips = [
      '敵の進路を先読みして壁を描こう',
      '複数の壁でジグザグに迎撃すると効率的',
      'ボマーは壁を壊すので要注意！',
    ];

    tips.forEach(tip => {
      const star = this.add.text(44, y, '*', { fontSize: '12px', color: '#ff8800', fontFamily: 'sans-serif' });
      c.add(star);
      const text = this.add.text(66, y, tip, { fontSize: '11px', color: '#ccddee', fontFamily: 'sans-serif' });
      c.add(text);
      y += 20;
    });
  }

  // ==============================
  // Page 2: 壁の種類
  // ==============================
  showWallTypes() {
    const { WIDTH } = GAME_CONFIG;
    const c = this.contentContainer;
    let y = 75;

    const wallTypes = [
      {
        id: 'basic', name: '基本の壁', icon: 'icon_wall_basic',
        color: '#00aaff', desc: 'スタンダードな壁。バランスの良いダメージ。',
        stats: 'ダメージ: 10 / 特殊効果: なし',
        unlock: '最初から使用可能'
      },
      {
        id: 'fire', name: '炎の壁', icon: 'icon_wall_fire',
        color: '#ff6600', desc: '触れた敵に継続ダメージ（DoT）を与える。',
        stats: 'ダメージ: 15 / 特殊: 3秒間DoT',
        unlock: 'ステージ3クリアで購入可能（300コイン）'
      },
      {
        id: 'ice', name: '氷の壁', icon: 'icon_wall_ice',
        color: '#00ffff', desc: '触れた敵の移動速度を大幅に低下させる。',
        stats: 'ダメージ: 5 / 特殊: 80%スロー（2秒）',
        unlock: 'ステージ5クリアで購入可能（500コイン）'
      }
    ];

    wallTypes.forEach((wall, index) => {
      // パネル背景
      const panel = this.add.graphics();
      panel.fillStyle(0x111133, 0.6);
      panel.fillRoundedRect(40, y, WIDTH - 80, 120, 8);
      const accent = parseInt(wall.color.replace('#', '0x'));
      panel.lineStyle(1, accent, 0.5);
      panel.strokeRoundedRect(40, y, WIDTH - 80, 120, 8);
      // アクセントライン
      panel.fillStyle(accent, 1);
      panel.fillRect(40, y, 4, 120);
      c.add(panel);

      // アイコン
      if (this.textures.exists(wall.icon)) {
        const icon = this.add.image(90, y + 40, wall.icon).setScale(0.9);
        c.add(icon);
      }

      // 名前
      const nameText = this.add.text(130, y + 10, wall.name, {
        fontSize: '16px', color: wall.color, fontFamily: 'sans-serif', fontStyle: 'bold'
      });
      c.add(nameText);

      // 説明
      const descText = this.add.text(130, y + 32, wall.desc, {
        fontSize: '11px', color: '#aabbcc', fontFamily: 'sans-serif',
        wordWrap: { width: WIDTH - 200 }
      });
      c.add(descText);

      // ステータス
      const statsText = this.add.text(130, y + 55, wall.stats, {
        fontSize: '11px', color: '#88aacc', fontFamily: 'sans-serif'
      });
      c.add(statsText);

      // アンロック条件
      const unlockText = this.add.text(130, y + 78, wall.unlock, {
        fontSize: '10px', color: '#666688', fontFamily: 'sans-serif'
      });
      c.add(unlockText);

      // 壁のビジュアルプレビュー（ミニ版）
      const preview = this.add.graphics();
      const px = WIDTH - 110;
      const py = y + 40;
      // グロー
      preview.lineStyle(12, accent, 0.15);
      preview.lineBetween(px - 25, py - 15, px + 25, py + 15);
      // メイン
      preview.lineStyle(6, accent, 0.7);
      preview.lineBetween(px - 25, py - 15, px + 25, py + 15);
      // コア
      preview.lineStyle(2, 0xffffff, 0.5);
      preview.lineBetween(px - 25, py - 15, px + 25, py + 15);
      c.add(preview);

      y += 140;
    });
  }

  // ==============================
  // Page 3: 敵図鑑
  // ==============================
  showEnemyGuide() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const c = this.contentContainer;

    // スクロール用
    this.enemyScrollY = 0;
    this.enemyContentContainer = this.add.container(0, 0);
    c.add(this.enemyContentContainer);

    // マスク設定
    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(30, 68, WIDTH - 60, HEIGHT - 145);
    this.enemyContentContainer.setMask(maskShape.createGeometryMask());

    let y = 72;

    const enemies = [
      { name: 'バグ（小）', sprite: 'enemy_bug_small', hp: 10, speed: '速い', reward: 5,
        desc: '最も基本的なウイルス。数で押してくる。', stage: 1, color: '#44ff44' },
      { name: 'バグ（中）', sprite: 'enemy_bug_medium', hp: 25, speed: '普通', reward: 15,
        desc: '小型より頑丈。油断は禁物。', stage: 1, color: '#ffff00' },
      { name: 'ワーム', sprite: 'enemy_worm', hp: 15, speed: 'とても速い', reward: 10,
        desc: '高速で突っ込んでくる。素早い対応が必要。', stage: 2, color: '#ff4444' },
      { name: 'トロイ', sprite: 'enemy_trojan', hp: 50, speed: '遅い', reward: 30,
        desc: '非常に頑丈。複数の壁で対処しよう。', stage: 3, color: '#aa44ff' },
      { name: 'ボマー', sprite: 'enemy_bomber', hp: 20, speed: '速い', reward: 25,
        desc: '壁に当たると自爆し、壁を破壊する！', stage: 4, special: '爆発', color: '#ff8800' },
      { name: 'シールド型', sprite: 'enemy_shield', hp: 15, speed: 'とても速い', reward: 35,
        desc: '壁を1回だけすり抜けられる。', stage: 5, special: 'すり抜け', color: '#00ccff' },
      { name: 'スポナー', sprite: 'enemy_spawner', hp: 40, speed: '遅い', reward: 40,
        desc: '倒すと小型バグを3体召喚する。', stage: 6, special: '増殖', color: '#cc44ff' },
      { name: 'ステルス型', sprite: 'enemy_stealth', hp: 12, speed: 'とても速い', reward: 30,
        desc: '2秒ごとに透明/不透明を切り替える。', stage: 7, special: '透明化', color: '#888888' },
      { name: 'ダッシュ型', sprite: 'enemy_dasher', hp: 25, speed: '速い', reward: 30,
        desc: '3秒ごとに1秒間高速移動する。', stage: 8, special: '突進', color: '#ffee00' },
      { name: 'ランサム', sprite: 'enemy_ransom', hp: 80, speed: '普通', reward: 50,
        desc: '最強のボスウイルス。全力で迎え撃て！', stage: 10, special: 'BOSS', color: '#ff3333' }
    ];

    enemies.forEach((enemy, index) => {
      const ec = this.enemyContentContainer;

      // 行背景（交互色）
      const rowBg = this.add.graphics();
      rowBg.fillStyle(index % 2 === 0 ? 0x111133 : 0x0a0a22, 0.5);
      rowBg.fillRect(35, y - 2, WIDTH - 70, 44);
      ec.add(rowBg);

      // 敵スプライト
      if (this.textures.exists(enemy.sprite)) {
        const sprite = this.add.image(65, y + 20, enemy.sprite);
        // フレーム0のみ表示のためcropは不要（Phaser画像は自動でフレーム0）
        sprite.setDisplaySize(32, 32);
        ec.add(sprite);
      } else {
        const placeholder = this.add.graphics();
        placeholder.fillStyle(parseInt(enemy.color.replace('#', '0x')), 0.8);
        placeholder.fillCircle(65, y + 20, 14);
        ec.add(placeholder);
      }

      // 名前
      const nameText = this.add.text(95, y + 2, enemy.name, {
        fontSize: '13px', color: enemy.color, fontFamily: 'sans-serif', fontStyle: 'bold'
      });
      ec.add(nameText);

      // 特殊能力バッジ
      if (enemy.special) {
        const badgeBg = this.add.graphics();
        const bx = 95 + nameText.width + 8;
        badgeBg.fillStyle(0x442200, 0.7);
        badgeBg.fillRoundedRect(bx, y + 3, enemy.special.length * 9 + 10, 16, 8);
        ec.add(badgeBg);

        const badgeText = this.add.text(bx + 5, y + 5, enemy.special, {
          fontSize: '9px', color: '#ff8800', fontFamily: 'sans-serif'
        });
        ec.add(badgeText);
      }

      // ステータス行
      const statsStr = `HP:${enemy.hp}  速度:${enemy.speed}  報酬:${enemy.reward}`;
      const stats = this.add.text(95, y + 20, statsStr, {
        fontSize: '10px', color: '#778899', fontFamily: 'sans-serif'
      });
      ec.add(stats);

      // 説明
      const desc = this.add.text(95, y + 33, enemy.desc, {
        fontSize: '9px', color: '#556677', fontFamily: 'sans-serif'
      });
      ec.add(desc);

      // 登場ステージ
      const stageTag = this.add.text(WIDTH - 85, y + 8, `Stage ${enemy.stage}`, {
        fontSize: '10px', color: '#445566', fontFamily: 'sans-serif'
      });
      ec.add(stageTag);

      y += 46;
    });

    this.enemyContentHeight = y - 72;

    // スクロールイベント
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      if (this.pageIndex !== 2) return;
      const maxScroll = Math.max(0, this.enemyContentHeight - (HEIGHT - 145));
      this.enemyScrollY = Phaser.Math.Clamp(this.enemyScrollY + deltaY * 0.5, 0, maxScroll);
      this.enemyContentContainer.y = -this.enemyScrollY;
    });
  }

  // ==============================
  // UI共通ヘルパー
  // ==============================

  createDivider(y) {
    const { WIDTH } = GAME_CONFIG;
    const line = this.add.graphics();
    line.lineStyle(1, 0x334466, 0.4);
    line.lineBetween(50, y, WIDTH - 50, y);
    return line;
  }

  createNavButton(x, y, label, onClick) {
    const size = 36;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x222244, 0.7);
    bg.lineStyle(1, 0x00aaff, 0.5);
    bg.fillCircle(0, 0, size / 2);
    bg.strokeCircle(0, 0, size / 2);

    const text = this.add.text(0, 0, label, {
      fontSize: '18px', color: '#00ccff', fontFamily: 'sans-serif', fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(size, size);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x334466, 0.9);
      bg.lineStyle(2, 0x00ccff, 1);
      bg.fillCircle(0, 0, size / 2);
      bg.strokeCircle(0, 0, size / 2);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x222244, 0.7);
      bg.lineStyle(1, 0x00aaff, 0.5);
      bg.fillCircle(0, 0, size / 2);
      bg.strokeCircle(0, 0, size / 2);
    });

    container.on('pointerdown', onClick);
    return container;
  }

  createBackButton(x, y) {
    const width = 120;
    const height = 32;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x333344, 0.9);
    bg.lineStyle(1, 0x556677, 0.8);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);

    const text = this.add.text(0, 0, 'BACK', {
      fontSize: '13px', color: '#aabbcc', fontFamily: 'sans-serif', fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x444466, 0.95);
      bg.lineStyle(2, 0x00ccff, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
      text.setColor('#ffffff');
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x333344, 0.9);
      bg.lineStyle(1, 0x556677, 0.8);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
      text.setColor('#aabbcc');
    });

    container.on('pointerdown', () => {
      this.scene.start('TitleScene');
    });
  }
}

window.HelpScene = HelpScene;
