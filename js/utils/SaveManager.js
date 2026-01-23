/**
 * SaveManager.js
 * セーブデータ管理と復活の呪文システム
 */

class SaveManager {
  static SAVE_KEY = "firewall_draw_save";

  /**
   * デフォルトのセーブデータ
   */
  static getDefaultSave() {
    return {
      normal: { clearedStages: [], highScores: {} },
      hard: { clearedStages: [], highScores: {} },
      coins: 0,
      unlockedWalls: ["basic"],
      upgrades: { wall_duration: 0, wall_damage: 0, wall_count: 0, cpu_hp: 0 }
    };
  }

  /**
   * セーブデータ読み込み
   */
  static load() {
    try {
      const data = localStorage.getItem(this.SAVE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // 旧形式のデータを新形式にマイグレーション
        return this.migrate(parsed);
      }
      return this.getDefaultSave();
    } catch (e) {
      console.warn('セーブデータの読み込みに失敗:', e);
      return this.getDefaultSave();
    }
  }

  /**
   * 旧形式のセーブデータを新形式にマイグレーション
   */
  static migrate(data) {
    const defaultSave = this.getDefaultSave();

    // 旧形式（clearedStagesが配列直接）の場合
    if (Array.isArray(data.clearedStages)) {
      return {
        normal: {
          clearedStages: data.clearedStages || [],
          highScores: data.highScores || {}
        },
        hard: { clearedStages: [], highScores: {} },
        coins: data.coins || 0,
        unlockedWalls: data.unlockedWalls || ["basic"],
        upgrades: data.upgrades || defaultSave.upgrades
      };
    }

    // 新形式の場合、必要なフィールドを補完
    return {
      normal: data.normal || defaultSave.normal,
      hard: data.hard || defaultSave.hard,
      coins: data.coins ?? 0,
      unlockedWalls: data.unlockedWalls || ["basic"],
      upgrades: data.upgrades || defaultSave.upgrades
    };
  }

  /**
   * セーブデータ保存
   */
  static save(data) {
    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('セーブ失敗:', e);
      return false;
    }
  }

  /**
   * ステージクリア時のセーブ
   */
  static saveStageClear(difficulty, stageId, score, reward) {
    const data = this.load();
    const diffData = data[difficulty];

    // クリア済みステージに追加（重複なし）
    if (!diffData.clearedStages.includes(stageId)) {
      diffData.clearedStages.push(stageId);
    }

    // ハイスコア更新
    const currentHigh = diffData.highScores[stageId] || 0;
    const isNewRecord = score > currentHigh;
    if (isNewRecord) {
      diffData.highScores[stageId] = score;
    }

    // コイン加算
    data.coins += reward;

    this.save(data);

    return { isNewRecord, newCoins: data.coins };
  }

  /**
   * 復活の呪文を生成（Base64エンコード）
   */
  static generateSpell() {
    const data = this.load();
    const json = JSON.stringify(data);
    // Base64エンコード + URI エンコード（日本語対応）
    return btoa(encodeURIComponent(json));
  }

  /**
   * 復活の呪文から復元
   */
  static restoreFromSpell(spell) {
    try {
      const trimmed = spell.trim();
      if (!trimmed) {
        return { success: false, message: "呪文を入力してください" };
      }

      const json = decodeURIComponent(atob(trimmed));
      const data = JSON.parse(json);

      // 簡易バリデーション
      if (data.normal && data.hard && typeof data.coins === 'number') {
        this.save(data);
        return { success: true, message: "データを復元しました！" };
      }

      return { success: false, message: "無効な呪文です" };
    } catch (e) {
      console.warn('復活の呪文の解読に失敗:', e);
      return { success: false, message: "呪文の解読に失敗しました" };
    }
  }

  /**
   * データリセット
   */
  static reset() {
    this.save(this.getDefaultSave());
  }

  /**
   * 特定の難易度でステージがプレイ可能かどうか
   */
  static isStagePlayable(difficulty, stageId) {
    if (stageId === 1) return true; // ステージ1は常にプレイ可能

    const data = this.load();
    const clearedStages = data[difficulty].clearedStages;

    // 前のステージをクリアしていればプレイ可能
    return clearedStages.includes(stageId - 1);
  }

  /**
   * 特定の難易度でステージがクリア済みかどうか
   */
  static isStageCleared(difficulty, stageId) {
    const data = this.load();
    return data[difficulty].clearedStages.includes(stageId);
  }

  /**
   * 特定ステージのハイスコアを取得
   */
  static getHighScore(difficulty, stageId) {
    const data = this.load();
    return data[difficulty].highScores[stageId] || 0;
  }

  /**
   * コインを取得
   */
  static getCoins() {
    const data = this.load();
    return data.coins;
  }
}

window.SaveManager = SaveManager;
