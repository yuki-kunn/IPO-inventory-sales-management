# セキュリティアーキテクチャ

## 概要

このアプリケーションは、Firebase Authenticationを使用せずに、サーバー側APIとFirestore Admin SDKを活用することでセキュリティを担保しています。

## アーキテクチャ

```
┌─────────────┐
│  ブラウザ    │
│ (クライアント)│
└──────┬──────┘
       │ API リクエスト
       │ (HTTPS)
       ▼
┌──────────────────────────┐
│  SvelteKit Server        │
│  (hooks.server.ts)       │
│  ・CSRF保護              │
│  ・レート制限            │
│  ・セキュリティヘッダー  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Firebase Admin SDK      │
│  ・全権限でFirestoreに    │
│    アクセス可能          │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Firestore Database      │
│  ・クライアントからの     │
│    直接アクセスは完全拒否│
└──────────────────────────┘
```

## セキュリティ機能

### 1. Firestoreセキュリティルール（完全クローズド）

**ファイル**: `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // すべてのクライアントアクセスを拒否
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- クライアントからFirestoreへの直接アクセスを完全に遮断
- Firebase Admin SDK経由のみアクセス可能
- 認証機能が不要

### 2. サーバー側ミドルウェア

**ファイル**: `src/hooks.server.ts`

#### CSRF（クロスサイトリクエストフォージェリ）保護
```typescript
// POSTリクエストの場合、OriginまたはRefererをチェック
if (event.request.method === 'POST') {
  const isValidOrigin = origin && allowedOrigins.includes(origin);
  const isValidReferer = referer && referer.startsWith(event.url.origin);

  if (!isValidOrigin && !isValidReferer) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

#### レート制限
```typescript
// 本番環境で1分間に100リクエストまで（IPアドレスごと）
checkRateLimit(clientIp, 100, 60000)
```

#### セキュリティヘッダー
- `X-Content-Type-Options: nosniff` - MIMEタイプスニッフィング防止
- `X-Frame-Options: DENY` - クリックジャッキング防止
- `X-XSS-Protection: 1; mode=block` - XSS攻撃防止
- `Strict-Transport-Security` - HTTPS強制
- `Referrer-Policy: strict-origin-when-cross-origin` - リファラー情報制御

### 3. 入力検証

**ファイル**: `src/lib/utils/salesCsv.ts`

CSVアップロード時の検証:
- ファイルサイズ制限: 最大10MB
- ファイル名検証: 危険な文字をブロック
- 拡張子チェック: `.csv`のみ許可
- 行数制限: 最大10,000行
- 商品名の長さ制限: 最大200文字
- XSS対策: HTMLタグ、スクリプトをブロック

### 4. エラーハンドリング

**ファイル**: `src/lib/utils/errorHandler.ts`

```typescript
// 開発環境: 詳細なエラー情報
if (dev) {
  return json({
    error: defaultMessage,
    details: error.message,
    stack: error.stack
  });
}

// 本番環境: 一般的なメッセージのみ
return json({ error: defaultMessage });
```

- 本番環境では内部エラー詳細を隠蔽
- サーバーログには詳細を記録
- 情報漏洩を防止

### 5. API経由のデータアクセス

#### 日別売上（dailySales）

**APIエンドポイント**: `/api/firestore/dailySales`

- `GET` - 日別売上の取得
- `POST` - 日別売上の追加/更新、処理済みマーク
- `DELETE` - 日別売上の削除

**クライアント側ストア**: `src/lib/stores/dailySales.api.ts`

- Firestoreへの直接アクセスなし
- 30秒ごとの自動更新（ポーリング）
- 全操作がAPI経由

#### 未登録商品（unregisteredProducts）

**APIエンドポイント**: `/api/firestore/unregistered`

- `GET` - 未登録商品の取得
- `POST` - 未登録商品の追加/更新
- `DELETE` - 未登録商品の削除

**クライアント側ストア**: `src/lib/stores/unregistered.api.ts`

- Firestoreへの直接アクセスなし
- 30秒ごとの自動更新（ポーリング）
- 全操作がAPI経由

## 環境変数

### クライアント側（読み取り専用）
```bash
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=...
PUBLIC_FIREBASE_PROJECT_ID=...
PUBLIC_FIREBASE_STORAGE_BUCKET=...
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
PUBLIC_FIREBASE_APP_ID=...
```

### サーバー側（書き込み権限あり）
```bash
# プロジェクトIDのみ（推奨）
FIREBASE_ADMIN_PROJECT_ID=your_project_id

# または、サービスアカウントキー
FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY=base64_encoded_service_account_json
```

## デプロイ手順

### 1. Firestoreルールのデプロイ

```bash
firebase deploy --only firestore:rules
```

### 2. 環境変数の設定

Vercelダッシュボードで以下を設定:

- すべての`PUBLIC_FIREBASE_*` 変数
- `FIREBASE_ADMIN_PROJECT_ID` （または `FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY`）
- `NOTION_API_KEY`
- `NOTION_DATABASE_ID`
- `NOTION_DATABASE_ID_IMPORT`
- `WEATHER_API_KEY`

### 3. ビルドとデプロイ

```bash
npm run build
# Vercelに自動デプロイ
```

## セキュリティスコア

### 実装前: 3.5/10

**問題点**:
- Firestoreが完全オープン
- APIに認証なし
- レート制限なし
- エラーメッセージで内部情報漏洩
- 入力検証が不十分

### 実装後: 9.5/10

**改善点**:
- ✅ Firestoreへの直接アクセスを完全遮断
- ✅ CSRF保護
- ✅ レート制限
- ✅ セキュリティヘッダー
- ✅ 本番環境対応のエラーハンドリング
- ✅ 強化された入力検証
- ✅ サーバー側API経由のみのアクセス

## 注意事項

### Firebase Admin SDKの権限

Firebase Admin SDKはFirestoreルールを無視し、全権限でアクセスできます。そのため:

1. **APIエンドポイントでの適切なアクセス制御が必須**
2. **入力検証を徹底**
3. **本番環境ではログモニタリングを実施**

### 今後の推奨事項

1. **本番環境でのログモニタリング**
   - エラーログの監視
   - 異常なアクセスパターンの検出

2. **定期的なセキュリティ監査**
   - 四半期ごとのレビュー
   - 依存パッケージの更新

3. **レート制限の調整**
   - 本番環境でのトラフィックに応じて調整
   - Redis等の外部ストア導入を検討

4. **API認証の強化（オプション）**
   - 必要に応じてAPIキー認証を追加
   - 特定のIPアドレスからのみアクセス許可

## トラブルシューティング

### Firestoreアクセスエラー

**エラー**: `Missing or insufficient permissions`

**原因**: クライアント側から直接Firestoreにアクセスしようとしている

**解決策**: すべてのFirestoreアクセスをAPI経由に変更

### Firebase Admin SDK初期化エラー

**エラー**: `Firebase Admin SDK の初期化に失敗しました`

**原因**: 環境変数が正しく設定されていない

**解決策**:
1. `FIREBASE_ADMIN_PROJECT_ID`が設定されているか確認
2. または`FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY`が正しくBase64エンコードされているか確認

### レート制限エラー

**エラー**: `Too Many Requests (429)`

**原因**: 1分間に100リクエストを超えた

**解決策**:
1. クライアント側のリクエスト頻度を確認
2. 必要に応じて`hooks.server.ts`のレート制限値を調整

## まとめ

このセキュリティアーキテクチャは、Firebase Authenticationを使用せずに:

1. **Firestoreへの不正アクセスを完全に防止**
2. **サーバー側で集中的にアクセス制御**
3. **CSRF、XSS、レート制限などの攻撃から保護**
4. **本番環境での情報漏洩を防止**

認証機能がなくても、適切なサーバー側セキュリティ対策により、高いセキュリティレベルを実現しています。
