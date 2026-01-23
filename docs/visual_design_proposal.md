# FIREWALL DRAW ビジュアルデザイン提案書

## 概要

本ドキュメントは「FIREWALL DRAW」のビジュアル要素を整理し、画像・デザインの改善提案をまとめたものです。

---

## 1. 現状のビジュアル要素

### 1.1 現在の実装方式

現在、ゲームは**プレースホルダー方式**で動作しています：
- 画像ファイルは存在せず、`Phaser.Graphics`で図形を描画
- `PlaceholderConfig.js`で各要素の色・サイズ・形状を定義
- `AssetManager.js`が画像の有無を判定し、なければプレースホルダーを生成

### 1.2 UI要素

| 画面 | 現在の実装 | 備考 |
|------|-----------|------|
| タイトル画面 | テキスト + グリッド背景 | `FIREWALL`（水色）+ `DRAW`（オレンジ）|
| ステージ選択 | 数字ボタン（2行5列） | クリア済みは緑、未開放はグレー |
| ゲーム画面 | グリッド背景（濃緑） | 回路パターン風 |
| リザルト画面 | テキストベース | 統計・ボーナス表示 |
| ヘルプ画面 | スクロール可能リスト | 敵図鑑含む |
| ランキング画面 | テーブル形式 | オンライン対応 |

### 1.3 プレイヤー（CPU/コア）

| 要素 | 現在の仕様 | 備考 |
|------|-----------|------|
| サイズ | 64×64 px | |
| 形状 | 四角形（水色） | 内部にグリッドパターン |
| 表情 | 絵文字（😊😰😨😱） | HPに応じて変化 |

### 1.4 敵キャラクター（10種）

| ID | 名前 | サイズ | 現在の色 | 形状 | 特殊能力 |
|----|------|--------|----------|------|----------|
| `bug_small` | バグ（小） | 24×24 | 緑 `#00ff00` | 円 | なし |
| `bug_medium` | バグ（中） | 32×32 | 黄 `#ffff00` | 円 | なし |
| `worm` | ワーム | 32×16 | 赤 `#ff0000` | 長方形 | 高速 |
| `trojan` | トロイ | 48×48 | 紫 `#9900ff` | 四角 | 高耐久 |
| `ransom` | ランサム | 64×64 | 黒 `#333333` | 四角 | 最強 |
| `bomber` | ボマー | 40×40 | オレンジ `#FF6600` | 円 | 壁破壊・自爆 |
| `shield` | シールド型 | 20×20 | シアン `#00FFFF` | 円 | 壁1回すり抜け |
| `spawner` | スポナー | 48×48 | 紫 `#9900FF` | 円 | 死亡時小型召喚 |
| `stealth` | ステルス型 | 20×20 | グレー `#888888` | 円 | 透明化 |
| `dasher` | ダッシュ型 | 32×32 | 黄 `#FFFF00` | 円 | 加速 |

**注意**: `bomber`, `shield`, `spawner`, `stealth`, `dasher`は`PlaceholderConfig.js`に未定義。

### 1.5 壁

| タイプ | 色 | 効果 |
|--------|-----|------|
| 基本の壁 | 水色 `#00aaff` | 通常ダメージ |
| 炎の壁 | オレンジ `#ff6600` | DOT（継続ダメージ） |
| 氷の壁 | シアン `#00ffff` | 減速効果 |

**描画仕様**:
- 太さ: 16px
- プレイヤーが描いた軌跡に沿って描画
- 時間経過でアルファ値が減少（フェードアウト）
- キラキラエフェクト（白い点）

### 1.6 エフェクト

| エフェクト | 現在の実装 |
|-----------|-----------|
| 爆発（ボマー） | 12個のオレンジ粒子 + 画面揺れ |
| シールド消滅 | アルファ点滅 + 暗転 |
| ステルス | アルファ0.2⇔1.0の切り替え |
| ダッシュ | スケール変形（横1.3倍、縦0.7倍） |
| 撃破 | 8個の黄色粒子 |
| ステージクリア | 30個のカラフル紙吹雪 |

### 1.7 背景

| 画面 | 現在の背景 |
|------|-----------|
| タイトル | 濃紺 `#1a1a2e` + グリッド + 光点 |
| ゲーム | 濃緑 `#004400` + グリッド |
| その他 | 濃紺 `#1a1a2e` |

---

## 2. 推奨画像仕様

### 2.1 敵キャラクター

| 要素 | 推奨サイズ | 形式 | アニメーション | 透過 |
|------|-----------|------|----------------|------|
| bug_small | 48×48 | PNG | 2フレーム（待機） | 必須 |
| bug_medium | 64×64 | PNG | 2フレーム | 必須 |
| worm | 64×32 | PNG | 4フレーム（蠕動） | 必須 |
| trojan | 96×96 | PNG | 2フレーム | 必須 |
| ransom | 128×128 | PNG | 4フレーム | 必須 |
| bomber | 80×80 | PNG | 2フレーム（点滅） | 必須 |
| shield | 48×48 | PNG | 2フレーム（シールド光） | 必須 |
| spawner | 96×96 | PNG | 4フレーム（脈動） | 必須 |
| stealth | 48×48 | PNG | 2フレーム | 必須 |
| dasher | 64×64 | PNG | 4フレーム（加速） | 必須 |

**スプライトシート形式**: 横並び、各フレーム同サイズ

### 2.2 CPU/コア

| 要素 | 推奨サイズ | 形式 | 備考 |
|------|-----------|------|------|
| 本体 | 128×128 | PNG | 透過必須 |
| 表情（4種） | 64×64 | PNG | 😊😰😨😱相当 |

### 2.3 壁テクスチャ

| 要素 | 推奨サイズ | 形式 | 備考 |
|------|-----------|------|------|
| 基本の壁（タイル） | 32×32 | PNG | シームレス |
| 炎の壁 | 32×32 | PNG | アニメ4フレーム |
| 氷の壁 | 32×32 | PNG | 透明感 |

### 2.4 UI要素

| 要素 | 推奨サイズ | 形式 |
|------|-----------|------|
| タイトルロゴ | 400×150 | PNG |
| ボタン各種 | 200×60 | PNG/9-slice |
| アイコン（壁タイプ） | 64×64 | PNG |
| 背景（タイトル） | 800×600 | PNG/JPG |
| 背景（ゲーム） | 800×600 | PNG/JPG |

### 2.5 エフェクト

| 要素 | 推奨サイズ | 形式 | 備考 |
|------|-----------|------|------|
| 爆発 | 128×128 | PNG | 8フレーム |
| 撃破パーティクル | 16×16 | PNG | 単色可 |
| シールドオーラ | 64×64 | PNG | 透過グラデ |

---

## 3. デザインの方向性提案

### 3.1 推奨スタイル: **サイバーパンク × レトロゲーム**

#### コンセプト
- **テーマ**: コンピュータセキュリティ、ウイルス vs ファイアウォール
- **カラー**: ネオンカラー（シアン、マゼンタ、イエロー）on ダークブルー
- **テクスチャ**: 回路基板、デジタルグリッド、グリッチエフェクト

#### カラーパレット

```
背景系:
  - メイン背景: #0a0a1a（ほぼ黒の紺）
  - サブ背景: #1a1a3e（濃紺）
  - グリッド線: #00ffff30（透過シアン）

プレイヤー系:
  - CPU本体: #00aaff（ブライトシアン）
  - 壁（基本）: #00ffff（シアン）
  - 壁（炎）: #ff6600（オレンジ）
  - 壁（氷）: #aaffff（ライトシアン）

敵キャラ系:
  - バグ系: #00ff00（グリーン）- 生物的
  - ワーム: #ff0000（レッド）- 危険
  - トロイ: #9900ff（パープル）- 偽装
  - ランサム: #ff00ff（マゼンタ）- 脅威
  - ボマー: #ff6600（オレンジ）- 爆発
  - シールド: #00ffff（シアン）- 防御
  - スポナー: #cc00ff（ピンク紫）- 増殖
  - ステルス: #666666（グレー）- 隠密
  - ダッシュ: #ffff00（イエロー）- スピード

UI系:
  - テキスト（通常）: #ffffff
  - テキスト（強調）: #ffff00
  - テキスト（警告）: #ff0000
  - ボタン（ポジティブ）: #00aa00
  - ボタン（ネガティブ）: #666666
```

### 3.2 敵キャラクターの視覚的特徴

能力が一目でわかるデザインを推奨：

| 敵タイプ | デザインイメージ | 視覚的特徴 |
|----------|-----------------|-----------|
| バグ（小） | ドット絵のムシ | 触角、6本足 |
| バグ（中） | 大きめのムシ | 羽付き |
| ワーム | 蛇/ミミズ | 長い体、縞模様 |
| トロイ | 木馬のアイコン | 偽装感、二重構造 |
| ランサム | 鍵/錠前 | 黒い影、威圧感 |
| ボマー | 爆弾マーク | 導火線、カウントダウン |
| シールド | バリア付き | 半透明オーラ |
| スポナー | 卵/巣 | 内部に小型が見える |
| ステルス | 半透明 | 輪郭だけ、グリッチ |
| ダッシュ | 流線形 | スピードライン |

### 3.3 アニメーション指針

- **待機アニメ**: 2フレーム、0.5秒周期
- **移動アニメ**: 方向に応じた傾き
- **ダメージ**: 赤フラッシュ + 縮小
- **死亡**: パーティクル分解

---

## 4. 画像ファイルの配置場所

### 4.1 現在のフォルダ構造

```
firewall-draw/
├── assets/
│   └── data/           # JSONデータのみ
│       ├── enemies.json
│       ├── stages.json
│       ├── upgrades.json
│       └── walls.json
├── css/
├── js/
└── index.html
```

### 4.2 推奨フォルダ構造

```
firewall-draw/
├── assets/
│   ├── data/           # JSONデータ
│   ├── images/
│   │   ├── enemies/    # 敵スプライト
│   │   │   ├── bug_small.png
│   │   │   ├── bug_medium.png
│   │   │   ├── worm.png
│   │   │   ├── trojan.png
│   │   │   ├── ransom.png
│   │   │   ├── bomber.png
│   │   │   ├── shield.png
│   │   │   ├── spawner.png
│   │   │   ├── stealth.png
│   │   │   └── dasher.png
│   │   ├── cpu/        # CPU/コア
│   │   │   ├── cpu_body.png
│   │   │   └── cpu_faces.png
│   │   ├── walls/      # 壁テクスチャ
│   │   │   ├── wall_basic.png
│   │   │   ├── wall_fire.png
│   │   │   └── wall_ice.png
│   │   ├── effects/    # エフェクト
│   │   │   ├── explosion.png
│   │   │   ├── particle.png
│   │   │   └── shield_aura.png
│   │   ├── ui/         # UI要素
│   │   │   ├── title_logo.png
│   │   │   ├── button_green.png
│   │   │   ├── button_red.png
│   │   │   └── icons.png
│   │   └── backgrounds/ # 背景
│   │       ├── bg_title.png
│   │       └── bg_game.png
│   └── audio/          # 効果音・BGM（将来用）
│       ├── bgm/
│       └── sfx/
```

---

## 5. 実装時の注意点

### 5.1 Phaserでの画像読み込み

#### PreloadScene での読み込み

```javascript
// PreloadScene.js
preload() {
  // 敵スプライト
  this.load.image('enemy_bug_small', 'assets/images/enemies/bug_small.png');
  this.load.image('enemy_bug_medium', 'assets/images/enemies/bug_medium.png');
  // ... 他の敵

  // スプライトシート（アニメーション用）
  this.load.spritesheet('enemy_worm', 'assets/images/enemies/worm.png', {
    frameWidth: 64,
    frameHeight: 32
  });

  // 背景
  this.load.image('bg_title', 'assets/images/backgrounds/bg_title.png');
  this.load.image('bg_game', 'assets/images/backgrounds/bg_game.png');

  // UI
  this.load.image('title_logo', 'assets/images/ui/title_logo.png');
}
```

### 5.2 スプライトシートの作り方

#### 形式
```
┌────┬────┬────┬────┐
│ F1 │ F2 │ F3 │ F4 │  ← 横一列に並べる
└────┴────┴────┴────┘
  64   64   64   64     ← 各フレーム同サイズ
```

#### アニメーション定義
```javascript
// アニメーション作成
this.anims.create({
  key: 'worm_move',
  frames: this.anims.generateFrameNumbers('enemy_worm', { start: 0, end: 3 }),
  frameRate: 8,
  repeat: -1
});

// 使用
enemy.sprite.play('worm_move');
```

### 5.3 AssetManagerとの連携

現在の`AssetManager`は画像がなければプレースホルダーを表示する設計なので、
画像を追加しても既存コードはそのまま動作します。

```javascript
// AssetManager.js の getSprite メソッド
getSprite(x, y, key, config = {}) {
  if (this.scene.textures.exists(key)) {
    return this.scene.add.sprite(x, y, key);  // 画像があれば使用
  }
  return this.createPlaceholder(x, y, key, config);  // なければプレースホルダー
}
```

### 5.4 PlaceholderConfigの更新

新しい敵5種を追加する場合：

```javascript
// PlaceholderConfig.js に追加
enemy_bomber: {
  width: 40,
  height: 40,
  color: 0xFF6600,
  shape: 'circle',
  label: 'ボマー'
},
enemy_shield: {
  width: 20,
  height: 20,
  color: 0x00FFFF,
  shape: 'circle',
  label: 'シールド'
},
enemy_spawner: {
  width: 48,
  height: 48,
  color: 0x9900FF,
  shape: 'circle',
  label: 'スポナー'
},
enemy_stealth: {
  width: 20,
  height: 20,
  color: 0x888888,
  shape: 'circle',
  label: 'ステルス'
},
enemy_dasher: {
  width: 32,
  height: 32,
  color: 0xFFFF00,
  shape: 'circle',
  label: 'ダッシュ'
}
```

---

## 6. 優先度と実装ロードマップ

### Phase 1: 必須（ゲーム体験向上）
1. 敵キャラクター10種のスプライト
2. CPU/コアのデザイン
3. 壁のテクスチャ

### Phase 2: 推奨（印象向上）
4. タイトルロゴ
5. 背景画像（タイトル、ゲーム）
6. エフェクト改善

### Phase 3: オプション（完成度向上）
7. UIボタン画像
8. サウンドエフェクト
9. BGM

---

## 7. 参考リソース

### 無料素材サイト
- [OpenGameArt.org](https://opengameart.org/) - ゲーム素材
- [Kenney.nl](https://kenney.nl/) - 高品質フリー素材
- [itch.io](https://itch.io/game-assets/free) - インディー向け素材

### ツール
- **Aseprite**: ドット絵・スプライトシート作成
- **GIMP/Photoshop**: 画像編集
- **TexturePacker**: スプライトシート自動生成

---

*最終更新: 2026-01-23*
