/**
 * GameScene.js
 * メインゲームシーン
 */

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    console.log('[GameScene] init called with data:', data);

    // 難易度とステージ情報
    this.stageId = data.stageId || 1;
    this.difficulty = data.difficulty || 'normal';
    this.difficultySettings = DIFFICULTY_SETTINGS[this.difficulty];

    // アップグレードデータ読み込み
    const saveData = SaveManager.load();
    const upgrades = saveData.upgrades || { wall_duration: 0, wall_damage: 0, wall_count: 0, cpu_hp: 0 };

    // キャラクター補正
    this.selectedCharacterId = SaveManager.getSelectedCharacter();
    const characterData = CHARACTER_DATA[this.selectedCharacterId] || CHARACTER_DATA.standard;
    const charMods = characterData.modifiers;

    // 壁関連（キャラクター補正込み）
    this.walls = [];
    this.currentLine = [];
    this.isDrawing = false;
    this.lastDrawTime = 0;
    this.drawCooldown = 500;
    this.maxWalls = Math.max(1, 3 + upgrades.wall_count + charMods.maxWalls);
    this.wallDuration = Math.max(2000, 5000 + (upgrades.wall_duration * 1000) + charMods.wallDuration);
    this.wallMinLength = 50;
    this.wallMaxLength = this.difficultySettings.wallMaxLength;
    this.wallThickness = 16;
    this.wallDamageMultiplier = 1 + (upgrades.wall_damage * 0.2) + charMods.wallDamageMultiplier;
    this.characterCpuHpModifier = charMods.cpuHp;

    // 敵関連
    this.enemies = [];
    this.enemyGroup = null;
    this.enemyCountMultiplier = this.difficultySettings.enemyCountMultiplier;
    this.enemyHpMultiplier = this.difficultySettings.enemyHpMultiplier;

    // ウェーブ関連
    this.waveTimer = null;
    this.spawnTimer = null;
    this.waveEnemies = [];
    this.spawnIndex = 0;
    this.currentWave = 0;
    this.waveStarted = false;
    this.waveCleared = false;

    // ゲーム状態
    this.score = 0;
    this.cpuHp = 0;
    this.cpuMaxHp = 0;
    this.isGameOver = false;
    this.isCleared = false;

    // 統計情報
    this.stats = {
      wallsUsed: 0,
      totalKills: 0,
      multiKillCount: 0,
      damageTaken: 0,
      clearTime: 0
    };
    this.startTime = 0;

    // データ
    this.enemiesData = null;
    this.wallsData = null;
    this.stagesData = null;
    this.currentStageData = null;
    this.currentWaveData = null;
    this.selectedWallType = 'basic';
  }

  create() {
    console.log('[GameScene] create() called - stageId:', this.stageId, 'difficulty:', this.difficulty);

    try {
      this.assetManager = new AssetManager(this);
      this.soundManager = new SoundManager(this);

      // データ読み込み
      this.enemiesData = this.cache.json.get('enemies') || DEFAULT_DATA.enemies;
      this.wallsData = this.cache.json.get('walls') || DEFAULT_DATA.walls;
      this.stagesData = this.cache.json.get('stages') || DEFAULT_DATA.stages;

      console.log('[GameScene] ステージデータ読み込み完了:', this.stagesData.length, '個');

      // ステージデータ取得
      this.currentStageData = this.stagesData.find(s => s.id === this.stageId) || this.stagesData[0];
      console.log('[GameScene] 現在のステージ:', this.currentStageData ? this.currentStageData.name : 'なし');

    // CPU HP設定（ステージ基本値 + アップグレード + キャラクター補正）
    const cpuSaveData = SaveManager.load();
    const cpuUpgrade = cpuSaveData.upgrades?.cpu_hp || 0;
    this.cpuMaxHp = this.currentStageData.cpuHp + (cpuUpgrade * 2) + this.characterCpuHpModifier;

    // ハードモードではCPU HP減少
    if (this.difficulty === 'hard') {
      this.cpuMaxHp = Math.max(1, this.cpuMaxHp - 2);
    } else {
      this.cpuMaxHp = Math.max(1, this.cpuMaxHp);
    }

    this.cpuHp = this.cpuMaxHp;

    // 背景
    this.createBackground();

    // CPU
    this.createCPU();

    // 描画用Graphics
    this.drawGraphics = this.add.graphics();

    // 敵アニメーション定義（スプライトシートが存在する場合のみ）
    const enemyAnims = [
      { key: 'bug_small_idle', texture: 'enemy_bug_small' },
      { key: 'bug_medium_idle', texture: 'enemy_bug_medium' },
      { key: 'worm_idle', texture: 'enemy_worm' },
      { key: 'trojan_idle', texture: 'enemy_trojan' },
      { key: 'ransom_idle', texture: 'enemy_ransom' },
      { key: 'bomber_idle', texture: 'enemy_bomber' },
      { key: 'shield_idle', texture: 'enemy_shield' },
      { key: 'spawner_idle', texture: 'enemy_spawner' },
      { key: 'stealth_idle', texture: 'enemy_stealth' },
      { key: 'dasher_idle', texture: 'enemy_dasher' },
    ];
    for (const anim of enemyAnims) {
      if (this.textures.exists(anim.texture) && !this.anims.exists(anim.key)) {
        this.anims.create({
          key: anim.key,
          frames: this.anims.generateFrameNumbers(anim.texture, { start: 0, end: 1 }),
          frameRate: 4,
          repeat: -1
        });
      }
    }

    // 敵グループ
    this.enemyGroup = this.physics.add.group();

    // 入力イベント
    this.setupInputEvents();

    // ウェーブ開始（少し遅延）
    this.time.delayedCall(1000, () => this.startWave());

    // 開始時刻記録
    this.startTime = Date.now();

    console.log('[GameScene] create() 完了');
    } catch (error) {
      console.error('[GameScene] create() でエラー発生:', error);
    }
  }

  createBackground() {
    if (this.textures.exists('bg_game')) {
      this.add.image(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 'bg_game');
    } else {
      this.createPlaceholderBackground();
    }
  }

  createPlaceholderBackground() {
    const graphics = this.add.graphics();

    // 背景色（濃い緑）
    graphics.fillStyle(0x004400, 1);
    graphics.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    // グリッド線（薄い緑）
    graphics.lineStyle(1, 0x006600, 0.5);

    // 縦線
    for (let x = 0; x <= GAME_CONFIG.WIDTH; x += 32) {
      graphics.lineBetween(x, 0, x, GAME_CONFIG.HEIGHT);
    }
    // 横線
    for (let y = 0; y <= GAME_CONFIG.HEIGHT; y += 32) {
      graphics.lineBetween(0, y, GAME_CONFIG.WIDTH, y);
    }

    // 回路パターン風の装飾
    graphics.fillStyle(0x008800, 0.3);
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * GAME_CONFIG.WIDTH;
      const y = Math.random() * GAME_CONFIG.HEIGHT;
      const w = 16 + Math.random() * 48;
      const h = 16 + Math.random() * 48;
      graphics.fillRect(x, y, w, h);
    }
  }

  createCPU() {
    const { CPU_X, CPU_Y } = GAME_CONFIG;
    const charId = this.selectedCharacterId || 'standard';

    // 表情フレーム: 2×2グリッド（左上=happy, 右上=worried, 左下=scared, 右下=critical）
    this.cpuExpressionFrames = { happy: 0, worried: 1, scared: 2, critical: 3 };

    // キャラクタースプライトシート → 汎用個別画像 → プレースホルダーのフォールバック
    const sheetKey = `char_${charId}`;
    this.cpuUseSheet = this.textures.exists(sheetKey);
    this.cpuUseFallbackImages = !this.cpuUseSheet && this.textures.exists('cpu_happy');
    this.useCpuImages = this.cpuUseSheet || this.cpuUseFallbackImages;
    this.cpuSheetKey = sheetKey;

    // CPUコンテナ
    this.cpuContainer = this.add.container(CPU_X, CPU_Y);

    if (this.cpuUseSheet) {
      // スプライトシート版CPU（フレーム0 = happy）
      this.cpuSprite = this.add.sprite(0, 0, sheetKey, 0);
      this.cpuSprite.setDisplaySize(128, 128);
      this.cpuContainer.add(this.cpuSprite);
    } else if (this.cpuUseFallbackImages) {
      // 個別画像フォールバック版CPU
      this.cpuSprite = this.add.image(0, 0, 'cpu_happy');
      this.cpuSprite.setDisplaySize(128, 128);
      this.cpuContainer.add(this.cpuSprite);
    } else {
      // プレースホルダー版CPU
      const cpuGraphics = this.add.graphics();
      cpuGraphics.fillStyle(0x00aaff, 1);
      cpuGraphics.lineStyle(3, 0xffffff, 1);
      cpuGraphics.fillRect(-32, -32, 64, 64);
      cpuGraphics.strokeRect(-32, -32, 64, 64);

      // 内部パターン
      cpuGraphics.lineStyle(1, 0xffffff, 0.5);
      for (let i = -24; i <= 24; i += 8) {
        cpuGraphics.lineBetween(i, -24, i, 24);
        cpuGraphics.lineBetween(-24, i, 24, i);
      }

      this.cpuContainer.add(cpuGraphics);

      // 顔文字
      this.cpuFace = this.add.text(0, 0, '😊', {
        fontSize: '32px'
      }).setOrigin(0.5);
      this.cpuContainer.add(this.cpuFace);
    }

    // 物理ボディ
    this.physics.add.existing(this.cpuContainer, true);
    this.cpuContainer.body.setSize(64, 64);
    this.cpuContainer.body.setOffset(-32, -32);
  }

  updateCPUExpression() {
    const ratio = this.cpuHp / this.cpuMaxHp;

    if (this.useCpuImages && this.cpuSprite) {
      // HP状態に応じた表情を決定
      let expression = 'happy';
      if (ratio <= 0.25) expression = 'critical';
      else if (ratio <= 0.5) expression = 'scared';
      else if (ratio <= 0.75) expression = 'worried';

      if (this.cpuUseSheet) {
        // スプライトシート版: フレーム切り替え
        const frame = this.cpuExpressionFrames[expression];
        if (this.cpuSprite.frame.name !== frame) {
          this.cpuSprite.setFrame(frame);
        }
      } else {
        // 個別画像フォールバック版: テクスチャ切り替え
        const textureKey = `cpu_${expression}`;
        if (this.cpuSprite.texture.key !== textureKey && this.textures.exists(textureKey)) {
          this.cpuSprite.setTexture(textureKey);
          this.cpuSprite.setDisplaySize(128, 128);
        }
      }
    } else if (this.cpuFace) {
      // プレースホルダー版: 顔文字切り替え
      let expression = '😊';
      if (ratio <= 0.25) expression = '😱';
      else if (ratio <= 0.5) expression = '😨';
      else if (ratio <= 0.8) expression = '😰';

      this.cpuFace.setText(expression);
    }
  }

  setupInputEvents() {
    // ゲームエリア内のみ描画可能
    this.input.on('pointerdown', (pointer) => {
      if (this.isGameOver || this.isCleared) return;
      if (!this.canStartDrawing(pointer)) return;
      this.startDrawing(pointer);
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.isDrawing) return;
      this.continueDrawing(pointer);
    });

    this.input.on('pointerup', () => {
      if (!this.isDrawing) return;
      this.finishDrawing();
    });
  }

  canStartDrawing(pointer) {
    // クールダウンチェック
    if (Date.now() - this.lastDrawTime < this.drawCooldown) return false;

    // ゲームエリア内チェック
    if (pointer.y < GAME_CONFIG.UI_TOP_HEIGHT || pointer.y > GAME_CONFIG.GAME_AREA_BOTTOM) {
      return false;
    }

    return true;
  }

  startDrawing(pointer) {
    this.isDrawing = true;
    this.currentLine = [{ x: pointer.x, y: pointer.y }];
    this.drawGraphics.clear();
  }

  continueDrawing(pointer) {
    const lastPoint = this.currentLine[this.currentLine.length - 1];
    const dist = Phaser.Math.Distance.Between(lastPoint.x, lastPoint.y, pointer.x, pointer.y);

    // 5px以上離れたら点を追加
    if (dist >= 5) {
      this.currentLine.push({ x: pointer.x, y: pointer.y });

      // 最大長さチェック
      const totalLength = this.calculateLineLength();
      if (totalLength > this.wallMaxLength) {
        this.finishDrawing();
        return;
      }

      // 描画プレビュー
      this.drawPreviewLine();
    }
  }

  drawPreviewLine() {
    this.drawGraphics.clear();
    const wallData = this.getWallData(this.selectedWallType);
    let color = parseInt(wallData.color);
    if (isNaN(color)) color = 0x00aaff;
    const wallStyle = Wall.getWallStyle(wallData.id, color);

    // グロー層
    this.drawGraphics.lineStyle(28, wallStyle.glow, 0.2);
    this.drawGraphics.beginPath();
    this.drawGraphics.moveTo(this.currentLine[0].x, this.currentLine[0].y);
    for (let i = 1; i < this.currentLine.length; i++) {
      this.drawGraphics.lineTo(this.currentLine[i].x, this.currentLine[i].y);
    }
    this.drawGraphics.strokePath();

    // メイン層
    this.drawGraphics.lineStyle(this.wallThickness, color, 0.5);
    this.drawGraphics.beginPath();
    this.drawGraphics.moveTo(this.currentLine[0].x, this.currentLine[0].y);
    for (let i = 1; i < this.currentLine.length; i++) {
      this.drawGraphics.lineTo(this.currentLine[i].x, this.currentLine[i].y);
    }
    this.drawGraphics.strokePath();

    // コア層
    this.drawGraphics.lineStyle(3, wallStyle.core, 0.35);
    this.drawGraphics.beginPath();
    this.drawGraphics.moveTo(this.currentLine[0].x, this.currentLine[0].y);
    for (let i = 1; i < this.currentLine.length; i++) {
      this.drawGraphics.lineTo(this.currentLine[i].x, this.currentLine[i].y);
    }
    this.drawGraphics.strokePath();
  }

  finishDrawing() {
    this.isDrawing = false;
    this.drawGraphics.clear();

    // 長さチェック
    const totalLength = this.calculateLineLength();
    if (totalLength < this.wallMinLength) {
      this.soundManager.play('sfx_draw_cancel');
      return; // 短すぎる
    }

    // 壁数チェック
    while (this.walls.length >= this.maxWalls) {
      const oldWall = this.walls.shift();
      oldWall.destroy();
    }

    // 壁を作成
    this.createWall(this.currentLine);
    this.lastDrawTime = Date.now();
    this.currentLine = [];
  }

  calculateLineLength() {
    let length = 0;
    for (let i = 1; i < this.currentLine.length; i++) {
      length += Phaser.Math.Distance.Between(
        this.currentLine[i - 1].x, this.currentLine[i - 1].y,
        this.currentLine[i].x, this.currentLine[i].y
      );
    }
    return length;
  }

  createWall(points) {
    const wallData = this.getWallData(this.selectedWallType);
    const wall = new Wall(this, points, wallData, this.wallDuration, this.wallDamageMultiplier);

    // 壁の長さを計算
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      length += Phaser.Math.Distance.Between(
        points[i - 1].x, points[i - 1].y,
        points[i].x, points[i].y
      );
    }
    wall.length = length;
    wall.killCount = 0;

    this.walls.push(wall);
    this.stats.wallsUsed++;
    this.soundManager.play('sfx_draw');
  }

  getWallData(wallId) {
    return this.wallsData.find(w => w.id === wallId) || {
      id: 'basic',
      name: '基本の壁',
      damage: 10,
      color: '0x00aaff',
      slowPercent: 0,
      dotDamage: 0
    };
  }

  // === 敵システム ===

  startWave() {
    if (!this.currentStageData || !this.currentStageData.waves) {
      console.warn('ステージデータがありません');
      return;
    }

    // ウェーブデータ取得
    this.currentWaveData = this.currentStageData.waves[this.currentWave];
    if (!this.currentWaveData) {
      // 全ウェーブクリア
      this.stageClear();
      return;
    }

    this.waveStarted = true;
    this.waveCleared = false;

    // 侵入方向予告
    this.showDirectionWarning(this.currentWaveData.directions);

    // 3秒後にスポーン開始
    this.time.delayedCall(3000, () => {
      this.parseWaveEnemies();
      this.startSpawning();
    });
  }

  showDirectionWarning(directions) {
    this.soundManager.play('sfx_wave_start');
    const arrows = [];

    directions.forEach(dir => {
      let x, y, rotation;

      switch (dir) {
        case 'top':
          x = GAME_CONFIG.WIDTH / 2;
          y = GAME_CONFIG.UI_TOP_HEIGHT + 40;
          rotation = Math.PI / 2;
          break;
        case 'bottom':
          x = GAME_CONFIG.WIDTH / 2;
          y = GAME_CONFIG.GAME_AREA_BOTTOM - 40;
          rotation = -Math.PI / 2;
          break;
        case 'left':
          x = 40;
          y = GAME_CONFIG.HEIGHT / 2;
          rotation = 0;
          break;
        case 'right':
          x = GAME_CONFIG.WIDTH - 40;
          y = GAME_CONFIG.HEIGHT / 2;
          rotation = Math.PI;
          break;
      }

      const arrow = this.createWarningArrow(x, y, rotation);
      arrows.push(arrow);
    });

    // 点滅アニメーション
    this.tweens.add({
      targets: arrows,
      alpha: { from: 1, to: 0.3 },
      duration: 300,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        arrows.forEach(a => a.destroy());
      }
    });
  }

  createWarningArrow(x, y, rotation) {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xff0000, 1);
    graphics.lineStyle(2, 0xffffff, 1);

    // 矢印形状
    graphics.fillTriangle(20, 0, -15, 15, -15, -15);
    graphics.strokeTriangle(20, 0, -15, 15, -15, -15);

    graphics.x = x;
    graphics.y = y;
    graphics.rotation = rotation;

    return graphics;
  }

  parseWaveEnemies() {
    // "bug_small:8,worm:3" → [敵ID配列]
    this.waveEnemies = [];
    const enemyStrings = this.currentWaveData.enemies.split(',');

    enemyStrings.forEach(str => {
      const [id, countStr] = str.split(':');
      let count = parseInt(countStr);

      // 難易度による敵数補正
      count = Math.ceil(count * this.enemyCountMultiplier);

      for (let i = 0; i < count; i++) {
        this.waveEnemies.push(id.trim());
      }
    });

    // シャッフル
    Phaser.Utils.Array.Shuffle(this.waveEnemies);
    this.spawnIndex = 0;
  }

  startSpawning() {
    const interval = this.currentWaveData.spawnInterval || 1000;

    this.spawnTimer = this.time.addEvent({
      delay: interval,
      callback: () => this.spawnNextEnemy(),
      loop: true
    });

    // 最初の1体をすぐスポーン
    this.spawnNextEnemy();
  }

  spawnNextEnemy() {
    if (this.spawnIndex >= this.waveEnemies.length) {
      // スポーン完了
      if (this.spawnTimer) {
        this.spawnTimer.remove();
        this.spawnTimer = null;
      }
      return;
    }

    const enemyId = this.waveEnemies[this.spawnIndex];
    this.spawnIndex++;

    // ランダムな方向を選択
    const direction = Phaser.Utils.Array.GetRandom(this.currentWaveData.directions);
    this.spawnEnemy(enemyId, direction);
  }

  spawnEnemy(enemyId, direction) {
    const baseData = this.getEnemyData(enemyId);
    if (!baseData) return;

    // 難易度によるHP補正
    const enemyData = {
      ...baseData,
      hp: Math.ceil(baseData.hp * this.enemyHpMultiplier)
    };

    // スポーン位置
    let x, y;
    const margin = 20;

    switch (direction) {
      case 'top':
        x = Phaser.Math.Between(50, GAME_CONFIG.WIDTH - 50);
        y = GAME_CONFIG.UI_TOP_HEIGHT + margin;
        break;
      case 'bottom':
        x = Phaser.Math.Between(50, GAME_CONFIG.WIDTH - 50);
        y = GAME_CONFIG.GAME_AREA_BOTTOM - margin;
        break;
      case 'left':
        x = margin;
        y = Phaser.Math.Between(GAME_CONFIG.UI_TOP_HEIGHT + 50, GAME_CONFIG.GAME_AREA_BOTTOM - 50);
        break;
      case 'right':
      default:
        x = GAME_CONFIG.WIDTH - margin;
        y = Phaser.Math.Between(GAME_CONFIG.UI_TOP_HEIGHT + 50, GAME_CONFIG.GAME_AREA_BOTTOM - 50);
        break;
    }

    // 敵を作成
    const enemy = new Enemy(this, x, y, enemyId, enemyData);

    // 特殊能力の初期化
    const now = Date.now();
    enemy.lastStealthToggle = now;
    enemy.lastDashToggle = now;

    this.enemies.push(enemy);
    this.enemyGroup.add(enemy.sprite);
  }

  getEnemyData(enemyId) {
    return this.enemiesData.find(e => e.id === enemyId);
  }

  // === 更新処理 ===

  update(time, delta) {
    if (this.isGameOver || this.isCleared) return;

    // 壁の更新
    this.updateWalls(delta);

    // 敵の更新
    this.updateEnemies(delta);

    // 当たり判定
    this.checkCollisions();

    // ウェーブクリアチェック
    this.checkWaveClear();

    // ゲームオーバーチェック
    if (this.cpuHp <= 0 && !this.isGameOver) {
      this.gameOver();
    }
  }

  updateWalls(delta) {
    for (let i = this.walls.length - 1; i >= 0; i--) {
      const wall = this.walls[i];
      wall.update(delta);

      if (wall.isExpired()) {
        // マルチキルボーナス判定
        if (wall.killCount >= 2) {
          const bonus = wall.killCount * 50;
          this.score += bonus;
          this.stats.multiKillCount++;
          this.showMultiKillBonus(wall.killCount, bonus);
          this.events.emit('scoreChanged', { score: this.score });
        }
        wall.destroy();
        this.walls.splice(i, 1);
      }
    }
  }

  showMultiKillBonus(killCount, bonus) {
    const text = this.add.text(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2 - 50,
      `マルチキル! ×${killCount} +${bonus}`,
      {
        fontSize: '24px',
        color: '#ffff00',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  updateEnemies(delta) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(delta);

      // CPU到達チェック
      if (enemy.hasReachedCPU()) {
        this.onEnemyReachCPU(enemy);
        enemy.destroy();
        this.enemies.splice(i, 1);
      }
      // 死亡チェック
      else if (enemy.isDead()) {
        this.onEnemyKilled(enemy);
        enemy.destroy();
        this.enemies.splice(i, 1);
      }
    }
  }

  checkCollisions() {
    // 各敵と各壁の当たり判定
    const wallsToDestroy = [];

    try {
      for (const enemy of this.enemies) {
        if (!enemy || !enemy.sprite || enemy.isStunned) continue;

        // 壁通過中なら衝突判定をスキップ
        if (enemy.isPassingThrough) {
          continue;
        }

        for (const wall of this.walls) {
          if (!wall) continue;

          // 壁通過中なら残りの壁衝突判定もスキップ
          if (enemy.isPassingThrough) break;

          if (wall.checkCollision(enemy)) {
            // デバッグログ
            console.log('[GameScene] 衝突検出:', enemy.type, 'special:', enemy.data.special, 'shieldActive:', enemy.shieldActive);

            // ボマー：壁を破壊して自爆
            if (enemy.data.special === 'explode_wall') {
              console.log('[GameScene] ボマーが壁を破壊！');
              wallsToDestroy.push(wall);
              enemy.hp = 0; // 自爆
              enemy.lastHitWall = wall; // キルした壁を記録
              this.createExplosionEffect(enemy.sprite.x, enemy.sprite.y);
              this.soundManager.play('sfx_bomber_explode');
              break;
            }
            // シールド：1回だけすり抜け（typeでも判定）
            else if ((enemy.data.special === 'shield_once' || enemy.type === 'shield') && enemy.shieldActive) {
              console.log('[GameScene] シールドすり抜け開始');
              enemy.shieldActive = false;      // シールド消費
              enemy.isPassingThrough = true;   // 通過中フラグON
              this.soundManager.play('sfx_shield_break');

              // 500ms後に通過完了（壁を抜けるのに十分な時間）
              this.time.delayedCall(500, () => {
                if (enemy && !enemy.isDead()) {
                  enemy.isPassingThrough = false;
                  console.log('[GameScene] シールドすり抜け完了');
                }
              });

              // シールド消滅エフェクト
              try {
                if (enemy.sprite && enemy.sprite.active) {
                  this.tweens.add({
                    targets: enemy.sprite,
                    alpha: 0.5,
                    duration: 100,
                    yoyo: true
                  });
                  // シールド消滅の視覚効果（色が少し暗くなる）
                  if (typeof enemy.sprite.setTint === 'function') {
                    enemy.sprite.setTint(0x888888);
                  } else {
                    // setTintがない場合はアルファで代用
                    enemy.sprite.alpha = 0.7;
                  }
                }
              } catch (e) {
                console.warn('[GameScene] シールドエフェクトエラー:', e);
              }
              break;  // 壁ループを抜けて次の敵へ
            }
            // 通常の衝突
            else {
              enemy.takeDamage(wall.wallData, wall.damageMultiplier);
              enemy.lastHitWall = wall; // ダメージを与えた壁を記録
              this.soundManager.play('sfx_hit');
            }
          }
        }
      }
    } catch (e) {
      console.error('[GameScene] checkCollisions エラー:', e);
    }

    // 破壊された壁を削除
    for (const wall of wallsToDestroy) {
      const index = this.walls.indexOf(wall);
      if (index > -1) {
        wall.destroy();
        this.walls.splice(index, 1);
      }
    }
  }

  createExplosionEffect(x, y) {
    // 爆発エフェクト
    for (let i = 0; i < 12; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(0xff6600, 1);
      particle.fillCircle(0, 0, 6);
      particle.x = x;
      particle.y = y;

      const angle = (Math.PI * 2 / 12) * i;
      const distance = 50;

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 2,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }

    // 画面揺れ
    this.cameras.main.shake(150, 0.02);
  }

  checkWaveClear() {
    if (!this.waveStarted || this.waveCleared) return;

    // スポーン完了かつ敵が全滅
    if (this.spawnIndex >= this.waveEnemies.length && this.enemies.length === 0) {
      this.waveCleared = true;
      this.onWaveClear();
    }
  }

  onEnemyReachCPU(enemy) {
    this.cpuHp--;
    this.stats.damageTaken++;
    this.soundManager.play('sfx_cpu_damage');
    console.log('[GameScene] CPUダメージ! HP:', this.cpuHp, '/', this.cpuMaxHp);

    this.updateCPUExpression();

    // UIに通知
    console.log('[GameScene] cpuDamagedイベント発火');
    this.events.emit('cpuDamaged', { cpuHp: this.cpuHp, cpuMaxHp: this.cpuMaxHp });

    // ダメージエフェクト
    this.cameras.main.shake(200, 0.01);

    // ゲームオーバーチェック
    if (this.cpuHp <= 0 && !this.isGameOver) {
      this.gameOver();
    }
  }

  onEnemyKilled(enemy) {
    // 壁の長さによるスコア倍率計算
    let multiplier = 1.0;
    if (enemy.lastHitWall) {
      const wallLength = enemy.lastHitWall.length || 150;
      // 50px → ×2.0、150px → ×1.6、300px → ×1.0
      multiplier = Math.max(1.0, 2.0 - (wallLength - 50) / 250);
      // 壁のキルカウントを増加
      enemy.lastHitWall.killCount++;
    }

    const baseScore = enemy.data.reward;
    const finalScore = Math.floor(baseScore * multiplier);
    this.score += finalScore;
    this.stats.totalKills++;

    // UIに通知
    this.events.emit('scoreChanged', { score: this.score });

    // スポナー：死亡時に小型バグを3体召喚
    if (enemy.data.special === 'spawn_on_death') {
      console.log('[GameScene] スポナーが小型バグを召喚！');
      this.soundManager.play('sfx_spawner_spawn');
      for (let i = 0; i < 3; i++) {
        const offsetX = (Math.random() - 0.5) * 50;
        const offsetY = (Math.random() - 0.5) * 50;
        this.spawnEnemyAtPosition('bug_small', enemy.sprite.x + offsetX, enemy.sprite.y + offsetY);
      }
    }

    // 撃破エフェクト
    this.createKillEffect(enemy.sprite.x, enemy.sprite.y);
  }

  // 特定位置に敵をスポーンする（スポナー用）
  spawnEnemyAtPosition(enemyId, x, y) {
    const baseData = this.getEnemyData(enemyId);
    if (!baseData) return;

    // 難易度によるHP補正
    const enemyData = {
      ...baseData,
      hp: Math.ceil(baseData.hp * this.enemyHpMultiplier)
    };

    // 敵を作成
    const enemy = new Enemy(this, x, y, enemyId, enemyData);
    this.enemies.push(enemy);
    this.enemyGroup.add(enemy.sprite);
  }

  createKillEffect(x, y) {
    this.soundManager.play('sfx_kill');
    // パーティクル風のエフェクト
    for (let i = 0; i < 8; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(0xffff00, 1);
      particle.fillCircle(0, 0, 4);
      particle.x = x;
      particle.y = y;

      const angle = (Math.PI * 2 / 8) * i;
      const distance = 30;

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  onWaveClear() {
    this.soundManager.play('sfx_wave_clear');
    this.score += 100; // ウェーブクリアボーナス
    this.currentWave++;

    this.events.emit('waveCleared', {
      currentWave: this.currentWave,
      totalWaves: this.currentStageData.waves.length
    });

    // 次のウェーブへ
    if (this.currentWave < this.currentStageData.waves.length) {
      // インターバル後に次のウェーブ
      this.time.delayedCall(3000, () => {
        this.waveStarted = false;
        this.startWave();
      });
    } else {
      // ステージクリア
      this.stageClear();
    }
  }

  stageClear() {
    if (this.isCleared) return;
    this.isCleared = true;
    this.soundManager.play('sfx_stage_clear');

    // クリアタイム計算
    this.stats.clearTime = Date.now() - this.startTime;

    // ボーナス計算
    const targetWalls = this.currentStageData.targetWalls || 20;
    const bonuses = {
      wallEconomy: { rank: '-', bonus: 0 },
      noDamage: false,
      multiKill: this.stats.multiKillCount
    };

    // 壁エコノミーボーナス
    const wallRatio = this.stats.wallsUsed / targetWalls;
    if (wallRatio <= 0.5) {
      bonuses.wallEconomy = { rank: 'S', bonus: 2000 };
    } else if (wallRatio <= 0.75) {
      bonuses.wallEconomy = { rank: 'A', bonus: 1000 };
    } else if (wallRatio <= 1.0) {
      bonuses.wallEconomy = { rank: 'B', bonus: 500 };
    }
    this.score += bonuses.wallEconomy.bonus;

    // ノーダメージボーナス
    if (this.stats.damageTaken === 0) {
      bonuses.noDamage = true;
      this.score += 1000;
    }

    this.time.delayedCall(1000, () => {
      this.scene.stop('UIScene');
      this.scene.start('ResultScene', {
        result: 'clear',
        stageId: this.stageId,
        difficulty: this.difficulty,
        score: this.score,
        reward: this.currentStageData.reward,
        waveReached: this.currentWave,
        totalWaves: this.currentStageData.waves.length,
        stats: this.stats,
        bonuses: bonuses,
        targetWalls: targetWalls
      });
    });
  }

  gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.soundManager.play('sfx_game_over');

    // クリアタイム計算
    this.stats.clearTime = Date.now() - this.startTime;

    // スポーンタイマー停止
    if (this.spawnTimer) {
      this.spawnTimer.remove();
      this.spawnTimer = null;
    }

    this.time.delayedCall(1000, () => {
      this.scene.stop('UIScene');
      this.scene.start('ResultScene', {
        result: 'gameover',
        stageId: this.stageId,
        difficulty: this.difficulty,
        score: this.score,
        waveReached: this.currentWave + 1,
        totalWaves: this.currentStageData.waves.length,
        stats: this.stats
      });
    });
  }
}

// === Wallクラス ===

class Wall {
  /**
   * 壁タイプ別のビジュアルスタイル定義
   */
  static getWallStyle(wallId, baseColor) {
    switch (wallId) {
      case 'fire':
        return { glow: 0x660000, core: 0xffff00, particle: 0xff8800 };
      case 'ice':
        return { glow: 0x003366, core: 0xeeffff, particle: 0xaaeeff };
      default: // basic
        return { glow: 0x004488, core: 0x88ddff, particle: 0x44ccff };
    }
  }

  constructor(scene, points, wallData, duration, damageMultiplier = 1) {
    this.scene = scene;
    this.points = points;
    this.wallData = wallData;
    this.createdAt = Date.now();
    this.duration = duration;
    this.damageMultiplier = damageMultiplier;

    // ビジュアルスタイル
    let color = parseInt(wallData.color);
    if (isNaN(color)) color = 0x00aaff;
    this.color = color;
    this.style = Wall.getWallStyle(wallData.id, color);

    // パスの総長を事前計算（パーティクル用）
    this.totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      this.totalLength += Math.sqrt(
        (points[i].x - points[i - 1].x) ** 2 +
        (points[i].y - points[i - 1].y) ** 2
      );
    }

    // Graphics描画
    this.graphics = scene.add.graphics();
    this.draw();

    // 当たり判定用のセグメント
    this.segments = this.createSegments();
  }

  createSegments() {
    const segments = [];
    for (let i = 1; i < this.points.length; i++) {
      segments.push({
        x1: this.points[i - 1].x,
        y1: this.points[i - 1].y,
        x2: this.points[i].x,
        y2: this.points[i].y
      });
    }
    return segments;
  }

  /**
   * パス上の特定距離地点の座標を返す
   */
  getPointAtDistance(dist) {
    let accumulated = 0;
    for (let i = 1; i < this.points.length; i++) {
      const dx = this.points[i].x - this.points[i - 1].x;
      const dy = this.points[i].y - this.points[i - 1].y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      if (accumulated + segLen >= dist) {
        const t = (dist - accumulated) / segLen;
        return {
          x: this.points[i - 1].x + dx * t,
          y: this.points[i - 1].y + dy * t
        };
      }
      accumulated += segLen;
    }
    const last = this.points[this.points.length - 1];
    return { x: last.x, y: last.y };
  }

  /**
   * パスのストロークを描く（共通ヘルパー）
   */
  strokeWallPath(thickness, color, alpha) {
    this.graphics.lineStyle(thickness, color, alpha);
    this.graphics.beginPath();
    this.graphics.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      this.graphics.lineTo(this.points[i].x, this.points[i].y);
    }
    this.graphics.strokePath();
  }

  draw() {
    const elapsed = Date.now() - this.createdAt;
    const alpha = Math.max(0, 1 - elapsed / this.duration);
    const time = elapsed * 0.001; // 秒単位

    this.graphics.clear();

    // 消えかけの壁は軽量描画
    if (alpha < 0.15) {
      this.strokeWallPath(16, this.color, alpha);
      return;
    }

    // === レイヤー1: 外側グロー ===
    const glowAlpha = alpha * 0.25;
    // fire壁は明滅
    const glowFlicker = this.wallData.id === 'fire'
      ? 1 + Math.sin(time * 8) * 0.3
      : 1;
    this.strokeWallPath(28, this.style.glow, glowAlpha * glowFlicker);

    // === レイヤー2: メインボディ ===
    this.strokeWallPath(16, this.color, alpha);

    // === レイヤー3: 内側コア ===
    const coreAlpha = alpha * 0.7;
    this.strokeWallPath(4, this.style.core, coreAlpha);

    // === タイプ別パーティクルエフェクト ===
    if (alpha > 0.2) {
      this.drawParticles(time, alpha);
    }
  }

  /**
   * 壁タイプ別パーティクル描画
   */
  drawParticles(time, alpha) {
    const wallId = this.wallData.id;

    if (wallId === 'fire') {
      this.drawFireParticles(time, alpha);
    } else if (wallId === 'ice') {
      this.drawIceParticles(time, alpha);
    } else {
      this.drawEnergyPulse(time, alpha);
    }
  }

  /**
   * basic壁: パス上を流れるエネルギーパルス
   */
  drawEnergyPulse(time, alpha) {
    const pulseCount = Math.min(8, Math.floor(this.totalLength / 30));
    const speed = 60; // px/sec

    for (let i = 0; i < pulseCount; i++) {
      const offset = (i / pulseCount) * this.totalLength;
      const dist = (offset + time * speed) % this.totalLength;
      const pos = this.getPointAtDistance(dist);

      // パルスの明滅
      const pulse = 0.5 + Math.sin(time * 4 + i * 1.5) * 0.5;
      const size = 2 + pulse * 2;
      this.graphics.fillStyle(this.style.core, alpha * (0.4 + pulse * 0.6));
      this.graphics.fillCircle(pos.x, pos.y, size);
    }
  }

  /**
   * fire壁: 上向きに揺れる炎パーティクル
   */
  drawFireParticles(time, alpha) {
    const count = Math.min(10, Math.floor(this.totalLength / 25));

    for (let i = 0; i < count; i++) {
      const dist = (i / count) * this.totalLength;
      const base = this.getPointAtDistance(dist);

      // 各パーティクルは異なるタイミングで揺れる
      const phase = i * 2.3 + time * 5;
      const riseY = -4 - Math.abs(Math.sin(phase)) * 10;
      const swayX = Math.sin(phase * 1.3) * 5;
      const life = (Math.sin(phase) + 1) * 0.5; // 0-1 cycle
      const size = 1.5 + life * 2.5;

      // 炎の色グラデーション（黄→オレンジ→赤）
      const colors = [0xffff00, 0xff8800, 0xff4400];
      const colorIdx = Math.min(2, Math.floor(life * 3));

      this.graphics.fillStyle(colors[colorIdx], alpha * (0.3 + life * 0.5));
      this.graphics.fillCircle(base.x + swayX, base.y + riseY, size);
    }
  }

  /**
   * ice壁: 氷結晶パーティクル（ダイヤ形）
   */
  drawIceParticles(time, alpha) {
    const count = Math.min(8, Math.floor(this.totalLength / 35));

    for (let i = 0; i < count; i++) {
      const dist = (i / count) * this.totalLength;
      const base = this.getPointAtDistance(dist);

      const phase = i * 1.7 + time * 2;
      const sparkle = (Math.sin(phase) + 1) * 0.5;
      const offsetY = Math.sin(phase * 0.7) * 4;
      const offsetX = Math.cos(phase * 0.5) * 3;
      const size = 2 + sparkle * 3;

      // ダイヤ形の結晶
      const cx = base.x + offsetX;
      const cy = base.y + offsetY;
      this.graphics.fillStyle(this.style.particle, alpha * (0.3 + sparkle * 0.6));
      this.graphics.fillTriangle(
        cx, cy - size,
        cx - size * 0.6, cy,
        cx + size * 0.6, cy
      );
      this.graphics.fillTriangle(
        cx, cy + size,
        cx - size * 0.6, cy,
        cx + size * 0.6, cy
      );
    }
  }

  update(delta) {
    this.draw();
  }

  isExpired() {
    return Date.now() - this.createdAt >= this.duration;
  }

  checkCollision(enemy) {
    const ex = enemy.sprite.x;
    const ey = enemy.sprite.y;
    const radius = enemy.data.width / 2;

    for (const seg of this.segments) {
      const dist = this.pointToSegmentDistance(ex, ey, seg.x1, seg.y1, seg.x2, seg.y2);
      if (dist < radius + 8) { // 8 = 壁の太さ/2
        return true;
      }
    }
    return false;
  }

  pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) {
      return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    }

    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));

    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;

    return Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);
  }

  destroy() {
    this.graphics.destroy();
  }
}

// === Enemyクラス ===

class Enemy {
  constructor(scene, x, y, enemyId, data) {
    this.scene = scene;
    this.data = data;
    this.type = enemyId; // 敵タイプ（特殊能力判定用）
    this.hp = data.hp;
    this.speed = data.speed;
    this.baseSpeed = data.speed; // ダッシュ用の基本速度
    this.isStunned = false;
    this.stunEndTime = 0;
    this.slowEndTime = 0;
    this.slowPercent = 0;
    this.dotEndTime = 0;
    this.dotDamage = 0;
    this.dotInterval = 0;
    this.lastDotTime = 0;

    // 特殊能力用プロパティ
    // シールド：壁1回すり抜け（typeまたはspecialで判定）
    this.shieldActive = (data.special === 'shield_once' || enemyId === 'shield');
    this.isPassingThrough = false; // 壁通過中フラグ
    console.log('[Enemy] 生成:', enemyId, 'special:', data.special, 'shieldActive:', this.shieldActive);
    this.stealthVisible = true; // ステルス：表示状態
    this.dashActive = false; // ダッシュ：加速中
    this.lastStealthToggle = 0; // ステルス切替タイミング
    this.lastDashToggle = 0; // ダッシュ切替タイミング

    // スプライト作成
    const spriteKey = `enemy_${enemyId}`;
    const config = PLACEHOLDER_CONFIG[spriteKey] || {
      width: data.width,
      height: data.height,
      color: data.color || 0xff00ff,
      shape: 'circle'
    };

    this.sprite = scene.assetManager.getPhysicsSprite(x, y, spriteKey, config);
    this.sprite.enemy = this;

    // スプライトシートが読み込まれている場合はアニメーション再生
    const animKey = `${enemyId}_idle`;
    if (scene.anims.exists(animKey) && this.sprite.play) {
      this.sprite.play(animKey);
    }

    // CPUへ向かう
    this.targetX = GAME_CONFIG.CPU_X;
    this.targetY = GAME_CONFIG.CPU_Y;
  }

  update(delta) {
    const now = Date.now();

    // スタン解除チェック
    if (this.isStunned && now >= this.stunEndTime) {
      this.isStunned = false;
    }

    // 減速解除チェック
    if (now >= this.slowEndTime) {
      this.slowPercent = 0;
    }

    // DOTダメージ
    if (now < this.dotEndTime && now - this.lastDotTime >= this.dotInterval) {
      this.hp -= this.dotDamage;
      this.lastDotTime = now;
    }

    // ステルス：2秒ごとに透明切替
    if (this.data.special === 'stealth') {
      if (now - this.lastStealthToggle >= 2000) {
        this.stealthVisible = !this.stealthVisible;
        this.sprite.setAlpha(this.stealthVisible ? 1 : 0.2);
        this.lastStealthToggle = now;
        if (this.scene.soundManager) this.scene.soundManager.play('sfx_stealth_toggle');
      }
    }

    // ダッシュ：3秒周期で1秒間加速
    if (this.data.special === 'dash') {
      const cycle = (now - this.lastDashToggle) % 3000;
      const shouldDash = cycle < 1000;
      if (shouldDash !== this.dashActive) {
        this.dashActive = shouldDash;
        this.speed = shouldDash ? this.baseSpeed * 3 : this.baseSpeed;
        if (shouldDash && this.scene.soundManager) this.scene.soundManager.play('sfx_dasher_dash');
        // ダッシュ中のビジュアル
        if (shouldDash) {
          this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.3,
            scaleY: 0.7,
            duration: 100
          });
        } else {
          this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1,
            scaleY: 1,
            duration: 100
          });
        }
      }
    }

    // 移動
    if (!this.isStunned) {
      this.moveTowardsCPU(delta);
    }
  }

  moveTowardsCPU(delta) {
    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const effectiveSpeed = this.speed * (1 - this.slowPercent / 100);
      const moveX = (dx / dist) * effectiveSpeed * (delta / 1000);
      const moveY = (dy / dist) * effectiveSpeed * (delta / 1000);

      this.sprite.x += moveX;
      this.sprite.y += moveY;
    }
  }

  takeDamage(wallData, damageMultiplier = 1) {
    // ダメージ
    this.hp -= wallData.damage * damageMultiplier;

    // スタン
    this.isStunned = true;
    this.stunEndTime = Date.now() + 500;

    // 減速
    if (wallData.slowPercent > 0) {
      this.slowPercent = wallData.slowPercent;
      this.slowEndTime = Date.now() + (wallData.slowDuration || 2000);
    }

    // DOT
    if (wallData.dotDamage > 0) {
      this.dotDamage = wallData.dotDamage;
      this.dotInterval = wallData.dotInterval || 500;
      this.dotEndTime = Date.now() + (wallData.dotDuration || 3000);
      this.lastDotTime = Date.now();
    }

    // ヒットエフェクト
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true
    });
  }

  hasReachedCPU() {
    const dist = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      GAME_CONFIG.CPU_X, GAME_CONFIG.CPU_Y
    );
    return dist < 40; // CPU半径 + 敵半径
  }

  isDead() {
    return this.hp <= 0;
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}

window.GameScene = GameScene;
window.Wall = Wall;
window.Enemy = Enemy;
