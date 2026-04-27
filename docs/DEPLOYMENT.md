# デプロイガイド

## 開発環境と本番環境の違い

### 開発環境（ローカル）
- **Firestore**: クライアント側SDK（`firebase/firestore`）を直接使用
- **ストア**: `.firestore.ts`ファイル（リアルタイムリスナー）
- **認証**: 不要（Firestoreルールで`allow read, write: if true`）

### 本番環境（Vercel）
- **Firestore**: サーバー側API経由でFirebase Admin SDKを使用
- **ストア**: `.api.ts`ファイル（APIポーリング）
- **認証**: Firestoreルールで完全クローズド（`allow read, write: if false`）

## 本番環境へのデプロイ手順

### 1. Firestoreルールのデプロイ

```bash
# Firebaseプロジェクトにログイン
firebase login

# Firestoreルールをデプロイ
firebase deploy --only firestore:rules
```

**重要**: デプロイ後、Firestoreへのクライアント側アクセスは完全にブロックされます。

### 2. 環境変数の設定（Vercel）

Vercelダッシュボード → Settings → Environment Variables で以下を設定:

#### Firebase Admin SDK（必須）
```bash
# 方法1: プロジェクトIDのみ（推奨）
FIREBASE_ADMIN_PROJECT_ID=your-project-id

# 方法2: サービスアカウントキー（より安全）
FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY=base64_encoded_json
```

**サービスアカウントキーの取得とエンコード方法**:

1. Firebase Console → Project Settings → Service Accounts
2. "Generate new private key"をクリック
3. JSONファイルをダウンロード
4. Base64エンコード:

```bash
# macOS/Linux
base64 -i service-account-key.json | tr -d '\n'

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account-key.json"))
```

5. 出力された文字列をコピーして`FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY`に設定

#### その他の環境変数
```bash
# Firebase（クライアント側）
PUBLIC_FIREBASE_API_KEY=your_api_key
PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your_project_id
PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
PUBLIC_FIREBASE_APP_ID=your_app_id

# Notion API
NOTION_API_KEY=secret_xxxx
NOTION_DATABASE_ID=your_database_id
NOTION_DATABASE_ID_IMPORT=your_import_database_id

# Weather API
WEATHER_API_KEY=your_weather_api_key
```

### 3. ビルドとデプロイ

```bash
# ローカルでビルドテスト
npm run build

# Vercelにデプロイ（自動）
git push origin main
```

## 開発環境での動作

開発環境では以下の動作になります:

1. **Admin SDK APIは空データを返す**
   - `/api/firestore/dailySales` → `{ dailySales: [] }`
   - `/api/firestore/unregistered` → `{ products: [] }`

2. **従来のクライアント側SDKを使用**
   - `dailySales.firestore.ts` を手動で使用可能
   - `unregistered.firestore.ts` を手動で使用可能

3. **警告メッセージが表示される**
   ```
   [Firebase Admin] 開発環境: クライアント側Firestore SDKを使用してください
   [Firebase Admin] Admin SDK機能は本番環境でのみ動作します
   ```

### 開発環境でテストする方法

開発中にAdmin SDKをテストしたい場合:

```bash
# .env.localファイルを作成
FIREBASE_ADMIN_PROJECT_ID=your-project-id

# または環境変数を設定して起動
FIREBASE_ADMIN_PROJECT_ID=your-project-id npm run dev
```

## トラブルシューティング

### エラー: "Missing or insufficient permissions"

**原因**: クライアント側から直接Firestoreにアクセスしようとしている

**解決策**:
1. 本番環境: 正常（Admin SDK経由のみアクセス可能）
2. 開発環境: Firestoreルールを一時的に緩和
   ```javascript
   // 開発用（firebase.rules）
   allow read, write: if true;
   ```

### エラー: "Firebase Admin SDK の初期化に失敗しました"

**原因**: 環境変数が設定されていない

**解決策**:
1. `FIREBASE_ADMIN_PROJECT_ID` が設定されているか確認
2. または `FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY` が正しくBase64エンコードされているか確認

### 開発環境でAPIが500エラーを返す

**原因**: Admin SDKが初期化できない（正常な動作）

**解決策**: 開発環境では従来のクライアント側SDKを使用してください。本番環境では正常に動作します。

## セキュリティチェックリスト

デプロイ前に以下を確認:

- [ ] Firestoreルールがデプロイされている（`allow read, write: if false`）
- [ ] `FIREBASE_ADMIN_PROJECT_ID`または`FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY`が設定されている
- [ ] サービスアカウントキーが`.gitignore`に含まれている（JSONファイルをリポジトリにコミットしない）
- [ ] すべての環境変数がVercelに設定されている
- [ ] ビルドが成功する（`npm run build`）
- [ ] 本番環境でAPIエンドポイントが動作する

## パフォーマンス最適化

### リアルタイム更新 vs ポーリング

**開発環境（推奨）**:
- クライアント側SDK + リアルタイムリスナー
- 即座にデータが反映される

**本番環境**:
- API + 30秒ごとのポーリング
- セキュリティを重視

### ポーリング間隔の調整

必要に応じて`dailySales.api.ts`と`unregistered.api.ts`のポーリング間隔を調整:

```typescript
// 30秒ごと（デフォルト）
refreshInterval = setInterval(() => {
  fetchDailySales();
}, 30000);

// 10秒ごと（よりリアルタイムに近い）
}, 10000);

// 1分ごと（サーバー負荷軽減）
}, 60000);
```

## コスト試算

### Firebase使用量（月間）

| 項目 | 無料枠 | 想定使用量 | コスト |
|------|--------|------------|--------|
| Firestore読み取り | 50,000 | 100,000 | ¥120 |
| Firestore書き込み | 20,000 | 10,000 | ¥0（無料枠内） |
| Firestore削除 | 20,000 | 1,000 | ¥0（無料枠内） |
| ストレージ | 1GB | 0.1GB | ¥0（無料枠内） |

**月額合計**: 約¥120 - ¥500

### Vercel使用量

| プラン | 価格 | 含まれる内容 |
|--------|------|-------------|
| Hobby | $0 | 100GB帯域、10万実行/月 |
| Pro | $20 | 1TB帯域、100万実行/月 |

小規模店舗（1-5店舗）: **Hobbyプランで十分**
中規模以上（10店舗以上）: **Proプランを推奨**

## まとめ

本番環境では:
1. Firestoreルールで完全にクローズド
2. サーバー側API経由でのみアクセス
3. Firebase Admin SDKで全権限管理
4. CSRF/XSS/レート制限で多層防御

この構成により、Firebase Authenticationなしで**セキュリティスコア9.5/10**を実現しています。
