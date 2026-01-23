/**
 * AssetManager.js
 * プレースホルダー生成を一元管理するクラス
 * 画像がなくてもゲームが動作する仕組みを提供
 */

class AssetManager {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * 画像またはプレースホルダーを生成
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {string} key - アセットキー
   * @param {object} config - プレースホルダー設定
   * @returns {Phaser.GameObjects.Sprite|Phaser.GameObjects.Container}
   */
  getSprite(x, y, key, config = {}) {
    // 画像が存在するか確認
    if (this.scene.textures.exists(key)) {
      return this.scene.add.sprite(x, y, key);
    }

    // 存在しない場合はプレースホルダーを生成
    return this.createPlaceholder(x, y, key, config);
  }

  /**
   * プレースホルダー図形を生成
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {string} key - アセットキー
   * @param {object} config - 設定
   */
  createPlaceholder(x, y, key, config) {
    const {
      width = 32,
      height = 32,
      color = 0x888888,
      shape = 'rect',
      label = ''
    } = config;

    const container = this.scene.add.container(x, y);
    const graphics = this.scene.add.graphics();

    // 図形を描画
    graphics.fillStyle(color, 1);
    graphics.lineStyle(2, 0xffffff, 1);

    switch (shape) {
      case 'circle':
        graphics.fillCircle(0, 0, width / 2);
        graphics.strokeCircle(0, 0, width / 2);
        break;
      case 'triangle':
        graphics.fillTriangle(0, -height/2, -width/2, height/2, width/2, height/2);
        graphics.strokeTriangle(0, -height/2, -width/2, height/2, width/2, height/2);
        break;
      case 'rect':
      default:
        graphics.fillRect(-width/2, -height/2, width, height);
        graphics.strokeRect(-width/2, -height/2, width, height);
        break;
    }

    container.add(graphics);

    // ラベル（キー名を表示）
    if (label || key) {
      const displayLabel = label || key;
      const fontSize = Math.min(10, width / displayLabel.length * 1.5);
      const text = this.scene.add.text(0, 0, displayLabel, {
        fontSize: `${fontSize}px`,
        color: '#ffffff',
        fontFamily: 'sans-serif'
      }).setOrigin(0.5);
      container.add(text);
    }

    // スプライトと同様のインターフェースを提供
    container.width = width;
    container.height = height;
    container.displayWidth = width;
    container.displayHeight = height;
    container.setSize(width, height);

    return container;
  }

  /**
   * 物理スプライトまたはプレースホルダーを生成
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {string} key - アセットキー
   * @param {object} config - プレースホルダー設定
   */
  getPhysicsSprite(x, y, key, config = {}) {
    if (this.scene.textures.exists(key)) {
      return this.scene.physics.add.sprite(x, y, key);
    }

    // プレースホルダーの場合は物理ボディ付きコンテナ
    const placeholder = this.createPlaceholder(x, y, key, config);
    this.scene.physics.add.existing(placeholder);

    // サイズを設定
    const width = config.width || 32;
    const height = config.height || 32;
    placeholder.body.setSize(width, height);
    placeholder.body.setOffset(-width/2, -height/2);

    return placeholder;
  }

  /**
   * ボタンのプレースホルダー生成
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {string} key - アセットキー
   * @param {string} text - ボタンテキスト
   * @param {function} onClick - クリック時のコールバック
   */
  createButton(x, y, key, text, onClick) {
    const config = PLACEHOLDER_CONFIG[key] || { width: 150, height: 50, color: 0x666666 };

    if (this.scene.textures.exists(key)) {
      // 画像がある場合
      const btn = this.scene.add.image(x, y, key)
        .setInteractive({ useHandCursor: true });
      btn.on('pointerdown', onClick);
      return btn;
    }

    // プレースホルダーの場合
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(config.color, 1);
    bg.lineStyle(3, 0xffffff, 1);
    bg.fillRoundedRect(-config.width/2, -config.height/2, config.width, config.height, 8);
    bg.strokeRoundedRect(-config.width/2, -config.height/2, config.width, config.height, 8);

    const label = this.scene.add.text(0, 0, text, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(config.width, config.height);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', onClick);

    // ホバーエフェクト
    container.on('pointerover', () => {
      bg.clear();
      const hoverColor = Math.min(config.color + 0x222222, 0xffffff);
      bg.fillStyle(hoverColor, 1);
      bg.lineStyle(3, 0xffff00, 1);
      bg.fillRoundedRect(-config.width/2, -config.height/2, config.width, config.height, 8);
      bg.strokeRoundedRect(-config.width/2, -config.height/2, config.width, config.height, 8);
    });
    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(config.color, 1);
      bg.lineStyle(3, 0xffffff, 1);
      bg.fillRoundedRect(-config.width/2, -config.height/2, config.width, config.height, 8);
      bg.strokeRoundedRect(-config.width/2, -config.height/2, config.width, config.height, 8);
    });

    return container;
  }

  /**
   * HPバーをGraphicsで描画
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} width - 幅
   * @param {number} height - 高さ
   */
  createHPBar(x, y, width, height) {
    const container = this.scene.add.container(x, y);

    // 背景（黒枠）
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 1);
    bg.fillRect(0, 0, width, height);
    bg.lineStyle(2, 0x888888, 1);
    bg.strokeRect(0, 0, width, height);

    // HP部分（緑）
    const fill = this.scene.add.graphics();
    fill.fillStyle(0x00ff00, 1);
    fill.fillRect(2, 2, width - 4, height - 4);

    container.add([bg, fill]);

    // 更新用メソッドを追加
    container.updateHP = (current, max) => {
      const ratio = Math.max(0, Math.min(1, current / max));
      fill.clear();

      // 色を変化（緑→黄→赤）
      let color = 0x00ff00;
      if (ratio <= 0.25) color = 0xff0000;
      else if (ratio <= 0.5) color = 0xffff00;

      fill.fillStyle(color, 1);
      fill.fillRect(2, 2, (width - 4) * ratio, height - 4);
    };

    return container;
  }
}

// グローバルに使えるようにエクスポート
window.AssetManager = AssetManager;
