# アーキテクチャドキュメント

## プロジェクト構成

### ディレクトリ構造

```
src/
├── lib/
│   ├── components/         # UIコンポーネント
│   │   ├── ui/            # 基本UIコンポーネント（6個）
│   │   ├── AddIngredientModal.svelte
│   │   ├── EditIngredientModal.svelte
│   │   ├── IngredientsTable.svelte
│   │   ├── Navigation.svelte
│   │   ├── PeriodSelector.svelte
│   │   ├── SalesTable.svelte
│   │   ├── SalesUploader.svelte
│   │   ├── StatsCard.svelte
│   │   ├── WeatherFilterButtons.svelte
│   │   ├── WeatherIcon.svelte
│   │   └── WeatherSelector.svelte
│   ├── stores/            # 状態管理（Svelte Stores）
│   │   ├── auth.ts        # 認証状態
│   │   ├── darkMode.ts    # ダークモード
│   │   ├── dailySales.api.ts        # 日別売上（API経由）
│   │   ├── ingredients.firestore.ts # 原材料（Firestore直接）
│   │   ├── recipes.firestore.ts     # レシピ（Firestore直接）
│   │   └── unregistered.api.ts      # 未登録商品（API経由）
│   ├── utils/             # ユーティリティ関数
│   │   ├── cleanupLocalStorage.ts
│   │   ├── errorHandler.ts
│   │   ├── forecastUtils.ts
│   │   ├── formatters.ts
│   │   ├── salesCsv.ts
│   │   ├── salesProcessor.ts
│   │   ├── stockStatus.ts
│   │   ├── weatherFormatter.ts
│   │   └── weatherService.ts
│   ├── services/          # ビジネスロジック
│   │   └── forecastService.ts
│   ├── server/            # サーバーサイド
│   │   └── firebase-admin.ts
│   ├── firebase.ts        # Firebaseクライアント初期化
│   └── types.ts           # 型定義
├── routes/                # ページ
│   ├── +page.svelte              # ホーム
│   ├── +layout.svelte            # レイアウト
│   ├── analytics/+page.svelte    # 売上分析
│   ├── calendar/                 # カレンダー
│   │   ├── +page.svelte
│   │   └── [date]/+page.svelte
│   ├── forecast/+page.svelte     # 在庫予測
│   ├── ingredients/+page.svelte  # 原材料管理
│   ├── login/+page.svelte        # ログイン
│   ├── recipes/+page.svelte      # レシピ管理
│   ├── unregistered/+page.svelte # 未登録商品
│   └── api/                      # APIエンドポイント
│       ├── firestore/
│       │   ├── dailySales/+server.ts
│       │   └── unregistered/+server.ts
│       ├── notion/
│       │   ├── ingredients/+server.ts
│       │   ├── ingredients-import/+server.ts
│       │   └── recipes/+server.ts
│       └── weather/+server.ts
├── hooks.server.ts        # サーバーフック（セキュリティ）
└── app.css               # グローバルCSS
```

## データフロー

### クライアントサイド（開発環境）

```
Svelteコンポーネント
    ↓
Firestoreストア（直接アクセス）
    ↓
Firebase SDK
    ↓
Firestore
```

### サーバーサイド（本番環境）

```
Svelteコンポーネント
    ↓
APIストア（API経由）
    ↓
SvelteKit APIエンドポイント
    ↓
Firebase Admin SDK
    ↓
Firestore
```

## 状態管理

### ストアの種類

#### 1. API経由ストア（本番推奨）
- `dailySales.api.ts` - 日別売上データ
- `unregistered.api.ts` - 未登録商品

**特徴:**
- サーバーサイドAPIを経由してデータアクセス
- セキュリティルールを回避（Admin SDK使用）
- 本番環境で使用

#### 2. Firestoreストア（開発用）
- `ingredients.firestore.ts` - 原材料
- `recipes.firestore.ts` - レシピ

**特徴:**
- クライアントから直接Firestoreにアクセス
- 開発環境で高速
- Firestoreセキュリティルールが必要

#### 3. ローカルストア
- `auth.ts` - 認証状態（localStorage）
- `darkMode.ts` - ダークモード設定（localStorage）

## セキュリティアーキテクチャ

### 本番環境
1. **Firestore完全ロックダウン**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

2. **サーバーサイドAPI経由でのみアクセス**
   - Firebase Admin SDK使用
   - CSRF保護
   - レート制限

3. **セキュリティヘッダー**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Strict-Transport-Security`

### 開発環境
- クライアントSDK使用
- Firestoreルールで制御

## コンポーネント設計原則

### 単一責任の原則
各コンポーネントは1つの責任のみを持つ：

- **モーダル系**: 特定のCRUD操作のみ
- **テーブル系**: データ表示とソートのみ
- **UI系**: 見た目とイベント発火のみ

### コンポーネント命名規則

- **Modal**: `Add*Modal`, `Edit*Modal` - データ入力
- **Table**: `*Table` - データ一覧表示
- **Selector**: `*Selector` - 選択UI
- **Card**: `*Card` - 情報表示カード

## API設計

### RESTful原則

```
GET    /api/firestore/dailySales        - 一覧取得
GET    /api/firestore/dailySales?date=  - 個別取得
POST   /api/firestore/dailySales        - 作成・更新
DELETE /api/firestore/dailySales?date=  - 削除
```

### アクションベース

```
POST /api/firestore/dailySales
{
  "action": "addOrUpdate" | "markAsProcessed",
  ...
}
```

## パフォーマンス最適化

### CSV処理高速化
1. **正規表現事前コンパイル** - 20-30%高速化
2. **Set使用** - O(n) → O(1)検索
3. **ID生成軽量化** - UUIDの10倍高速
4. **早期リターン** - 不要な処理削減

### リアルタイム更新
- Svelteの`$state`による自動再レンダリング
- Firestoreリアルタイムリスナー（開発環境）

## エラーハンドリング

### 統一エラーレスポンス

```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    field?: string
  }
}
```

### エラー処理パターン

```typescript
try {
  // 処理
} catch (error) {
  return createErrorResponse(error, 'エラーメッセージ', statusCode);
}
```

## 今後の拡張ポイント

### 推奨される追加機能
1. **ユーザー管理** - Firebase Authentication統合
2. **マルチテナント** - 店舗ごとのデータ分離
3. **リアルタイム通知** - 在庫切れアラート
4. **モバイルアプリ** - Capacitor/Ionic統合

### アーキテクチャ改善候補
1. **GraphQL導入** - 柔軟なデータ取得
2. **WebSocket** - リアルタイム同期強化
3. **オフライン対応** - Service Worker + IndexedDB
4. **マイクロサービス化** - 機能別API分離

## 保守のベストプラクティス

### コードスタイル
- TypeScript strict mode有効
- Prettier + ESLint使用
- コンポーネントは300行以内を目標

### テスト戦略
- ユーティリティ関数は単体テスト必須
- E2Eテスト: Playwright推奨
- APIエンドポイント: 統合テスト

### ドキュメント
- 複雑なロジックには必ずコメント
- 型定義は自己文書化
- READMEは常に最新に保つ

## バージョン管理

### ブランチ戦略
- `main` - 本番環境
- `develop` - 開発環境
- `feature/*` - 機能開発
- `hotfix/*` - 緊急修正

### リリースフロー
1. `feature/*` → `develop` へPR
2. `develop` → `main` へPR（リリース時）
3. デプロイ前にビルド確認必須

---

**最終更新**: 2026-04-27
**バージョン**: 1.0.0
