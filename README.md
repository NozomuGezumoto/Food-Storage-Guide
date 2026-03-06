# Food Storage Guide（保存目安＋通知はユーザー調整）MVP

食材ごとの保存方法・保存期間の**目安**を表示し、購入登録と通知（前日/当日）で期限を管理するアプリです。  
保存期間は「目安」であり、安全保証ではありません。

## 技術スタック

- **Expo** (React Native) + **expo-router**
- **Zustand** + **AsyncStorage**（ローカル完結・サーバー不要）
- **expo-notifications**（前日・当日通知）
- **expo-image-picker**（写真は任意）

## 画面構成

| 画面 | 説明 |
|------|------|
| **一覧 (Home)** | 登録した購入一覧。残り日数、調整・食べた（一覧から外す） |
| **検索 (Search)** | 食材検索 → タップで詳細へ |
| **FoodDetail** | 保存方法・保存目安レンジ・保存のポイント・「購入」ボタン |
| **PurchaseModal** | 保存場所 / 通知日数（初期値あり） / 前日・当日通知 / 写真・地域（任意） |
| **EditModal** | 通知日数のみ変更 |

## 使い方

1. **検索**タブで食材を検索し、タップして詳細を表示。
2. 詳細で保存目安（レンジ）とポイントを確認し、**購入**をタップ。
3. モーダルで保存場所・通知日数（±で変更可）・前日/当日通知を設定し**保存**。
4. **一覧**タブで「あとX日」を確認。**調整**で編集、**食べた**で一覧から外す。

## 通知

- 初回「購入」保存時に通知権限を要求（拒否しても購入保存は可能）。
- **前日通知**: 通知日の前日 24h 前に「明日まで：{食材名}（冷蔵/冷凍/常温）」。
- **当日通知**: 通知日に「今日まで：{食材名}（冷蔵/冷凍/常温）」。
- 編集で通知日数を変えると、既存通知をキャンセルして再スケジュール。

## 免責文言

詳細画面下部に固定で表示：

- **保存期間は目安です。保存環境や鮮度により変わります。**
- *Storage time is a guideline and may vary depending on freshness and conditions.*

## 開発

```bash
npm install
npx expo start
```

- **w**: Web
- **a**: Android エミュレータ
- **i**: iOS シミュレータ（要 macOS）

### 携帯（実機）でテストする

1. **Expo Go をインストール**
   - [Android: Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS: App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **PC で開発サーバーを起動**
   ```bash
   npx expo start
   ```
   ターミナルに QR コードが表示されます。

3. **同じ Wi‑Fi に接続**
   - PC とスマートフォンを**同じ Wi‑Fi** に接続します。

4. **QR コードで開く**
   - **Android**: Expo Go アプリを起動 → 「Scan QR code」で表示された QR をスキャン
   - **iOS**: 標準のカメラアプリで QR をスキャン → 表示される「Expo Go で開く」をタップ

5. **同じネットワークでつながらない場合**
   ```bash
   npx expo start --tunnel
   ```
   `--tunnel` を使うとインターネット経由で接続できます（別ネットワークや外出先からも可）。  
   **注意**: `expo start --tunnel` 実行時に `TypeError: Cannot read properties of undefined (reading 'body')` や Ngrok 関連のエラーが出ることがあります。その場合は以下を試してください。
   - **まず LAN で試す**: `npx expo start` または `npm run start:lan` で起動し、PC とスマホを同じ Wi‑Fi にしてください。
   - **キャッシュを消して起動**: `npm run start:clear`
   - トンネルがどうしても必要なとき: [Ngrok status](https://status.ngrok.com/) で障害がないか確認し、`npm install` や `@expo/ngrok` の再インストールを試す。

6. **「Project is incompatible with this version of Expo Go」と出る場合**
   - このプロジェクトは **Expo SDK 55** です。ストアの Expo Go はまだ **SDK 54** のことがあり、その場合はこのメッセージが出ます。
   - **iOS**: [TestFlight の Expo Go（SDK 55 用）](https://testflight.apple.com/join/GZJxxfUU) をインストールすると、SDK 55 のプロジェクトを開けます。
   - **Android**: [Expo の案内（expo.dev/go）](https://expo.dev/go) で、SDK 55 対応の Expo Go の入手方法を確認してください。
   - いずれも難しい場合は、[EAS Build](https://docs.expo.dev/build/introduction/) でこのアプリの開発用ビルドを作成すると、Expo Go なしで実機で試せます。

## データ

- **FoodMaster**: `data/foods.ts` にモック 50 件（後で差し替え可能）。
- **PurchaseItem**: Zustand + AsyncStorage で永続化。`store/usePurchasesStore.ts`。

## 後回し（MVP では未実装）

- バーコード・レシピ提案・在庫数量・GPS 自動地域判定・Settings 画面（通知デフォルト設定）。
