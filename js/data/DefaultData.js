/**
 * DefaultData.js
 * JSON読み込み失敗時のフォールバック用デフォルトデータ
 * file://プロトコルでも動作するようにするため
 */

// 難易度設定
const DIFFICULTY_SETTINGS = {
  normal: {
    name: "ノーマル",
    wallMaxLength: 300,
    enemyCountMultiplier: 1.0,
    enemyHpMultiplier: 1.0,
    cpuHpBase: 10
  },
  hard: {
    name: "ハード",
    wallMaxLength: 200,
    enemyCountMultiplier: 1.5,
    enemyHpMultiplier: 1.2,
    cpuHpBase: 8
  }
};

window.DIFFICULTY_SETTINGS = DIFFICULTY_SETTINGS;

const DEFAULT_DATA = {
  enemies: [
    {
      id: "bug_small",
      name: "バグ（小）",
      hp: 10,
      speed: 80,
      reward: 5,
      width: 24,
      height: 24
    },
    {
      id: "bug_medium",
      name: "バグ（中）",
      hp: 25,
      speed: 60,
      reward: 15,
      width: 32,
      height: 32
    },
    {
      id: "worm",
      name: "ワーム",
      hp: 15,
      speed: 120,
      reward: 10,
      width: 32,
      height: 16
    },
    {
      id: "trojan",
      name: "トロイ",
      hp: 50,
      speed: 40,
      reward: 30,
      width: 48,
      height: 48
    },
    {
      id: "ransom",
      name: "ランサム",
      hp: 80,
      speed: 50,
      reward: 50,
      width: 64,
      height: 64
    },
    {
      id: "bomber",
      name: "ボマー",
      hp: 20,
      speed: 80,
      reward: 25,
      width: 40,
      height: 40,
      color: 0xFF6600,
      special: "explode_wall"
    },
    {
      id: "shield",
      name: "シールド型",
      hp: 15,
      speed: 100,
      reward: 35,
      width: 20,
      height: 20,
      color: 0x00FFFF,
      special: "shield_once"
    },
    {
      id: "spawner",
      name: "スポナー",
      hp: 40,
      speed: 50,
      reward: 40,
      width: 48,
      height: 48,
      color: 0x9900FF,
      special: "spawn_on_death"
    },
    {
      id: "stealth",
      name: "ステルス型",
      hp: 12,
      speed: 120,
      reward: 30,
      width: 20,
      height: 20,
      color: 0x888888,
      special: "stealth"
    },
    {
      id: "dasher",
      name: "ダッシュ型",
      hp: 25,
      speed: 80,
      reward: 30,
      width: 32,
      height: 32,
      color: 0xFFFF00,
      special: "dash"
    }
  ],

  walls: [
    {
      id: "basic",
      name: "基本の壁",
      damage: 10,
      color: "0x00aaff",
      slowPercent: 0,
      dotDamage: 0,
      unlockStage: 0,
      purchaseCost: 0
    },
    {
      id: "fire",
      name: "炎の壁",
      damage: 15,
      color: "0xff6600",
      slowPercent: 0,
      dotDamage: 3,
      dotInterval: 500,
      dotDuration: 3000,
      unlockStage: 3,
      purchaseCost: 300
    },
    {
      id: "ice",
      name: "氷の壁",
      damage: 5,
      color: "0x00ffff",
      slowPercent: 80,
      slowDuration: 2000,
      dotDamage: 0,
      unlockStage: 5,
      purchaseCost: 500
    }
  ],

  stages: [
    {
      id: 1,
      name: "はじまりの防衛",
      cpuHp: 10,
      reward: 100,
      targetWalls: 15,
      waves: [
        { enemies: "bug_small:5", spawnInterval: 1500, directions: ["right"] },
        { enemies: "bug_small:8", spawnInterval: 1200, directions: ["right"] },
        { enemies: "bug_small:6,bug_medium:2", spawnInterval: 1200, directions: ["right"] },
        { enemies: "bug_medium:4,bug_small:6", spawnInterval: 1000, directions: ["right", "top"] }
      ]
    },
    {
      id: 2,
      name: "東からの脅威",
      cpuHp: 10,
      reward: 120,
      targetWalls: 18,
      waves: [
        { enemies: "bug_small:10", spawnInterval: 1200, directions: ["right"] },
        { enemies: "bug_small:8,bug_medium:3", spawnInterval: 1000, directions: ["right"] },
        { enemies: "bug_medium:5,worm:4", spawnInterval: 1000, directions: ["right"] },
        { enemies: "worm:8,bug_small:5", spawnInterval: 800, directions: ["right"] }
      ]
    },
    {
      id: 3,
      name: "挟み撃ち",
      cpuHp: 10,
      reward: 150,
      targetWalls: 20,
      waves: [
        { enemies: "bug_small:6,bug_small:6", spawnInterval: 1200, directions: ["right", "left"] },
        { enemies: "bug_medium:4,bug_medium:4", spawnInterval: 1000, directions: ["right", "left"] },
        { enemies: "worm:5,worm:5", spawnInterval: 1000, directions: ["right", "left"] },
        { enemies: "trojan:1,bug_small:10", spawnInterval: 800, directions: ["right", "left"] }
      ]
    },
    {
      id: 4,
      name: "爆発の脅威",
      cpuHp: 10,
      reward: 180,
      targetWalls: 22,
      description: "新敵登場：ボマー（壁を破壊する）",
      waves: [
        { enemies: "bug_small:10,bomber:1", spawnInterval: 1200, directions: ["right"] },
        { enemies: "bug_medium:6,bomber:2", spawnInterval: 1000, directions: ["right", "top"] },
        { enemies: "bomber:3,bug_small:10", spawnInterval: 1000, directions: ["right", "bottom"] },
        { enemies: "bomber:4,worm:8", spawnInterval: 800, directions: ["right", "top", "bottom"] }
      ]
    },
    {
      id: 5,
      name: "すり抜ける影",
      cpuHp: 10,
      reward: 200,
      targetWalls: 25,
      description: "新敵登場：シールド型（1回だけ壁をすり抜ける）",
      waves: [
        { enemies: "bug_small:8,shield:2", spawnInterval: 1200, directions: ["right"] },
        { enemies: "shield:4,bug_medium:4", spawnInterval: 1000, directions: ["right", "left"] },
        { enemies: "shield:5,worm:6", spawnInterval: 1000, directions: ["right", "top", "bottom"] },
        { enemies: "shield:6,bomber:2", spawnInterval: 800, directions: ["right", "top", "bottom", "left"] }
      ]
    },
    {
      id: 6,
      name: "増殖する悪夢",
      cpuHp: 12,
      reward: 250,
      targetWalls: 28,
      description: "新敵登場：スポナー（倒すと小型を召喚）",
      waves: [
        { enemies: "bug_small:6,spawner:2", spawnInterval: 1200, directions: ["right"] },
        { enemies: "spawner:3,bug_medium:4", spawnInterval: 1000, directions: ["right", "left"] },
        { enemies: "spawner:4,shield:2", spawnInterval: 1000, directions: ["right", "top", "bottom"] },
        { enemies: "spawner:5,bomber:2,worm:5", spawnInterval: 800, directions: ["right", "top", "bottom", "left"] }
      ]
    },
    {
      id: 7,
      name: "見えない恐怖",
      cpuHp: 12,
      reward: 300,
      targetWalls: 30,
      description: "新敵登場：ステルス型（時々透明になる）",
      waves: [
        { enemies: "stealth:5,bug_small:8", spawnInterval: 1200, directions: ["right", "top"] },
        { enemies: "stealth:6,shield:3", spawnInterval: 1000, directions: ["right", "left"] },
        { enemies: "stealth:8,bomber:2", spawnInterval: 1000, directions: ["right", "top", "bottom"] },
        { enemies: "stealth:10,spawner:2", spawnInterval: 800, directions: ["right", "top", "bottom", "left"] }
      ]
    },
    {
      id: 8,
      name: "突進の嵐",
      cpuHp: 12,
      reward: 350,
      targetWalls: 32,
      description: "新敵登場：ダッシュ型（突然加速する）",
      waves: [
        { enemies: "dasher:4,bug_medium:6", spawnInterval: 1200, directions: ["right"] },
        { enemies: "dasher:5,stealth:4", spawnInterval: 1000, directions: ["right", "left"] },
        { enemies: "dasher:6,bomber:3,shield:3", spawnInterval: 1000, directions: ["right", "top", "bottom"] },
        { enemies: "dasher:8,spawner:2", spawnInterval: 800, directions: ["right", "top", "bottom", "left"] }
      ]
    },
    {
      id: 9,
      name: "カオスウェーブ",
      cpuHp: 15,
      reward: 500,
      targetWalls: 35,
      waves: [
        { enemies: "bomber:3,shield:3,stealth:3,dasher:3", spawnInterval: 1000, directions: ["right", "top", "bottom", "left"] },
        { enemies: "spawner:4,bomber:4,shield:4", spawnInterval: 800, directions: ["right", "top", "bottom", "left"] },
        { enemies: "stealth:6,dasher:6,worm:10", spawnInterval: 800, directions: ["right", "top", "bottom", "left"] },
        { enemies: "bomber:5,shield:5,spawner:3,stealth:5", spawnInterval: 600, directions: ["right", "top", "bottom", "left"] },
        { enemies: "dasher:8,bomber:4,shield:4,spawner:2", spawnInterval: 600, directions: ["right", "top", "bottom", "left"] }
      ]
    },
    {
      id: 10,
      name: "最終防衛戦",
      cpuHp: 20,
      reward: 1000,
      targetWalls: 40,
      waves: [
        { enemies: "bug_small:20,bug_medium:10,worm:10", spawnInterval: 800, directions: ["right", "top", "bottom", "left"] },
        { enemies: "bomber:5,shield:5,spawner:3", spawnInterval: 700, directions: ["right", "top", "bottom", "left"] },
        { enemies: "stealth:8,dasher:8,trojan:4", spawnInterval: 600, directions: ["right", "top", "bottom", "left"] },
        { enemies: "bomber:6,shield:6,spawner:4,stealth:6", spawnInterval: 600, directions: ["right", "top", "bottom", "left"] },
        { enemies: "dasher:10,bomber:5,ransom:3", spawnInterval: 500, directions: ["right", "top", "bottom", "left"] },
        { enemies: "bomber:8,shield:8,spawner:5,stealth:8,dasher:8", spawnInterval: 500, directions: ["right", "top", "bottom", "left"] }
      ]
    }
  ],

  upgrades: [
    {
      id: "wall_duration",
      name: "壁持続時間",
      description: "壁の持続時間を1秒延長",
      maxLevel: 5,
      costs: [100, 200, 400, 800, 1600]
    },
    {
      id: "wall_damage",
      name: "壁ダメージ",
      description: "壁のダメージを20%上昇",
      maxLevel: 5,
      costs: [150, 300, 600, 1200, 2400]
    },
    {
      id: "wall_count",
      name: "同時壁数",
      description: "同時に配置できる壁を1本追加",
      maxLevel: 2,
      costs: [500, 1500]
    },
    {
      id: "cpu_hp",
      name: "CPU HP",
      description: "CPUのHPを2上昇",
      maxLevel: 5,
      costs: [100, 200, 400, 800, 1600]
    }
  ]
};

// グローバルに公開
window.DEFAULT_DATA = DEFAULT_DATA;
