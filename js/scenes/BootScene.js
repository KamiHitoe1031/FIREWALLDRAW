/**
 * BootScene.js
 * 最小限のアセットを読み込むブートシーン
 */

class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // ローディング表示
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '24px',
      color: '#00aaff',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // プログレスバーの背景
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 + 30, 320, 30);

    // プログレスバー
    const progressBar = this.add.graphics();

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x00aaff, 1);
      progressBar.fillRect(width / 2 - 155, height / 2 + 35, 310 * value, 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }

  create() {
    this.scene.start('PreloadScene');
  }
}

window.BootScene = BootScene;
