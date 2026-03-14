/**
 * SoundManager.js
 * ゲーム全体の音声管理ユーティリティ
 * - SE再生（存在チェック付き・連打制限付き）
 * - BGM再生（ループ・フェード対応）
 * - BGM / SFX 個別音量管理
 * - ミュート状態のlocalStorage永続化
 */

class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = {};
    this.lastPlayTime = {};
    this.minInterval = 50; // 同じSEの最小再生間隔(ms)

    // 個別音量（localStorage永続化）
    this.sfxVolume = parseFloat(localStorage.getItem('sfx_volume') || '0.5');
    this.bgmVolume = parseFloat(localStorage.getItem('bgm_volume') || '0.3');
    this.muted = localStorage.getItem('sfx_muted') === 'true';

    // 後方互換: 旧volumeプロパティ
    this.volume = this.sfxVolume;

    // BGMインスタンス
    this.currentBGM = null;
    this.currentBGMKey = null;

    // Phaserのサウンドマネージャーにミュート状態を反映
    if (this.scene.sound) {
      this.scene.sound.mute = this.muted;
    }
  }

  /**
   * SEを再生する
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
        volume: (config.volume || 1) * this.sfxVolume,
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
      return null;
    }
  }

  /**
   * BGMを再生（ループ）
   */
  playBGM(key) {
    if (this.currentBGMKey === key && this.currentBGM && this.currentBGM.isPlaying) {
      return this.currentBGM;
    }

    this.stopBGM();

    try {
      if (!this.scene.cache.audio.exists(key)) return null;
    } catch (e) {
      return null;
    }

    try {
      this.currentBGM = this.scene.sound.add(key, {
        volume: this.muted ? 0 : this.bgmVolume,
        loop: true
      });
      this.currentBGM.play();
      this.currentBGMKey = key;
      return this.currentBGM;
    } catch (e) {
      return null;
    }
  }

  /**
   * BGMを停止
   */
  stopBGM() {
    if (this.currentBGM) {
      try {
        this.currentBGM.stop();
        this.currentBGM.destroy();
      } catch (e) {
        // 無視
      }
      this.currentBGM = null;
      this.currentBGMKey = null;
    }
  }

  /**
   * SFX音量を設定 (0.0 - 1.0)
   */
  setSFXVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.volume = this.sfxVolume; // 後方互換
    localStorage.setItem('sfx_volume', this.sfxVolume.toString());
  }

  /**
   * BGM音量を設定 (0.0 - 1.0)
   */
  setBGMVolume(vol) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('bgm_volume', this.bgmVolume.toString());
    // 再生中BGMに即座に反映
    if (this.currentBGM && !this.muted) {
      this.currentBGM.setVolume(this.bgmVolume);
    }
  }

  /**
   * 後方互換: setVolume → SFX音量設定
   */
  setVolume(vol) {
    this.setSFXVolume(vol);
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
    // BGMの音量を反映
    if (this.currentBGM) {
      this.currentBGM.setVolume(flag ? 0 : this.bgmVolume);
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
