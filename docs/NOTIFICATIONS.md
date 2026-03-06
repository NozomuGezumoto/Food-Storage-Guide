# 通知の仕様

## 重要: 予約方式であること

この通知は**「毎日残り日数を判定する方式」**ではなく、  
**「購入日を基準に期限日を計算し、前日通知と当日通知を1回ずつ予約する方式」**です。

---

## 正しい計算

```
deadlineDate = startOfDayLocal(addDays(purchasedAt, notifyDays))
```

**前日通知のトリガー日時:**

```
beforeDate = setTimeOnDate(addDays(deadlineDate, -1), notificationHour, notificationMinute)
```

**当日通知のトリガー日時:**

```
sameDayDate = setTimeOnDate(deadlineDate, notificationHour, notificationMinute)
```

- `purchasedAt`: 購入登録日時（ミリ秒）
- `notifyDays`: 登録から何日後を期限にするか
- `notificationHour`, `notificationMinute`: 設定画面でユーザーが指定した時刻

---

## 予約条件

- **通知許可がない場合** → 予約しない（リスト追加時は許可チェックのみ。設定保存時に許可取得。）
- **食べたアイテム** → 予約しない（一覧から外したものは reschedule の対象外）
- **deadlineDate が today の startOfDay より前** → 予約しない（期限切れ）
- **triggerDate が now より前** → そのトリガーは予約しない（過去は予約しない）

---

## 再予約ルール

| きっかけ | 動作 |
|----------|------|
| **アイテム追加時** | そのアイテムの前日・当日を予約（許可がある場合のみ） |
| **notifyDays 変更時** | そのアイテムの既存通知のみキャンセルし、再計算して再予約 |
| **通知時刻変更時** | 全通知をキャンセルし、未食べた全アイテムを新しい時刻で再予約 |
| **起動時**（ストア復元後） | 全通知をキャンセルし、未食べた全アイテムを再予約 |
| **食べた / 削除時** | そのアイテムの通知のみキャンセル |

---

## 禁止事項

- 毎日残り日数を判定して通知する実装にしない
- 即時通知や数秒後通知を混ぜない
- 既存通知を消さずに重複予約しない（必ずキャンセルしてから再予約）

---

## ログ（計算結果の確認）

各予約処理で `[Notification]` プレフィックス付きの `console.log` を出力する。

**出力項目:**  
`itemId`, `purchasedAt`, `notifyDays`, `deadlineDate`, `beforeDate`, `sameDayDate`, `skipped` または `scheduled`

- 予約した場合: `scheduled: 'dayBefore'` / `scheduled: 'onDay'`
- スキップした場合: `skipped: 'deadlineDate < today startOfDay'` / `skipped: 'beforeDate <= now (past)'` / `skipped: 'sameDayDate <= now (past)'` など

これにより、計算結果が仕様通りかログで確認できる。

---

## 注意（Expo Go / 開発ビルド）

- **Expo Go** では、バックグラウンドや終了時にスケジュール通知が届かない・不安定な場合があります。
- 設定した時刻に確実に試したい場合は **開発ビルド**（`npx expo run:ios` / `npx expo run:android`）での確認を推奨します。
