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
      waves: [
        { enemies: "bug_small:5", spawnInterval: 1500, directions: ["right"] },
        { enemies: "bug_small:8", spawnInterval: 1200, directions: ["right"] },
        { enemies: "bug_small:6,bug_medium:2", spawnInterval: 1200, directions: ["right"] },
        { enemies: "bug_medium:4,bug_small:6", spawnInterval: 1000, directions: ["right", "top"] },
        { enemies: "bug_medium:5,worm:3", spawnInterval: 1000, directions: ["right", "top", "bottom"] }
      ]
    },
    {
      id: 2,
      name: "東からの脅威",
      cpuHp: 10,
      reward: 120,
      waves: [
        { enemies: "bug_small:10", spawnInterval: 1200, directions: ["right"] },
        { enemies: "bug_small:8,bug_medium:3", spawnInterval: 1000, directions: ["right"] },
        { enemies: "bug_medium:5,worm:4", spawnInterval: 1000, directions: ["right"] },
        { enemies: "worm:8,bug_small:5", spawnInterval: 800, directions: ["right"] },
        { enemies: "bug_medium:6,worm:6", spawnInterval: 800, directions: ["right"] }
      ]
    },
    {
      id: 3,
      name: "挟み撃ち",
      cpuHp: 10,
      reward: 150,
      waves: [
        { enemies: "bug_small:6,bug_small:6", spawnInterval: 1200, directions: ["right", "left"] },
        { enemies: "bug_medium:4,bug_medium:4", spawnInterval: 1000, directions: ["right", "left"] },
        { enemies: "worm:5,worm:5", spawnInterval: 1000, directions: ["right", "left"] },
        { enemies: "bug_medium:5,worm:5", spawnInterval: 800, directions: ["right", "left"] },
        { enemies: "trojan:1,bug_small:10,worm:5", spawnInterval: 800, directions: ["right", "left"] }
      ]
    },
    {
      id: 4,
      name: "高速侵入",
      cpuHp: 10,
      reward: 180,
      waves: [
        { enemies: "worm:10", spawnInterval: 800, directions: ["right", "top"] },
        { enemies: "worm:12,bug_small:5", spawnInterval: 700, directions: ["right", "bottom"] },
        { enemies: "worm:15", spawnInterval: 600, directions: ["right", "top", "bottom"] },
        { enemies: "worm:12,bug_medium:4", spawnInterval: 600, directions: ["right", "left"] },
        { enemies: "worm:20", spawnInterval: 500, directions: ["right", "top", "bottom", "left"] }
      ]
    },
    {
      id: 5,
      name: "トロイの襲来",
      cpuHp: 12,
      reward: 250,
      waves: [
        { enemies: "bug_medium:8,trojan:1", spawnInterval: 1000, directions: ["right"] },
        { enemies: "trojan:2,worm:8", spawnInterval: 900, directions: ["right", "top"] },
        { enemies: "trojan:2,bug_medium:6", spawnInterval: 800, directions: ["right", "bottom"] },
        { enemies: "trojan:3,worm:10", spawnInterval: 800, directions: ["right", "top", "bottom"] },
        { enemies: "trojan:5,bug_small:15", spawnInterval: 700, directions: ["right", "top", "bottom", "left"] }
      ]
    },
    {
      id: 6,
      name: "四面楚歌",
      cpuHp: 12,
      reward: 300,
      waves: [
        { enemies: "bug_small:12", spawnInterval: 1000, directions: ["right", "top", "bottom", "left"] },
        { enemies: "bug_medium:8", spawnInterval: 900, directions: ["right", "top", "bottom", "left"] },
        { enemies: "worm:12,bug_small:8", spawnInterval: 800, directions: ["right", "top", "bottom", "left"] },
        { enemies: "trojan:2,bug_medium:8", spawnInterval: 800, directions: ["right", "top", "bottom", "left"] },
        { enemies: "trojan:3,worm:10,bug_small:10", spawnInterval: 700, directions: ["right", "top", "bottom", "left"] },
        { enemies: "trojan:4,bug_medium:10", spawnInterval: 600, directions: ["right", "top", "bottom", "left"] }
      ]
    },
    {
      id: 7,
      name: "バグ大発生",
      cpuHp: 12,
      reward: 350,
      waves: [
        { enemies: "bug_small:25", spawnInterval: 600, directions: ["right", "top"] },
        { enemies: "bug_small:30", spawnInterval: 500, directions: ["right", "bottom", "left"] },
        { enemies: "bug_small:20,bug_medium:10", spawnInterval: 500, directions: ["right", "top", "bottom", "left"] },
        { enemies: "bug_small:35", spawnInterval: 400, directions: ["right", "top", "bottom", "left"] },
        { enemies: "bug_small:25,bug_medium:15", spawnInterval: 400, directions: ["right", "top", "bottom", "left"] },
        { enemies: "bug_small:40,bug_medium:10", spawnInterval: 350, directions: ["right", "top", "bottom", "left"] }
      ]
    },
    {
      id: 8,
      name: "重装甲部隊",
      cpuHp: 15,
      reward: 400,
      waves: [
        { enemies: "trojan:4,bug_medium:6", spawnInterval: 1000, directions: ["right", "left"] },
        { enemies: "trojan:5,ransom:1", spawnInterval: 900, directions: ["right", "top", "bottom"] },
        { enemies: "ransom:2,bug_medium:10", spawnInterval: 800, directions: ["right", "top", "bottom", "left"] },
        { enemies: "trojan:6,ransom:2", spawnInterval: 800, directions: ["right", "top", "bottom", "left"] },
        { enemies: "ransom:3,trojan:5", spawnInterval: 700, directions: ["right", "top", "bottom", "left"] },
        { enemies: "ransom:4,trojan:4,bug_medium:8", spawnInterval: 600, directions: ["right", "top", "bottom", "left"] }
      ]
    },
    {
      id: 9,
      name: "カオスウェーブ",
      cpuHp: 15,
      reward: 500,
      waves: [
        { enemies: "bug_small:10,bug_medium:5,worm:5,trojan:2", spawnInterval: 800, directions: ["right", "top", "bottom", "left"] },
        { enemies: "worm:15,trojan:3,ransom:1", spawnInterval: 700, directions: ["right", "top", "bottom", "left"] },
        { enemies: "bug_small:20,trojan:4,ransom:1", spawnInterval: 600, directions: ["right", "top", "bottom", "left"] },
        { enemies: "bug_medium:10,worm:10,trojan:3,ransom:2", spawnInterval: 600, directions: ["right", "top", "bottom", "left"] },
        { enemies: "bug_small:15,bug_medium:10,worm:8,trojan:4", spawnInterval: 500, directions: ["right", "top", "bottom", "left"] },
        { enemies: "worm:15,trojan:5,ransom:3", spawnInterval: 500, directions: ["right", "top", "bottom", "left"] },
        { enemies: "bug_small:20,bug_medium:15,trojan:5,ransom:2", spawnInterval: 400, directions: ["right", "top", "bottom", "left"] }
      ]
    },
    {
      id: 10,
      name: "最終防衛戦",
      cpuHp: 20,
      reward: 1000,
      waves: [
        { enemies: "bug_small:20,bug_medium:10,worm:10", spawnInterval: 600, directions: ["right", "top", "bottom", "left"] },
        { enemies: "trojan:5,ransom:2,worm:15", spawnInterval: 600, directions: ["right", "top", "bottom", "left"] },
        { enemies: "bug_small:30,trojan:4,ransom:2", spawnInterval: 500, directions: ["right", "top", "bottom", "left"] },
        { enemies: "bug_medium:15,worm:15,trojan:5", spawnInterval: 500, directions: ["right", "top", "bottom", "left"] },
        { enemies: "trojan:8,ransom:3", spawnInterval: 500, directions: ["right", "top", "bottom", "left"] },
        { enemies: "bug_small:25,bug_medium:15,worm:10,trojan:5,ransom:2", spawnInterval: 400, directions: ["right", "top", "bottom", "left"] },
        { enemies: "ransom:5,trojan:10,worm:20", spawnInterval: 400, directions: ["right", "top", "bottom", "left"] }
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
