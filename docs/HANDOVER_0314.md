# FIREWALL DRAW 引継ぎ資料 (2026-03-14)

**前回引継ぎ**: docs/HANDOVER_0224.md (2026-02-24)
**プロジェクト**: タワーディフェンス型ゲーム「FIREWALL DRAW」
**リポジトリ**: https://github.com/KamiHitoe1031/FIREWALLDRAW.git
**技術**: Phaser 3.80.0（CDN） / 純粋JavaScript / Canvas 800×600

---

## 1. 今回のセッションで行った作業

### 1.1 音量調整機能 (UIScene)

**ポーズメニューに5段階ボリュームボタン追加**

| レベル | 音量値 |
|--------|--------|
| 0% | 0.0 |
| 25% | 0.25 |
| 50% | 0.5（デフォルト） |
| 75% | 0.75 |
| 100% | 1.0 |

- SoundManager.jsのデフォルト音量を `0.7` → `0.5` に変更
- ポーズメニュー内にボタン配置（ドラッグスライダーではなく離散ボタン方式）
- UIScene・GameScene両方のSoundManagerに同期

### 1.2 キャラクター選択システム

**5種類のCPUキャラクターをステージ開始前に選択可能**

| ID | 名前 | テーマカラー | 壁数 | 壁持続 | CPU HP | 壁ダメ | コスト |
|---|---|---|---|---|---|---|---|
| `standard` | スタンダード | 青(0x00aaff) | ±0 | ±0 | ±0 | ±0 | 無料 |
| `fortress` | フォートレス | 鋼青(0x4466aa) | ±0 | -1秒 | +3 | ±0 | 200 |
| `multicore` | マルチコア | 緑(0x44cc44) | +1 | ±0 | -2 | ±0 | 300 |
| `chrono` | クロノ | 紫(0xaa44ff) | -1 | +2.5秒 | ±0 | ±0 | 400 |
| `striker` | ストライカー | 赤(0xff4444) | ±0 | ±0 | -2 | x1.4 | 500 |

**変更ファイル**:
- `DefaultData.js` - CHARACTER_DATA定数追加（5キャラ定義 + unlockCost）
- `SaveManager.js` - selectedCharacter / unlockedCharacters 永続化、unlockCharacter()メソッド
- `main.js` - GameData.selectedCharacter追加
- `BriefingScene.js` - キャラ選択UI（画像付きカード + コインアンロック確認ダイアログ）
- `GameScene.js` - キャラ補正値をinit()で適用 + スプライトシート対応CPU描画 + キャラカラー枠
- `ResultScene.js` - スプライトシート対応showCpuCharacter()

### 1.3 コインアンロック機能

**BriefingScene内でキャラクターをコインで解放**

- スタンダード: 初期アンロック（無料）
- 他4キャラ: ロック中はグレーアウト + コスト表示
- クリックで確認ダイアログ表示（キャラ画像・説明・コスト・所持コイン）
- コイン足りる場合のみ「解放する」ボタンが出現
- 解放後はカードが即座に再構築される

### 1.4 キャラクター別CPU画像

**2×2グリッドスプライトシート方式（1キャラ1枚 × 5キャラ = 5枚）**

| ファイル | サイズ | フレーム構成 |
|---------|--------|------------|
| `standard_sheet.webp` | 512×512 | 左上=happy, 右上=worried, 左下=scared, 右下=critical |
| `fortress_sheet.webp` | 同上 | 同上 |
| `multicore_sheet.webp` | 同上 | 同上 |
| `chrono_sheet.webp` | 同上 | 同上 |
| `striker_sheet.webp` | 同上 | 同上 |

**Phaser読み込みパラメータ**:
```javascript
this.load.spritesheet(`char_${charId}`, `assets/images/cpu/${charId}_sheet.webp`, {
  frameWidth: 250,
  frameHeight: 250,
  margin: 3,
  spacing: 6
});
```

**フォールバックチェーン**: キャラスプライトシート → 汎用cpu_*画像 → Graphicsプレースホルダー

### 1.5 ゲーム中CPU枠表示

- CPUスプライトの周囲にキャラクターテーマカラーの角丸枠を表示
- 内枠: キャラカラー3px + 外枠: 白1px

---

## 2. セーブデータ構造（更新後）

```json
{
  "normal": { "clearedStages": [1,2,3], "highScores": {"1":1500} },
  "hard": { "clearedStages": [], "highScores": {} },
  "coins": 2500,
  "unlockedWalls": ["basic", "fire"],
  "unlockedCharacters": ["standard", "fortress"],
  "upgrades": { "wall_duration": 2, "wall_damage": 1, "wall_count": 1, "cpu_hp": 2 },
  "selectedCharacter": "fortress"
}
```

**新規フィールド**:
- `unlockedCharacters`: アンロック済みキャラID配列（デフォルト: `["standard"]`）
- `selectedCharacter`: 選択中キャラID（デフォルト: `"standard"`）

旧セーブデータはmigrate()で自動補完。

---

## 3. コミット履歴

```
79dab95 feat: キャラ選択に画像表示 + コインアンロック機能追加
a92a2ae feat: ゲーム中CPUスプライトにキャラカラー枠を追加
0538429 feat: 音量調整 + キャラクター選択システム + キャラ別CPU画像
```

---

## 4. 既知の課題・次のステップ

| 優先度 | 内容 | 備考 |
|--------|------|------|
| 高 | BGM（ゲーム中・タイトル） | SEは完了、BGMは未着手 |
| 中 | ショップ画面UI | 壁購入・アップグレード購入UIが独立画面として未実装 |
| 中 | モバイルタッチ対応 | 現在はマウス操作のみ |
| 低 | キャラクター追加 | CHARACTER_DATA + スプライトシート追加で容易に拡張可能 |
| 低 | チュートリアル | Stage1初回プレイ時のガイド |

---

## 5. 参照ドキュメント

| ファイル | 内容 |
|---------|------|
| `docs/HANDOVER_v1.md` | 初版引継ぎ（プロジェクト全体像） |
| `docs/HANDOVER_0130.md` | 0130引継ぎ（シールド修正・ランキング修正・画像対応） |
| `docs/HANDOVER_0224.md` | 0224引継ぎ（全画像生成・SE実装・ブリーフィング画面） |
| `docs/HANDOVER_0314.md` | 本ファイル |
| `docs/visual_design_proposal.md` | ビジュアルデザイン提案書 |

---

*本ドキュメントは 2026-03-14 時点の引継ぎ資料です。*
