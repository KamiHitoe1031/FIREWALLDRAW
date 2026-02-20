/**
 * BriefingScene.js
 * ステージ開始前のブリーフィング画面
 * 出現する敵の情報・ステージ注意点を表示
 */

class BriefingScene extends Phaser.Scene {
  constructor() {
    super('BriefingScene');
  }

  init(data) {
    this.stageId = data.stageId || 1;
    this.difficulty = data.difficulty || 'normal';
  }

  create() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    this.soundManager = new SoundManager(this);

    // ステージデータ取得
    const stagesData = this.cache.json.get('stages') || DEFAULT_DATA.stages;
    this.stageData = stagesData.find(s => s.id === this.stageId) || stagesData[0];
    const enemiesData = this.cache.json.get('enemies') || DEFAULT_DATA.enemies;

    // 背景
    if (this.textures.exists('bg_game')) {
      this.add.image(WIDTH / 2, HEIGHT / 2, 'bg_game').setDisplaySize(WIDTH, HEIGHT);
    }
    const overlay = this.add.graphics();
    overlay.fillStyle(0x0a0a1e, 0.88);
    overlay.fillRect(0, 0, WIDTH, HEIGHT);

    // --- ヘッダー ---
    const diffName = DIFFICULTY_SETTINGS[this.difficulty].name;
    this.add.text(WIDTH / 2, 20, `STAGE ${this.stageId}`, {
      fontSize: '14px', color: '#556677', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 45, this.stageData.name, {
      fontSize: '26px', color: '#00ccff', fontFamily: 'sans-serif', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 72, `【${diffName}】`, {
      fontSize: '12px', color: '#888899', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // 区切り線
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x334466, 0.5);
    divider.lineBetween(60, 88, WIDTH - 60, 88);

    // --- ステージ説明（description がある場合） ---
    let contentY = 98;
    if (this.stageData.description) {
      const descBg = this.add.graphics();
      descBg.fillStyle(0x443300, 0.3);
      descBg.fillRoundedRect(50, contentY, WIDTH - 100, 30, 6);
      descBg.lineStyle(1, 0xff8800, 0.4);
      descBg.strokeRoundedRect(50, contentY, WIDTH - 100, 30, 6);

      this.add.text(WIDTH / 2, contentY + 15, this.stageData.description, {
        fontSize: '13px', color: '#ffaa44', fontFamily: 'sans-serif', fontStyle: 'bold'
      }).setOrigin(0.5);
      contentY += 42;
    }

    // --- ステージ情報 ---
    const infoY = contentY;
    const infoBg = this.add.graphics();
    infoBg.fillStyle(0x111133, 0.5);
    infoBg.fillRoundedRect(50, infoY, WIDTH - 100, 40, 6);

    const cpuHp = this.stageData.cpuHp || 10;
    const waveCount = this.stageData.waves ? this.stageData.waves.length : 0;
    const reward = this.stageData.reward || 0;

    this.add.text(130, infoY + 20, `CPU HP: ${cpuHp}`, {
      fontSize: '13px', color: '#44ff44', fontFamily: 'sans-serif'
    }).setOrigin(0.5);
    this.add.text(WIDTH / 2, infoY + 20, `WAVE: ${waveCount}`, {
      fontSize: '13px', color: '#44aaff', fontFamily: 'sans-serif'
    }).setOrigin(0.5);
    this.add.text(WIDTH - 130, infoY + 20, `報酬: ${reward}`, {
      fontSize: '13px', color: '#ffdd00', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    contentY = infoY + 52;

    // --- 出現する敵一覧 ---
    // ステージのウェーブから敵IDを抽出
    const enemyIds = this.extractEnemyIds(this.stageData.waves);
    const uniqueEnemies = this.getEnemyDetails(enemyIds, enemiesData);

    this.add.text(60, contentY, '出現する敵', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: 'bold'
    });
    contentY += 22;

    // 敵カード表示
    const cardWidth = (WIDTH - 120) / 2;
    const cardHeight = 60;
    const cardGap = 8;

    uniqueEnemies.forEach((enemy, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const cx = 55 + col * (cardWidth + cardGap);
      const cy = contentY + row * (cardHeight + cardGap);

      this.createEnemyCard(cx, cy, cardWidth, cardHeight, enemy);
    });

    // --- 注意点・ヒント ---
    const tipsY = contentY + Math.ceil(uniqueEnemies.length / 2) * (cardHeight + cardGap) + 8;
    const tips = this.generateTips(uniqueEnemies, this.stageData);

    if (tips.length > 0) {
      const tipsBg = this.add.graphics();
      const tipsHeight = tips.length * 18 + 16;
      tipsBg.fillStyle(0x002244, 0.3);
      tipsBg.fillRoundedRect(50, tipsY, WIDTH - 100, tipsHeight, 6);
      tipsBg.lineStyle(1, 0x0066aa, 0.3);
      tipsBg.strokeRoundedRect(50, tipsY, WIDTH - 100, tipsHeight, 6);

      this.add.text(60, tipsY + 6, 'TIPS', {
        fontSize: '11px', color: '#0088cc', fontFamily: 'sans-serif', fontStyle: 'bold'
      });

      tips.forEach((tip, i) => {
        this.add.text(100, tipsY + 8 + i * 18, tip, {
          fontSize: '11px', color: '#88aacc', fontFamily: 'sans-serif'
        });
      });
    }

    // --- ボタン ---
    const btnY = HEIGHT - 50;
    this.createStartButton(WIDTH / 2, btnY);
    this.createBackButton(120, btnY);
  }

  /**
   * ウェーブデータから出現する敵IDの一覧を抽出
   */
  extractEnemyIds(waves) {
    const ids = new Set();
    if (!waves) return ids;
    waves.forEach(wave => {
      const parts = wave.enemies.split(',');
      parts.forEach(part => {
        const [id] = part.trim().split(':');
        ids.add(id);
      });
    });
    return ids;
  }

  /**
   * 敵IDから敵詳細データを取得し、表示用の情報を付加
   */
  getEnemyDetails(enemyIds, enemiesData) {
    // 敵の特殊能力の日本語マップ
    const specialNames = {
      'explode_wall': '壁を破壊',
      'shield_once': '1回すり抜け',
      'spawn_on_death': '死亡時召喚',
      'stealth': '透明化',
      'dash': '突進'
    };

    const speedLabels = (speed) => {
      if (speed >= 120) return 'とても速い';
      if (speed >= 80) return '速い';
      if (speed >= 50) return '普通';
      return '遅い';
    };

    const colorMap = {
      'bug_small': '#44ff44',
      'bug_medium': '#ffff00',
      'worm': '#ff4444',
      'trojan': '#aa44ff',
      'ransom': '#ff3333',
      'bomber': '#ff8800',
      'shield': '#00ccff',
      'spawner': '#cc44ff',
      'stealth': '#888888',
      'dasher': '#ffee00'
    };

    const results = [];
    enemyIds.forEach(id => {
      const data = enemiesData.find(e => e.id === id);
      if (!data) return;
      results.push({
        ...data,
        speedLabel: speedLabels(data.speed),
        specialName: data.special ? specialNames[data.special] || data.special : null,
        color: colorMap[data.id] || '#aaaaaa',
        spriteKey: `enemy_${data.id}`
      });
    });

    // 登場順: special なし → あり の順でソート
    results.sort((a, b) => {
      if (a.special && !b.special) return 1;
      if (!a.special && b.special) return -1;
      return 0;
    });

    return results;
  }

  /**
   * 敵カードを1つ描画
   */
  createEnemyCard(x, y, w, h, enemy) {
    const bg = this.add.graphics();
    bg.fillStyle(0x111122, 0.6);
    bg.fillRoundedRect(x, y, w, h, 5);

    // 左辺アクセントライン
    const accent = parseInt(enemy.color.replace('#', '0x'));
    bg.fillStyle(accent, 0.8);
    bg.fillRect(x, y, 3, h);

    // スプライト
    if (this.textures.exists(enemy.spriteKey)) {
      const sprite = this.add.image(x + 24, y + h / 2, enemy.spriteKey);
      sprite.setDisplaySize(32, 32);
    } else {
      const placeholder = this.add.graphics();
      placeholder.fillStyle(accent, 0.7);
      placeholder.fillCircle(x + 24, y + h / 2, 12);
    }

    // 名前
    this.add.text(x + 48, y + 6, enemy.name, {
      fontSize: '12px', color: enemy.color, fontFamily: 'sans-serif', fontStyle: 'bold'
    });

    // ステータス
    const statsStr = `HP:${enemy.hp}  速度:${enemy.speedLabel}`;
    this.add.text(x + 48, y + 24, statsStr, {
      fontSize: '10px', color: '#778899', fontFamily: 'sans-serif'
    });

    // 特殊能力バッジ
    if (enemy.specialName) {
      const badgeX = x + 48;
      const badgeY = y + 40;
      const badgeBg = this.add.graphics();
      badgeBg.fillStyle(0x442200, 0.7);
      const badgeWidth = enemy.specialName.length * 10 + 12;
      badgeBg.fillRoundedRect(badgeX, badgeY, badgeWidth, 15, 7);

      this.add.text(badgeX + 6, badgeY + 2, enemy.specialName, {
        fontSize: '9px', color: '#ff8800', fontFamily: 'sans-serif', fontStyle: 'bold'
      });
    }
  }

  /**
   * ステージの敵構成に応じたヒントを生成
   */
  generateTips(enemies, stageData) {
    const tips = [];
    const specials = enemies.filter(e => e.special).map(e => e.special);

    if (specials.includes('explode_wall')) {
      tips.push('ボマーは壁に触れると自爆し壁を破壊する。離れた場所に迎撃壁を！');
    }
    if (specials.includes('shield_once')) {
      tips.push('シールド型は壁を1回すり抜ける。2重の壁で対処しよう。');
    }
    if (specials.includes('spawn_on_death')) {
      tips.push('スポナーを倒すと小型バグ3体が出現。CPUから遠い位置で倒すこと。');
    }
    if (specials.includes('stealth')) {
      tips.push('ステルス型は透明化中も壁でダメージを受ける。幅広く壁を張ろう。');
    }
    if (specials.includes('dash')) {
      tips.push('ダッシュ型は突然加速する。長い壁で広範囲をカバーしよう。');
    }

    // ウェーブ数が多い場合
    if (stageData.waves && stageData.waves.length >= 5) {
      tips.push('ウェーブ数が多い長期戦。壁を効率的に使おう。');
    }

    // 一般的なヒント（ヒントが少ない場合に追加）
    if (tips.length === 0) {
      if (this.stageId <= 2) {
        tips.push('壁はドラッグで自由に描ける。敵の進路を塞ぐように描こう。');
      } else {
        tips.push('複数方向から同時に攻めてくる。優先順位を見極めよう。');
      }
    }

    return tips;
  }

  createStartButton(x, y) {
    const width = 200;
    const height = 48;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x006600, 1);
    bg.lineStyle(2, 0x00ff44, 0.8);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);

    const text = this.add.text(0, 0, 'START', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    // パルスアニメーション
    this.tweens.add({
      targets: container,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x008800, 1);
      bg.lineStyle(3, 0x44ff66, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x006600, 1);
      bg.lineStyle(2, 0x00ff44, 0.8);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    });

    container.on('pointerdown', () => {
      this.soundManager.play('sfx_button_click');
      this.startGame();
    });
  }

  createBackButton(x, y) {
    const width = 100;
    const height = 36;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x333344, 0.9);
    bg.lineStyle(1, 0x556677, 0.8);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);

    const text = this.add.text(0, 0, '< 戻る', {
      fontSize: '13px', color: '#aabbcc', fontFamily: 'sans-serif'
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
      this.soundManager.play('sfx_button_click');
      this.scene.start('StageSelectScene', { difficulty: this.difficulty });
    });
  }

  startGame() {
    this.scene.start('GameScene', {
      stageId: this.stageId,
      difficulty: this.difficulty
    });
    this.scene.launch('UIScene', {
      stageId: this.stageId,
      difficulty: this.difficulty
    });
  }
}

window.BriefingScene = BriefingScene;
