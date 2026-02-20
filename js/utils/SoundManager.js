/**
 * SoundManager.js
 * ゲーム全体の音声管理ユーティリティ
 * - SE再生（存在チェック付き・連打制限付き）
 * - ミュート状態のlocalStorage永続化
 * - 音量調整
 */

class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = {};
    this.lastPlayTime = {};
    this.minInterval = 50; // 同じSEの最小再生間隔(ms)
    this.volume = parseFloat(localStorage.getItem('sfx_volume') || '0.7');
    this.muted = localStorage.getItem('sfx_muted') === 'true';

    // Phaserのサウンドマネージャーにミュート状態を反映
    if (this.scene.sound) {
      this.scene.sound.mute = this.muted;
    }
  }

  /**
   * SEを再生する
   * @param {string} key - Phaserオーディオキー (例: 'sfx_hit')
   * @param {object} config - { volume, rate, detune } など
   */
  play(key, config = {}) {
    if (this.muted) return null;

    // 連打制限
    const now = Date.now();
    const lastTime = this.lastPlayTime[key] || 0;
    if (now - lastTime < this.minInterval) return null;
    this.lastPlayTime[key] = now;

    // サウンドが存在するかチェック
    try {
      if (!this.scene.cache.audio.exists(key)) return null;
    } catch (e) {
      return null;
    }

    try {
      const sound = this.scene.sound.add(key, {
        volume: (config.volume || 1) * this.volume,
        rate: config.rate || 1,
        detune: config.detune || 0,
      });
      sound.play();

      // 再生完了後に自動破棄
      sound.once('complete', () => {
        sound.destroy();
      });

      return sound;
    } catch (e) {
      // 音声再生エラーは無視
      return null;
    }
  }

  /**
   * 全体音量を設定 (0.0 - 1.0)
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('sfx_volume', this.volume.toString());
  }

  /**
   * ミュート状態を設定
   */
  setMuted(flag) {
    this.muted = flag;
    localStorage.setItem('sfx_muted', flag.toString());
    if (this.scene.sound) {
      this.scene.sound.mute = flag;
    }
  }

  /**
   * ミュートをトグル
   */
  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * ミュート状態を取得
   */
  isMuted() {
    return this.muted;
  }
}

window.SoundManager = SoundManager;
