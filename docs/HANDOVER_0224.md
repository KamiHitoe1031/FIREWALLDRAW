# FIREWALL DRAW 引継ぎ資料 (2026-02-24)

**前回引継ぎ**: docs/HANDOVER_0130.md (2026-01-30)
**プロジェクト**: タワーディフェンス型ゲーム「FIREWALL DRAW」
**リポジトリ**: https://github.com/KamiHitoe1031/FIREWALLDRAW.git
**技術**: Phaser 3.80.0（CDN） / 純粋JavaScript / Canvas 800×600

---

## 1. 今回のセッション群で行った作業

### 1.1 全画像アセットAI生成 (19be8f5)

Gemini 3.0 Pro Image Preview API で全27アセットを一括生成。
生成パイプライン: `asset-pipeline/generate_all.py` → `process.py`（白背景除去・リサイズ）→ WebP/PNG出力

**生成したアセット**:
- 敵スプライト 10種（bug_small〜dasher）
- CPU表情 4種（happy/worried/scared/critical）
- 背景 2種（bg_game, title_bg）
- UI 8種（ボタン3種、HPバー2種、壁アイコン3種、タイトルロゴ、矢印警告）

### 1.2 リザルト画面リッチUI化 + cpu_scared修正 (8d8e5f0)

**ResultScene.js を完全書き換え**:
- bg_game背景 + ダークオーバーレイ
- CPUスプライト表示（クリア: cpu_happy、ゲームオーバー: cpu_critical + 揺れアニメ）
- アニメーションスコアカウンター、NEW RECORDバッジ、祝賀パーティクル
- ランキング登録ボタンをTOP10圏内の場合のみ表示（`checkRankingEligibility()` で非同期チェック）

**cpu_scared.webp 修正**: Photoshopスクリーンショットだった画像をGemini APIで再生成・Pillowで処理

### 1.3 壁描画リッチ化 (36d73ff)

**Wall.draw() を3層描画に書き換え**:

| レイヤー | 太さ | 役割 |
|---------|------|------|
| 外側グロー | 28px | ぼんやりした光の広がり |
| メインボディ | 16px | 壁本体 |
| 内側コア | 4px | 明るい中心線 |

**壁タイプ別パーティクルエフェクト**:
- basic: エネルギーパルス（光の点がパス上を移動）
- fire: 炎パーティクル（上向きに揺れる黄〜赤粒子）
- ice: 氷結晶（ダイヤ形のキラキラ粒子）

**プレビュー線も壁タイプ色に対応**

### 1.4 全ステージ難易度調整 (74fe52a)

**問題**: 1方向からしか敵が来ないステージが多く簡単すぎる

**修正**: `stages.json` と `DefaultData.js` の両方を更新
- Stage 1: 2→2→3→4方向（段階的に増加）
- Stage 2: 2→3→3→4方向（旧名「東からの脅威」→「四方の脅威」）
- Stage 3〜8: 3→4→4→4方向
- Stage 9〜10: 全ウェーブ4方向（変更なし）

### 1.5 ヘルプ画面リッチ化 (c2b1aee)

**HelpScene.js を完全書き換え** — 3ページ構成に:

| ページ | 内容 |
|--------|------|
| 1. 基本ルール | CPUスプライト（アニメ付き）+ 壁アイコンで遊び方説明、ルール一覧、コツ |
| 2. 壁の種類 | basic/fire/iceの3パネル（アイコン・ステータス・壁プレビュー・アンロック条件） |
| 3. 敵図鑑 | 全10種をスプライト付き一覧表示（HP/速度/報酬・特殊能力バッジ）、スクロール対応 |

ページ切り替えナビゲーション（< >ボタン + インジケーターバー）

### 1.6 効果音(SE)実装 (1ed15f6)

**ElevenLabs Sound Effects API** で18種のSEを生成。
生成スクリプト: `asset-pipeline/generate_sfx.py`

**SoundManager.js（新規ユーティリティ）**:
- `play(key, config)` — 存在チェック・連打制限（50ms）付きSE再生
- `setMuted(flag)` / `toggleMute()` — ミュート（localStorage永続化）
- `setVolume(vol)` — 全体音量調整

**SE一覧**:

| カテゴリ | SE名 | トリガー |
|---------|------|---------|
| 壁 | sfx_draw | 壁描画完了 |
| 壁 | sfx_draw_cancel | 描画キャンセル（短すぎ） |
| 戦闘 | sfx_hit | 敵が壁にヒット |
| 戦闘 | sfx_kill | 敵撃破 |
| 戦闘 | sfx_cpu_damage | CPUダメージ |
| ウェーブ | sfx_wave_start | ウェーブ開始警報 |
| ウェーブ | sfx_wave_clear | ウェーブクリア |
| ステージ | sfx_stage_clear | ステージクリア |
| ステージ | sfx_game_over | ゲームオーバー |
| 特殊敵 | sfx_bomber_explode | ボマー爆発 |
| 特殊敵 | sfx_shield_break | シールド消費 |
| 特殊敵 | sfx_spawner_spawn | スポナー召喚 |
| 特殊敵 | sfx_stealth_toggle | ステルス切替 |
| 特殊敵 | sfx_dasher_dash | ダッシュ加速 |
| UI | sfx_button_click | ボタン押下 |
| UI | sfx_button_hover | ホバー |
| リザルト | sfx_new_record | 新記録 |
| リザルト | sfx_coin_reward | 報酬獲得 |

**UIScene.js にミュートトグルボタン追加**（右上「S」/「M」表示）

### 1.7 ブリーフィング画面追加 (9ded89d)

**BriefingScene.js（新規シーン）** — ステージ開始前の情報画面

フロー変更: `StageSelectScene` → **`BriefingScene`** → `GameScene`

**表示内容**:
- ステージ名・番号・難易度
- ステージ説明（新敵登場時のみ）
- ステージ情報バー（CPU HP / ウェーブ数 / 報酬）
- 出現する敵カード一覧（2列表示、スプライト・HP・速度・特殊能力バッジ付き）
- 敵構成に応じた攻略TIPS（ボマー→壁破壊注意、シールド→2重壁推奨 等）
- STARTボタン（パルスアニメ）/ 戻るボタン

### 1.8 ゲームサムネイル生成 (8346ce6)

Gemini 3.0 Proで16:9サムネイル（1280×720）を生成。
- `assets/images/thumbnail.jpg` / `thumbnail.webp`
- CPUキャラ中央、周囲にウイルス敵、3色グロー壁、サイバーパンク背景
- タイトル「FIREWALL DRAW / Draw walls. Defend CPU.」

---

## 2. 現在のファイル構成

```
firewall-draw/
├── index.html                  # エントリーポイント
├── css/style.css
├── README.md
│
├── assets/
│   ├── data/
│   │   ├── enemies.json        # 敵定義 (10種)
│   │   ├── walls.json          # 壁定義 (3種: basic/fire/ice)
│   │   ├── stages.json         # ステージ定義 (10ステージ)
│   │   └── upgrades.json       # アップグレード定義
│   ├── audio/
│   │   └── sfx/                # SE 18ファイル (.mp3)
│   └── images/
│       ├── backgrounds/        # bg1.webp, title_bg.png
│       ├── cpu/                # happy/worried/scared/critical (.webp+.png)
│       ├── enemies/            # 10種 (.webp/.png)
│       ├── ui/                 # ボタン・アイコン・HPバー等 (.png)
│       ├── thumbnail.jpg       # ゲームサムネイル (1280×720)
│       └── thumbnail.webp
│
├── js/
│   ├── main.js                 # Phaser設定・GameData・シーン登録
│   ├── AssetManager.js         # 画像存在チェック・フォールバック
│   ├── PlaceholderConfig.js    # プレースホルダー色設定
│   ├── data/
│   │   └── DefaultData.js      # JSON読み込み失敗時フォールバック
│   ├── utils/
│   │   ├── SaveManager.js      # localStorage セーブ/ロード
│   │   ├── RankingManager.js   # Cloudflare Workers ランキングAPI
│   │   └── SoundManager.js     # SE再生・ミュート管理 ★NEW
│   └── scenes/
│       ├── BootScene.js        # 初期化
│       ├── PreloadScene.js     # アセット読み込み (画像+JSON+SE)
│       ├── TitleScene.js       # タイトル画面
│       ├── StageSelectScene.js # ステージ選択
│       ├── BriefingScene.js    # ステージブリーフィング ★NEW
│       ├── HelpScene.js        # ヘルプ (3ページ)
│       ├── DataScene.js        # データ管理 (セーブ/リセット)
│       ├── GameScene.js        # メインゲーム (Wall/Enemy クラス含む)
│       ├── UIScene.js          # HUD (並列起動、ミュートボタン)
│       ├── ResultScene.js      # リザルト (クリア/ゲームオーバー)
│       └── RankingScene.js     # ランキング表示
│
├── workers/
│   └── ranking-api.js          # Cloudflare Workers ランキングAPI
├── wrangler.json               # Cloudflare Workers設定
│
└── docs/
    ├── HANDOVER_v1.md          # 初版引継ぎ
    ├── HANDOVER_0130.md        # 0130引継ぎ
    ├── HANDOVER_0224.md        # 本ファイル
    └── visual_design_proposal.md
```

### アセット生成パイプライン (別ディレクトリ)

```
asset-pipeline/
├── generate_all.py             # Gemini 3.0 Pro 画像一括生成
├── generate.py                 # 単体画像生成
├── process.py                  # 白背景除去・リサイズ
├── generate_sfx.py             # ElevenLabs SE一括生成 ★NEW
└── raw/                        # 生成元画像
```

---

## 3. シーン遷移フロー

```
BootScene → PreloadScene → TitleScene
                              ├── HelpScene (3ページ) → TitleScene
                              ├── DataScene → TitleScene
                              └── StageSelectScene
                                    ├── RankingScene → StageSelectScene
                                    └── BriefingScene ★NEW
                                          └── GameScene + UIScene (並列)
                                                └── ResultScene
                                                      ├── 次のステージ → BriefingScene
                                                      ├── リトライ → BriefingScene
                                                      ├── ランキング登録
                                                      └── タイトルへ → TitleScene
```

---

## 4. ゲームシステム仕様

### 4.1 壁システム

| 壁タイプ | ダメージ | 特殊効果 | アンロック |
|---------|---------|---------|-----------|
| basic | 10 | なし | 最初から |
| fire | 15 | DoT 3dmg/500ms×3秒 | Stage3クリア + 300コイン |
| ice | 5 | 80%スロー 2秒 | Stage5クリア + 500コイン |

- 同時配置: 3本（+アップグレード）
- 持続時間: 5秒（+アップグレード）
- 最小長: 50px / 最大長: 300px(normal) / 200px(hard)
- 描画: 3層（グロー28px → ボディ16px → コア4px）+ タイプ別パーティクル

### 4.2 敵システム (10種)

| ID | 名前 | HP | 速度 | 特殊 | 登場 |
|----|------|-----|------|------|------|
| bug_small | バグ（小） | 10 | 80 | - | Stage 1 |
| bug_medium | バグ（中） | 25 | 60 | - | Stage 1 |
| worm | ワーム | 15 | 120 | - | Stage 2 |
| trojan | トロイ | 50 | 40 | - | Stage 3 |
| bomber | ボマー | 20 | 80 | 壁破壊自爆 | Stage 4 |
| shield | シールド型 | 15 | 100 | 1回すり抜け | Stage 5 |
| spawner | スポナー | 40 | 50 | 死亡時bug_small×3召喚 | Stage 6 |
| stealth | ステルス型 | 12 | 120 | 2秒ごと透明切替 | Stage 7 |
| dasher | ダッシュ型 | 25 | 80 | 3秒周期で1秒間3倍速 | Stage 8 |
| ransom | ランサム | 80 | 50 | - | Stage 10 |

### 4.3 アップグレード

| ID | 名前 | 効果 | 最大Lv | コスト |
|----|------|------|--------|-------|
| wall_duration | 壁持続時間 | +1秒/Lv | 5 | 100〜1600 |
| wall_damage | 壁ダメージ | +20%/Lv | 5 | 150〜2400 |
| wall_count | 同時壁数 | +1本/Lv | 2 | 500, 1500 |
| cpu_hp | CPU HP | +2/Lv | 5 | 100〜1600 |

### 4.4 難易度

| 設定 | normal | hard |
|------|--------|------|
| 壁最大長 | 300px | 200px |
| 敵数倍率 | 1.0x | 1.5x |
| 敵HP倍率 | 1.0x | 1.2x |
| CPU HP基準 | 10 | 8 |

---

## 5. 外部サービス

### ランキングAPI
- **エンドポイント**: `https://firewall-ranking-api.eteandran.workers.dev`
- **基盤**: Cloudflare Workers + KV
- **API**:
  - `POST /submit` — スコア送信
  - `GET /rankings?stageId=&difficulty=&limit=` — TOP取得
  - `GET /best-scores?difficulty=` — 全ステージベストスコア

### アセット生成API
- **Gemini 3.0 Pro**: `generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent`
- **ElevenLabs SE**: `api.elevenlabs.io/v1/sound-generation`
- いずれも環境変数でキーを渡す（ハードコード禁止）

---

## 6. コミット履歴（今回のセッション群）

```
8346ce6 feat: ゲームサムネイル画像を追加（16:9, 1280x720）
9ded89d feat: ステージ開始前ブリーフィング画面を追加
1ed15f6 feat: 効果音(SE)を実装 - ElevenLabs APIで18種のSEを生成
c2b1aee feat: ヘルプ画面を実際のゲーム素材を使ったリッチUI版に刷新
74fe52a balance: 全ステージで複数方向から同時攻撃するよう難易度調整
36d73ff feat: 壁描画をリッチ化（3層描画+タイプ別パーティクルエフェクト）
8d8e5f0 feat: リザルト画面リッチUI化 + ランキングTOP10チェック + cpu_scared画像修正
19be8f5 feat: 全画像アセットをAI生成で追加（Gemini 3.0 Pro）
```

---

## 7. 既知の課題・制限

### 7.1 制限事項
- `file://` プロトコルではJSONが読み込めない（DefaultData.jsで代替）
- ランキングは1ステージ20件まで
- SEファイルが存在しなくてもエラーにならない（静かにスキップ）

### 7.2 未実装・改善候補

| 優先度 | 内容 | 備考 |
|--------|------|------|
| 高 | BGM（ゲーム中・タイトル） | SEは完了、BGMは未着手 |
| 中 | ショップ画面UI | 壁購入・アップグレード購入UIが未実装（データ定義のみ） |
| 中 | モバイルタッチ対応 | 現在はマウス操作のみ |
| 低 | パフォーマンス最適化 | オブジェクトプール等 |
| 低 | チュートリアル | Stage1初回プレイ時のガイド |
| 低 | 多言語対応 | 現在は日本語のみ |

---

## 8. 開発環境メモ

### ローカル実行
```bash
cd firewall-draw
# 任意のHTTPサーバー（file://だとJSON読み込み不可）
npx serve .          # or python -m http.server 8080
```

### アセット生成
```bash
# 画像生成
GEMINI_API_KEY="xxx" python asset-pipeline/generate_all.py

# SE生成
ELEVENLABS_API_KEY="xxx" python asset-pipeline/generate_sfx.py

# 特定のSEのみ再生成
ELEVENLABS_API_KEY="xxx" python asset-pipeline/generate_sfx.py hit.mp3 kill.mp3 --force
```

### 画像キー命名規則

| カテゴリ | 形式 | 例 |
|---------|------|-----|
| 敵 | `enemy_{id}` | `enemy_bug_small`, `enemy_bomber` |
| CPU | `cpu_{state}` | `cpu_happy`, `cpu_critical` |
| 背景 | `bg_{area}` | `bg_game`, `bg_title` |
| UI | `btn_{name}` / `icon_{name}` | `btn_start`, `icon_wall_fire` |
| SE | `sfx_{event}` | `sfx_hit`, `sfx_wave_start` |

---

## 9. 参照ドキュメント

| ファイル | 内容 |
|---------|------|
| `docs/HANDOVER_v1.md` | 初版引継ぎ（プロジェクト全体像） |
| `docs/HANDOVER_0130.md` | 0130引継ぎ（シールド修正・ランキング修正・画像対応） |
| `docs/HANDOVER_0224.md` | 本ファイル |
| `docs/visual_design_proposal.md` | ビジュアルデザイン提案書 |

---

*本ドキュメントは 2026-02-24 時点の引継ぎ資料です。*
