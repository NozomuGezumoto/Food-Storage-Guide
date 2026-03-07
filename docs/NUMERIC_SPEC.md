# Food Storage Guide — 数値で表せるすべての仕様

このアプリで数値として定義・利用されている**すべて**をまとめた文書です。通知以外の UI・ロジック・設定も含みます。

---

## 1. 通知

### 1.1 時刻
| 項目 | 値 | 単位 | 場所 |
|------|-----|------|------|
| デフォルト時 | 9 | 0–23 | `useNotificationTimeStore.ts` |
| デフォルト分 | 0 | 0–59 | 同上 |
| 時刻 clamp | 時 0–23, 分 0–59 | - | `app/modal.tsx` |
| 分の padStart | 2 | 桁 | `notifications.ts` |

### 1.2 種類
- 前日通知: 期限日の前日 1 回
- 当日通知: 期限日の当日 1 回

### 1.3 Android
| 項目 | 値 | 単位 |
|------|-----|------|
| バイブレーション | [0, 250, 250, 250] | ms |

---

## 2. 通知日数（notifyDays）

### 2.1 計算
- `notifyAt = purchasedAt + notifyDays × 86,400,000` (ms)
- DAY = 86,400,000 ms

### 2.2 範囲フォールバック
| 場面 | min | max |
|------|-----|-----|
| range 未定義 | 1 | 30 |
| defaultNotifyDaysByStorage 未定義 | - | 3 |
| EditModal 初期値 | - | 3 |

### 2.3 食材別
- 250 件の食材ごとに `min`, `max`, `defaultNotifyDays` を定義（`data/foods.ts`）
- 例: 刺身 1–2 日、米 365–730 日、はちみつ 365–999 日 など

---

## 3. 日付・時間計算

| 定数/関数 | 値/説明 |
|-----------|---------|
| DAY | 86,400,000 ms |
| addDays(ms, days) | ms + days × DAY |
| startOfDayLocal(ms) | ローカル 00:00:00.000 |
| setTimeOnDate(dayStartMs, hour, minute) | 指定日の hour:minute |
| calcNotifyAt(purchasedAt, notifyDays) | purchasedAt + notifyDays × DAY |
| getRemainingDays(notifyAt) | 今日〜期限日の残り日数 |
| getDaysFromRegistration(purchasedAt) | 購入日からの経過日数 |
| formatNotifyDate(ts) | `getMonth() + 1`, `padStart(2, '0')` で YYYY/MM/DD |
| formatDate(ts) | 同上、history 用 |
| inclusiveRangeCount(min, max) | max - min + 1 |
| isInclusiveRange(value, min, max) | value ∈ [min, max] |

---

## 4. 一覧・セクション

### 4.1 ホーム（残り日数）
| セクション | remaining | 境界 |
|------------|-----------|------|
| 今日・期限間近 | 0 ≤ remaining ≤ 1 | remaining ≤ 1 で urgent 表示 |
| もうすぐ | 2 ≤ remaining ≤ 6 | - |
| 余裕あり | 7 ≤ remaining | - |

### 4.2 検索
| 項目 | 値 | 説明 |
|------|-----|------|
| よく使う判定 | count > 0 | 購入履歴にある食材 |
| ソート | よく使う順 → 名前順 | - |

---

## 5. タイミング・遅延

| 項目 | 値 | 単位 | 場所 |
|------|-----|------|------|
| 復元後 reschedule | 100 | ms | `usePurchasesStore` onRehydrateStorage |
| Web 購入後の replace 待ち | 150 | ms | `purchase.tsx` setTimeout |

---

## 6. 画像

| 項目 | 値 | 場所 |
|------|-----|------|
| ImagePicker quality | 0.8 | PurchaseModal, EditModal, purchase.tsx |

---

## 7. UI レイアウト（全画面）

### 7.1 PurchaseModal
| 要素 | 値 | 単位 |
|------|-----|------|
| ハンドル | 36×4, borderRadius 2 | px |
| モーダル | maxHeight 90% | - |
| スクロール | maxHeight 400 | px |
| ステッパー | 40×40, borderRadius 20 | px |
| Web オーバーレイ | zIndex 9999 | - |
| 角丸 | 8, 10, 16 | px |
| padding | 16, 20 | px |
| gap | 10, 12 | px |
| 写真プレビュー | 100×100 | px |
| ボタン | paddingVertical 12, borderRadius 10 | px |

### 7.2 EditModal
| 要素 | 値 | 単位 |
|------|-----|------|
| シート | width 88%, maxWidth 340, maxHeight 85% | - |
| スクロール | maxHeight 320 | px |
| ステッパー | 44×44, borderRadius 22 | px |
| テキストエリア | minHeight 56 | px |
| 写真 | 120×120 | px |
| gap | 12, 20 | px |
| numberOfLines | 2 | メモ |

### 7.3 設定モーダル（modal.tsx）
| 要素 | 値 | 単位 |
|------|-----|------|
| 時刻入力 | 56×44, maxLength 2 | px / 文字 |
| padding | 8, 20 | px |
| borderRadius | 8, 10, 12 | px |
| saveBtn disabled | opacity 0.6 | - |
| placeholder | "9", "00" | - |

### 7.4 ホーム（home.tsx）
| 要素 | 値 | 単位 |
|------|-----|------|
| 空状態 | padding 32 | px |
| カード | borderRadius 10, marginVertical 3/6 | px |
| セクションヘッダー | paddingTop 10/16, paddingBottom 4/8 | px |
| ネイティブ/Web 分岐 | isNative で値変更 | - |
| フォント | 12–17, fontWeight 600/700 | px |

### 7.5 検索（search/index.tsx）
| 要素 | 値 | 単位 |
|------|-----|------|
| searchRow | paddingHorizontal 16, paddingVertical 10 | px |
| input | borderRadius 10, padding 14/10, fontSize 16 | px |
| categoryChip | padding 10/6, borderRadius 16, marginRight 6, marginBottom 6 | px |
| sectionHeader | padding 16/8 | px |
| sectionTitle | fontSize 13, opacity 0.8 | px |
| row | padding 16/14 | px |
| rowTitle | fontSize 16, marginBottom 2 | px |
| rowSub | fontSize 13, opacity 0.7 | - |
| borderBottomWidth | 1 | px |
| rgba | 0,0,0,0.06 / 0.08 / 0.1 / 0.05 | - |

### 7.6 食材詳細（[id].tsx）
| 要素 | 値 | 単位 |
|------|-----|------|
| content | padding 16, paddingBottom 32 | px |
| title | fontSize 22, marginBottom 16 | px |
| section | padding 14, borderRadius 10, marginBottom 12 | px |
| sectionTitle | fontSize 14, marginBottom 8, opacity 0.9 | px |
| body | fontSize 15, marginBottom 4, lineHeight 22 | px |
| purchaseBtn | paddingVertical 14, borderRadius 10, marginTop 8, marginBottom 16 | px |
| purchaseBtnText | fontSize 17 | px |
| disclaimer | padding 14, borderRadius 8, borderWidth 1 | px |
| disclaimerText | fontSize 13, marginBottom 6 | px |
| disclaimerEn | fontSize 12, opacity 0.85 | - |

### 7.7 購入画面（purchase.tsx）
| 要素 | 値 | 単位 | 備考 |
|------|-----|------|------|
| content padding | 14/20, paddingBottom 24/40 | px | ネイティブ/Web |
| footerFixed | gap 12, padding 14/20, paddingTop 12, paddingBottom 36/16 | px | - |
| title | fontSize 18/20, marginBottom 12/20 | px | - |
| label | fontSize 13/14, marginBottom 4/6, marginTop 10/16 | px | - |
| storageBtn | padding 6/8, 14, borderRadius 8 | px | - |
| stepperBtn | 36×36 / 40×40, borderRadius 18/20 | px | - |
| stepperText | fontSize 18/20 | px | - |
| stepperValue | fontSize 16/18, minWidth 48 | px | - |
| memoInput | minHeight 52/72 | px | - |
| numberOfLines | 3 | - | メモ |
| photoPreview | 96×96 / 120×120 | px | - |
| saveBtnDisabled | opacity 0.7 | - | - |

### 7.8 履歴（history.tsx）
| 要素 | 値 | 単位 |
|------|-----|------|
| empty | padding 32 | px |
| emptyText | fontSize 16, marginBottom 8 | px |
| emptySub | fontSize 14, opacity 0.8 | - |
| sectionHeader | paddingTop 16, paddingBottom 8, paddingHorizontal 16 | px |
| sectionTitle | fontSize 18 | px |
| card | marginHorizontal 16, marginVertical 6, padding 14, borderRadius 10 | px |
| foodName | fontSize 17, marginBottom 4 | px |
| storage | fontSize 13, opacity 0.8, marginBottom 4 | px |
| eatenDate | fontSize 14, opacity 0.9 | px |
| memoPhotoLink | marginTop 8, paddingVertical 6 | px |
| memoPhotoLinkText | fontSize 15 | px |

### 7.9 MemoPhotoModal
| 要素 | 値 | 単位 |
|------|-----|------|
| imageSize | min(width - 48, 320) | px |
| overlay | padding 24, rgba(0,0,0,0.5) | px / - |
| box | maxWidth 400, maxHeight 80%, borderRadius 12, padding 20 | px / % |
| title | fontSize 18, marginBottom 16 | px |
| scroll | maxHeight 400 | px |
| memoBlock | marginBottom 16 | px |
| memoLabel | fontSize 12, opacity 0.8, marginBottom 4 | px |
| memoText | fontSize 16, lineHeight 24, marginBottom 12 | px |
| photoBlock | marginVertical 8 | px |
| photo | borderRadius 8 | px |
| photoUnavailable | fontSize 14, marginVertical 16 | px |
| closeBtn | marginTop 16, paddingVertical 12, borderRadius 8 | px |
| closeBtnText | fontSize 16 | px |

### 7.10 タブレイアウト（_layout.tsx）
| 要素 | 値 | 単位 |
|------|-----|------|
| SettingsButton | padding 8, marginRight 8 | px |
| Ionicons size | 24 | px |
| tabBar | marginBottom 0, paddingRight 20 | px |

---

## 8. カラー（hex / rgba）

### 8.1 アプリ共通
| 用途 | Light | Dark |
|------|-------|------|
| tint | #2f95dc | #fff |
| tabIconDefault | #ccc | #ccc |
| text | #000 | #fff |
| background | #fff | #000 |

### 8.2 画面上の指定色
| 色 | 用途 |
|-----|------|
| #2f95dc | プライマリ（ボタン、リンク、選択） |
| #E6F4FE | スプラッシュ背景（app.json） |
| #ffffff | スプラッシュ背景 |
| #1c1c1e | モーダル暗色 |
| #333, #222, #1e1e1e, #1a1a1a, #2a2a2a | 暗色背景 |
| #f5f5f5, #f8f8f8, #f0f0f0, #eee | 明色背景 |
| #ddd | ボーダー |
| #888, #999 | placeholder |
| #c00 | 警告・期限切れ |
| #fff8e1 | 免責（ライト） |
| #3a3520 | 免責（ダーク） |
| rgba(0,0,0,0.04–0.1) | オーバーレイ・ボーダー |
| rgba(0,0,0,0.5) | MemoPhotoModal オーバーレイ |

---

## 9. データ・識別子

### 9.1 マスタ
| 項目 | 値 |
|------|-----|
| 食材数 | 250 |
| カテゴリ数 | 8 |
| 保存場所 | 3 (fridge, freezer, room) |
| 食材 ID エイリアス | f83→f5, f84→f29 |

### 9.2 購入 ID
- 形式: `p-{Date.now()}-{random 9文字}`  
  - random: `Math.random().toString(36).slice(2, 11)`

### 9.3 通知 identifier
- UUID v4

---

## 10. アプリ設定（app.json / package.json）

| 項目 | 値 |
|------|-----|
| version | 1.0.0 |
| orientation | portrait |
| notification icon color | #2f95dc |
| adaptiveIcon backgroundColor | #E6F4FE |
| splash backgroundColor | #ffffff |
| predictiveBackGestureEnabled | false |

---

## 11. その他ロジック上の数値

| 項目 | 値 | 場所 |
|------|-----|------|
| status === 'granted' | 通知権限 | notifications |
| Platform.OS 分岐 | 'ios' / 'android' / 'web' | 各所 |
| getMonth() + 1 | 月表示（JS は 0–11） | formatNotifyDate, formatDate |
| padStart(2, '0') | 日付ゼロ埋め | 同上 |
| borderWidth | 1 | 多数 |
| flex: 1 | レイアウト | 多数 |
| fontWeight | 500, 600, 700 | フォント |
| opacity | 0.6–0.9 | 表示 |

---

## 12. 一覧表（カテゴリ別）

| カテゴリ | 主な数値 |
|----------|----------|
| 通知 | 9:00 デフォルト, 2 種類, [0,250,250,250] ms |
| 日数 | DAY=86400000, notifyDays 1–999, フォールバック 1/30/3 |
| セクション | today≤1, soon 2–6, later 7+ |
| 遅延 | 100 ms, 150 ms |
| 画像 | quality 0.8 |
| データ | 食材 250, カテゴリ 8, 保存 3 |
| フォント | 12–22 px |
| 余白・サイズ | 4–400 px, パーセント, gap 6–20 |
| カラー | #2f95dc メイン, #E6F4FE スプラッシュ など |
| バージョン | 1.0.0 |
