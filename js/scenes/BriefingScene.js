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

    // キャラクター補正を反映したHP表示
    const charId = SaveManager.getSelectedCharacter();
    const charData = CHARACTER_DATA[charId] || CHARACTER_DATA.standard;
    const saveData = SaveManager.load();
    const cpuUpgrade = saveData.upgrades?.cpu_hp || 0;
    let displayHp = cpuHp + (cpuUpgrade * 2) + charData.modifiers.cpuHp;
    if (this.difficulty === 'hard') displayHp = Math.max(1, displayHp - 2);
    else displayHp = Math.max(1, displayHp);

    this.cpuHpText = this.add.text(130, infoY + 20, `CPU HP: ${displayHp}`, {
      fontSize: '13px', color: '#44ff44', fontFamily: 'sans-serif'
    }).setOrigin(0.5);
    this.baseCpuHp = cpuHp;

    this.add.text(WIDTH / 2, infoY + 20, `WAVE: ${waveCount}`, {
      fontSize: '13px', color: '#44aaff', fontFamily: 'sans-serif'
    }).setOrigin(0.5);
    this.add.text(WIDTH - 130, infoY + 20, `報酬: ${reward}`, {
      fontSize: '13px', color: '#ffdd00', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    contentY = infoY + 52;

    // --- キャラクター選択 ---
    contentY = this.createCharacterSelector(contentY);

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
    const cardHeight = 52;
    const cardGap = 6;

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

  // === キャラクター選択 ===

  createCharacterSelector(y) {
    const { WIDTH } = GAME_CONFIG;
    const characters = Object.values(CHARACTER_DATA);
    const selectedId = SaveManager.getSelectedCharacter();

    // セクションラベル + 所持コイン
    const coins = SaveManager.getCoins();
    this.add.text(60, y, 'キャラクター選択', {
      fontSize: '12px', color: '#8899aa', fontFamily: 'sans-serif'
    });
    this.coinsText = this.add.text(WIDTH - 60, y, `${coins} coins`, {
      fontSize: '12px', color: '#ffdd00', fontFamily: 'sans-serif'
    }).setOrigin(1, 0);
    y += 18;

    // キャラカード配置
    const cardWidth = 130;
    const cardHeight = 80;
    const gap = 6;
    const totalWidth = characters.length * cardWidth + (characters.length - 1) * gap;
    const startX = (WIDTH - totalWidth) / 2;

    this.charCards = [];
    this.charCardBaseY = y;

    characters.forEach((char, index) => {
      const cx = startX + index * (cardWidth + gap) + cardWidth / 2;
      const cy = y + cardHeight / 2;
      const isUnlocked = SaveManager.isCharacterUnlocked(char.id);

      const card = this.createCharCard(cx, cy, cardWidth, cardHeight, char, char.id === selectedId, isUnlocked);
      this.charCards.push(card);
    });

    return y + cardHeight + 8;
  }

  createCharCard(x, y, w, h, charData, isSelected, isUnlocked) {
    const container = this.add.container(x, y);

    // 背景
    const bg = this.add.graphics();
    this.drawCharCardBg(bg, w, h, charData.color, isSelected, isUnlocked);

    // キャラ画像（スプライトシートのフレーム0 = happy）
    const sheetKey = `char_${charData.id}`;
    let charImage = null;
    if (this.textures.exists(sheetKey)) {
      charImage = this.add.sprite(0, -10, sheetKey, 0);
      charImage.setDisplaySize(40, 40);
      if (!isUnlocked) charImage.setTint(0x333333);
    } else {
      // プレースホルダー
      const ph = this.add.graphics();
      ph.fillStyle(charData.color, isUnlocked ? 0.5 : 0.2);
      ph.fillCircle(0, -10, 18);
      container.add(ph);
    }

    // キャラ名
    const name = this.add.text(0, 14, charData.name, {
      fontSize: '11px',
      color: isUnlocked ? (isSelected ? '#ffffff' : '#aabbcc') : '#666677',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // ロック時: コスト表示 / アンロック時: ステータス修正
    let bottomLabel;
    if (isUnlocked) {
      const modText = this.getModifierText(charData.modifiers);
      bottomLabel = this.add.text(0, h / 2 - 10, modText, {
        fontSize: '9px', color: '#aaddcc', fontFamily: 'sans-serif'
      }).setOrigin(0.5);
    } else {
      bottomLabel = this.add.text(0, h / 2 - 10, `${charData.unlockCost} coins`, {
        fontSize: '10px', color: '#ffdd00', fontFamily: 'sans-serif', fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    const elements = [bg, name, bottomLabel];
    if (charImage) elements.splice(1, 0, charImage);
    container.add(elements);

    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      this.soundManager.play('sfx_button_click');
      if (isUnlocked) {
        this.selectCharacter(charData.id);
      } else {
        this.showUnlockConfirm(charData);
      }
    });

    container.on('pointerover', () => {
      if (isUnlocked && SaveManager.getSelectedCharacter() !== charData.id) {
        name.setColor('#ffffff');
      }
    });

    container.on('pointerout', () => {
      if (isUnlocked && SaveManager.getSelectedCharacter() !== charData.id) {
        name.setColor('#aabbcc');
      }
    });

    container.charData = charData;
    container.bg = bg;
    container.nameText = name;
    container.bottomLabel = bottomLabel;
    container.charImage = charImage;
    container.cardW = w;
    container.cardH = h;
    container.isUnlocked = isUnlocked;

    return container;
  }

  drawCharCardBg(bg, w, h, color, isSelected, isUnlocked) {
    bg.clear();
    if (!isUnlocked) {
      bg.fillStyle(0x111122, 0.7);
      bg.lineStyle(1, 0x333344, 0.5);
    } else if (isSelected) {
      bg.fillStyle(color, 0.6);
      bg.lineStyle(2, 0xffffff, 1);
    } else {
      bg.fillStyle(0x222233, 0.5);
      bg.lineStyle(1, 0x445566, 0.5);
    }
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
  }

  getModifierText(mods) {
    const parts = [];
    if (mods.maxWalls !== 0) parts.push(`壁${mods.maxWalls > 0 ? '+' : ''}${mods.maxWalls}`);
    if (mods.wallDuration !== 0) parts.push(`持続${mods.wallDuration > 0 ? '+' : ''}${mods.wallDuration / 1000}秒`);
    if (mods.cpuHp !== 0) parts.push(`HP${mods.cpuHp > 0 ? '+' : ''}${mods.cpuHp}`);
    if (mods.wallDamageMultiplier !== 0) parts.push(`ダメx${(1 + mods.wallDamageMultiplier).toFixed(1)}`);
    return parts.length === 0 ? 'バランス型' : parts.join(' / ');
  }

  /**
   * アンロック確認ダイアログ表示
   */
  showUnlockConfirm(charData) {
    if (this.unlockOverlay) return;

    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const coins = SaveManager.getCoins();
    const canAfford = coins >= charData.unlockCost;

    this.unlockOverlay = this.add.container(0, 0);

    // 半透明背景
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRect(0, 0, WIDTH, HEIGHT);
    bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, WIDTH, HEIGHT), Phaser.Geom.Rectangle.Contains);
    this.unlockOverlay.add(bg);

    // ダイアログ枠
    const dlgW = 320;
    const dlgH = 200;
    const dlgX = WIDTH / 2 - dlgW / 2;
    const dlgY = HEIGHT / 2 - dlgH / 2;
    const dlg = this.add.graphics();
    dlg.fillStyle(0x1a1a2e, 0.95);
    dlg.lineStyle(2, charData.color, 0.8);
    dlg.fillRoundedRect(dlgX, dlgY, dlgW, dlgH, 10);
    dlg.strokeRoundedRect(dlgX, dlgY, dlgW, dlgH, 10);
    this.unlockOverlay.add(dlg);

    // キャラ画像
    const sheetKey = `char_${charData.id}`;
    if (this.textures.exists(sheetKey)) {
      const img = this.add.sprite(WIDTH / 2, dlgY + 50, sheetKey, 0);
      img.setDisplaySize(56, 56);
      this.unlockOverlay.add(img);
    }

    // キャラ名
    this.unlockOverlay.add(this.add.text(WIDTH / 2, dlgY + 88, charData.name, {
      fontSize: '16px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: 'bold'
    }).setOrigin(0.5));

    // 説明
    this.unlockOverlay.add(this.add.text(WIDTH / 2, dlgY + 108, charData.description, {
      fontSize: '11px', color: '#aabbcc', fontFamily: 'sans-serif'
    }).setOrigin(0.5));

    // コスト表示
    const costColor = canAfford ? '#ffdd00' : '#ff4444';
    const costMsg = canAfford
      ? `${charData.unlockCost} coins で解放する`
      : `コインが足りません（${coins} / ${charData.unlockCost}）`;
    this.unlockOverlay.add(this.add.text(WIDTH / 2, dlgY + 135, costMsg, {
      fontSize: '12px', color: costColor, fontFamily: 'sans-serif'
    }).setOrigin(0.5));

    // 解放ボタン（コインが足りる場合のみ有効）
    if (canAfford) {
      const btnContainer = this.add.container(WIDTH / 2 - 60, dlgY + 168);
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0x006600, 1);
      btnBg.lineStyle(2, 0x00ff44, 0.8);
      btnBg.fillRoundedRect(-50, -14, 100, 28, 6);
      btnBg.strokeRoundedRect(-50, -14, 100, 28, 6);
      const btnText = this.add.text(0, 0, '解放する', {
        fontSize: '13px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: 'bold'
      }).setOrigin(0.5);
      btnContainer.add([btnBg, btnText]);
      btnContainer.setSize(100, 28);
      btnContainer.setInteractive({ useHandCursor: true });
      btnContainer.on('pointerdown', () => {
        this.soundManager.play('sfx_coin_reward');
        const result = SaveManager.unlockCharacter(charData.id);
        if (result.success) {
          this.hideUnlockConfirm();
          this.refreshCharacterCards();
        }
      });
      this.unlockOverlay.add(btnContainer);
    }

    // キャンセルボタン
    const cancelX = canAfford ? WIDTH / 2 + 60 : WIDTH / 2;
    const cancelContainer = this.add.container(cancelX, dlgY + 168);
    const cancelBg = this.add.graphics();
    cancelBg.fillStyle(0x333344, 1);
    cancelBg.lineStyle(1, 0x556677, 0.8);
    cancelBg.fillRoundedRect(-50, -14, 100, 28, 6);
    cancelBg.strokeRoundedRect(-50, -14, 100, 28, 6);
    const cancelText = this.add.text(0, 0, '戻る', {
      fontSize: '13px', color: '#aabbcc', fontFamily: 'sans-serif'
    }).setOrigin(0.5);
    cancelContainer.add([cancelBg, cancelText]);
    cancelContainer.setSize(100, 28);
    cancelContainer.setInteractive({ useHandCursor: true });
    cancelContainer.on('pointerdown', () => {
      this.soundManager.play('sfx_button_click');
      this.hideUnlockConfirm();
    });
    this.unlockOverlay.add(cancelContainer);
  }

  hideUnlockConfirm() {
    if (this.unlockOverlay) {
      this.unlockOverlay.destroy();
      this.unlockOverlay = null;
    }
  }

  /**
   * アンロック後にカード一覧を再構築
   */
  refreshCharacterCards() {
    const selectedId = SaveManager.getSelectedCharacter();
    const characters = Object.values(CHARACTER_DATA);

    // 既存カードを破棄
    this.charCards.forEach(card => card.destroy());
    this.charCards = [];

    // カード再配置
    const { WIDTH } = GAME_CONFIG;
    const cardWidth = 130;
    const cardHeight = 80;
    const gap = 6;
    const totalWidth = characters.length * cardWidth + (characters.length - 1) * gap;
    const startX = (WIDTH - totalWidth) / 2;

    // charSelectorY はcreateCharacterSelectorで設定されたカードの先頭Y座標を復元
    const y = this.charCardBaseY;

    characters.forEach((char, index) => {
      const cx = startX + index * (cardWidth + gap) + cardWidth / 2;
      const cy = y + cardHeight / 2;
      const isUnlocked = SaveManager.isCharacterUnlocked(char.id);

      const card = this.createCharCard(cx, cy, cardWidth, cardHeight, char, char.id === selectedId, isUnlocked);
      this.charCards.push(card);
    });

    // コイン表示を更新
    if (this.coinsText) {
      this.coinsText.setText(`${SaveManager.getCoins()} coins`);
    }
  }

  selectCharacter(charId) {
    SaveManager.setSelectedCharacter(charId);

    // カードのビジュアル更新
    this.charCards.forEach(card => {
      const isSelected = card.charData.id === charId;
      this.drawCharCardBg(card.bg, card.cardW, card.cardH, card.charData.color, isSelected, card.isUnlocked);
      if (card.isUnlocked) {
        card.nameText.setColor(isSelected ? '#ffffff' : '#aabbcc');
      }
    });

    // CPU HP表示を更新
    this.updateCpuHpDisplay(charId);
  }

  updateCpuHpDisplay(charId) {
    if (!this.cpuHpText || !this.baseCpuHp) return;
    const charData = CHARACTER_DATA[charId] || CHARACTER_DATA.standard;
    const saveData = SaveManager.load();
    const cpuUpgrade = saveData.upgrades?.cpu_hp || 0;
    let displayHp = this.baseCpuHp + (cpuUpgrade * 2) + charData.modifiers.cpuHp;
    if (this.difficulty === 'hard') displayHp = Math.max(1, displayHp - 2);
    else displayHp = Math.max(1, displayHp);
    this.cpuHpText.setText(`CPU HP: ${displayHp}`);
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
