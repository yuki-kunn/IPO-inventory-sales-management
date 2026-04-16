# トラブルシューティング

## 未登録商品が表示されない場合

### 1. ブラウザのコンソールログを確認

1. ブラウザで開発者ツールを開く（F12キー）
2. 「Console」タブを選択
3. 売上CSVをアップロード後、以下のログを確認:

```
[processSalesData] 処理開始: { salesDataCount: X, recipesCount: Y }
[processSalesData] 商品: xxx レシピ: 未登録
[UnregisteredProducts] addOrUpdate: xxx 1
[UnregisteredProducts] 新規商品を追加: xxx
[processSalesData] 処理完了: { totalProcessed: X, totalUnregistered: Y }
```

### 2. Firebase設定を確認

#### .envファイルが正しく設定されているか確認

```bash
# .envファイルの存在確認
ls -la .env

# .envファイルの内容を確認（キーは隠す）
cat .env | sed 's/=.*/=***/'
```

必要な環境変数:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

#### ブラウザコンソールでFirebase接続を確認

```javascript
// ブラウザのコンソールで実行
console.log('Firebase Config:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '設定済み' : '未設定',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
});
```

### 3. Firestoreのセキュリティルールを確認

Firebase Console → Firestore Database → ルール を開いて、以下のルールが設定されているか確認:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /unregisteredProducts/{productName} {
      allow read, write: if true;
    }
  }
}
```

### 4. Firestoreのデータを直接確認

1. Firebase Console → Firestore Database → データ を開く
2. `unregisteredProducts` コレクションが存在するか確認
3. 商品名のドキュメントが作成されているか確認

### 5. ネットワークタブでリクエストを確認

1. ブラウザの開発者ツール → Network タブ
2. CSVアップロード後、Firestoreへのリクエストを確認
3. エラーレスポンス（401, 403など）がないか確認

## よくあるエラーと解決方法

### エラー: "Firebase: Error (auth/invalid-api-key)"

**原因**: Firebase API Keyが正しくない

**解決方法**:
1. Firebase Console → プロジェクト設定 → 全般
2. 「マイアプリ」セクションでウェブアプリの設定を確認
3. `.env`ファイルのAPIキーを更新
4. アプリを再起動: `npm run dev`

### エラー: "Missing or insufficient permissions"

**原因**: Firestoreのセキュリティルールが厳しすぎる

**解決方法**:
1. Firebase Console → Firestore Database → ルール
2. 開発中は全てのアクセスを許可:
```
allow read, write: if true;
```
3. 「公開」をクリック

### データが同期されない

**原因**: リスナーが初期化されていない

**解決方法**:
1. ページを完全にリロード（Ctrl+Shift+R）
2. ブラウザのキャッシュをクリア
3. コンソールログで `[UnregisteredProducts] リスナーを初期化中...` が表示されるか確認

### CSVアップロード後、何も起こらない

**原因**:
- CSVファイルの形式が間違っている
- 全ての商品がカテゴリ（「男性」「女性」）として無視されている
- 全ての商品にレシピが登録されている

**解決方法**:
1. コンソールログを確認
2. CSVファイルの内容を確認:
   - 商品名が正しく読み込まれているか
   - カテゴリでない実際の商品が含まれているか
3. レシピ管理ページで登録済みの商品を確認

## デバッグモードの有効化

より詳細なログを確認するには、以下の手順でデバッグモードを有効化:

1. `src/lib/firebase.ts` を開く
2. Firebaseの初期化後に以下を追加:
```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';

// デバッグログを有効化
if (browser) {
  window.FIRESTORE_DEBUG = true;
  enableIndexedDbPersistence(db).catch((err) => {
    console.error('Persistence error:', err);
  });
}
```

## サポート

問題が解決しない場合は、以下の情報を添えてお問い合わせください:

1. ブラウザのコンソールログ全体
2. Firebaseプロジェクトの設定（API Keyは含めない）
3. 再現手順
4. 使用しているブラウザとバージョン
