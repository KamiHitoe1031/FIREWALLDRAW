/**
 * DataScene.js
 * データ管理画面（復活の呪文システム）
 */

class DataScene extends Phaser.Scene {
  constructor() {
    super('DataScene');
  }

  create() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // 背景
    this.createBackground();

    // タイトル
    this.add.text(WIDTH / 2, 30, 'データ管理', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 復活の呪文を表示セクション
    this.createSpellDisplaySection(WIDTH / 2, 130);

    // 復活の呪文を入力セクション
    this.createSpellInputSection(WIDTH / 2, 320);

    // データリセットボタン
    this.createResetButton(WIDTH / 2, HEIGHT - 110);

    // 戻るボタン
    this.createBackButton(WIDTH / 2, HEIGHT - 50);

    // メッセージ表示用
    this.messageText = this.add.text(WIDTH / 2, HEIGHT - 160, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);
  }

  createBackground() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    // セクション背景
    graphics.fillStyle(0x222244, 0.8);
    graphics.fillRoundedRect(30, 70, GAME_CONFIG.WIDTH - 60, 150, 10);
    graphics.fillRoundedRect(30, 240, GAME_CONFIG.WIDTH - 60, 150, 10);
  }

  createSpellDisplaySection(x, y) {
    // ラベル
    this.add.text(50, y - 50, '復活の呪文を表示', {
      fontSize: '16px',
      color: '#00aaff',
      fontFamily: 'sans-serif'
    });

    // 呪文表示エリア
    const spell = SaveManager.generateSpell();
    const displayText = spell.length > 50 ? spell.substring(0, 50) + '...' : spell;

    const spellBg = this.add.graphics();
    spellBg.fillStyle(0x111122, 1);
    spellBg.lineStyle(1, 0x444466, 1);
    spellBg.fillRoundedRect(50, y - 25, GAME_CONFIG.WIDTH - 100, 50, 5);
    spellBg.strokeRoundedRect(50, y - 25, GAME_CONFIG.WIDTH - 100, 50, 5);

    this.spellDisplayText = this.add.text(60, y, displayText, {
      fontSize: '11px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
      wordWrap: { width: GAME_CONFIG.WIDTH - 120 }
    }).setOrigin(0, 0.5);

    // コピーボタン
    this.createButton(x, y + 50, 'コピーする', 0x0066aa, () => {
      this.copySpellToClipboard();
    });
  }

  createSpellInputSection(x, y) {
    // ラベル
    this.add.text(50, y - 50, '復活の呪文を入力', {
      fontSize: '16px',
      color: '#00aaff',
      fontFamily: 'sans-serif'
    });

    // 入力エリア（DOM要素）
    const inputBg = this.add.graphics();
    inputBg.fillStyle(0x111122, 1);
    inputBg.lineStyle(1, 0x444466, 1);
    inputBg.fillRoundedRect(50, y - 25, GAME_CONFIG.WIDTH - 100, 50, 5);
    inputBg.strokeRoundedRect(50, y - 25, GAME_CONFIG.WIDTH - 100, 50, 5);

    // テキストエリア（DOM）
    const inputElement = this.add.dom(x, y).createFromHTML(`
      <input type="text" id="spell-input"
        style="width: ${GAME_CONFIG.WIDTH - 130}px;
               height: 30px;
               padding: 5px 10px;
               font-size: 12px;
               font-family: monospace;
               background: #222233;
               color: #ffffff;
               border: 1px solid #444466;
               border-radius: 5px;
               outline: none;"
        placeholder="ここに復活の呪文を貼り付け">
    `);
    this.spellInput = inputElement;

    // 復元ボタン
    this.createButton(x, y + 50, '復元する', 0x006600, () => {
      this.restoreFromSpell();
    });
  }

  createButton(x, y, label, color, onClick) {
    const width = 140;
    const height = 36;

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

  createResetButton(x, y) {
    const width = 180;
    const height = 36;
    const color = 0xaa0000;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.lineStyle(2, 0xff4444, 1);
    bg.fillRoundedRect(-width/2, -height/2, width, height, 6);
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 6);

    const text = this.add.text(0, 0, 'データをリセット', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xcc0000, 1);
      bg.lineStyle(2, 0xffff00, 1);
      bg.fillRoundedRect(-width/2, -height/2, width, height, 6);
      bg.strokeRoundedRect(-width/2, -height/2, width, height, 6);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.lineStyle(2, 0xff4444, 1);
      bg.fillRoundedRect(-width/2, -height/2, width, height, 6);
      bg.strokeRoundedRect(-width/2, -height/2, width, height, 6);
    });

    container.on('pointerdown', () => {
      this.showResetConfirm();
    });
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

  async copySpellToClipboard() {
    const spell = SaveManager.generateSpell();

    try {
      await navigator.clipboard.writeText(spell);
      this.showMessage('クリップボードにコピーしました！', '#00ff00');
    } catch (e) {
      // フォールバック: プロンプトで表示
      this.showMessage('コピーに失敗しました。下の文字列を手動でコピーしてください。', '#ff0000');
      console.log('復活の呪文:', spell);
    }
  }

  restoreFromSpell() {
    const inputEl = document.getElementById('spell-input');
    if (!inputEl) {
      this.showMessage('入力欄が見つかりません', '#ff0000');
      return;
    }

    const spell = inputEl.value;
    const result = SaveManager.restoreFromSpell(spell);

    if (result.success) {
      this.showMessage(result.message, '#00ff00');
      // 1秒後にタイトルに戻る
      this.time.delayedCall(1000, () => {
        this.scene.start('TitleScene');
      });
    } else {
      this.showMessage(result.message, '#ff0000');
    }
  }

  showMessage(text, color) {
    this.messageText.setText(text);
    this.messageText.setColor(color);

    // 3秒後に消える
    this.time.delayedCall(3000, () => {
      this.messageText.setText('');
    });
  }

  showResetConfirm() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // オーバーレイ
    const overlay = this.add.container(0, 0);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    const panel = this.add.graphics();
    panel.fillStyle(0x222244, 1);
    panel.lineStyle(3, 0xff0000, 1);
    panel.fillRoundedRect(WIDTH/2 - 150, HEIGHT/2 - 80, 300, 160, 10);
    panel.strokeRoundedRect(WIDTH/2 - 150, HEIGHT/2 - 80, 300, 160, 10);

    const title = this.add.text(WIDTH/2, HEIGHT/2 - 50, '本当にリセットしますか？', {
      fontSize: '16px',
      color: '#ff4444',
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const desc = this.add.text(WIDTH/2, HEIGHT/2 - 20, '全ての進行データが消去されます', {
      fontSize: '12px',
      color: '#aaaaaa',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    overlay.add([bg, panel, title, desc]);

    // はいボタン
    const yesBtn = this.createConfirmButton(WIDTH/2 - 60, HEIGHT/2 + 30, 'はい', 0xaa0000, () => {
      SaveManager.reset();
      overlay.destroy();
      this.showMessage('データをリセットしました', '#ffff00');
      // 呪文表示を更新
      const spell = SaveManager.generateSpell();
      const displayText = spell.length > 50 ? spell.substring(0, 50) + '...' : spell;
      this.spellDisplayText.setText(displayText);
    });

    // いいえボタン
    const noBtn = this.createConfirmButton(WIDTH/2 + 60, HEIGHT/2 + 30, 'いいえ', 0x666666, () => {
      overlay.destroy();
    });

    overlay.add([yesBtn, noBtn]);
  }

  createConfirmButton(x, y, label, color, onClick) {
    const width = 80;
    const height = 32;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.lineStyle(2, 0xffffff, 1);
    bg.fillRoundedRect(-width/2, -height/2, width, height, 5);
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 5);

    const text = this.add.text(0, 0, label, {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', onClick);

    return container;
  }
}

window.DataScene = DataScene;
