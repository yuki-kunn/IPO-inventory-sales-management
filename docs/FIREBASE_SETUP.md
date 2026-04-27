# Firebase セットアップガイド

## 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `airregi-inventory`）
4. Google Analyticsは任意で有効化
5. プロジェクトを作成

## 2. Firestoreデータベースの作成

1. Firebase Consoleで「Firestore Database」を選択
2. 「データベースを作成」をクリック
3. ロケーション: `asia-northeast1 (Tokyo)` を選択
4. 本番環境モードで開始（セキュリティルールは後で設定）

## 3. Webアプリの追加

1. プロジェクト設定（歯車アイコン）をクリック
2. 「マイアプリ」セクションで「ウェブ」アイコンをクリック
3. アプリのニックネームを入力
4. Firebase Hostingは不要なのでスキップ
5. 表示される設定情報をコピー

## 4. 環境変数の設定

1. プロジェクトルートに `.env` ファイルを作成:

\`\`\`bash
cp .env.example .env
\`\`\`

2. `.env` ファイルに Firebase の設定情報を入力:

\`\`\`
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
\`\`\`

## 5. Firestoreセキュリティルール

Firebase Consoleで「Firestore Database」→「ルール」タブを選択し、以下のルールを設定:

\`\`\`
rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
// 原材料コレクション
match /ingredients/{ingredientId} {
allow read, write: if true; // 開発中は全て許可
}

    // レシピコレクション
    match /recipes/{recipeId} {
      allow read, write: if true;
    }

    // 未登録商品コレクション
    match /unregisteredProducts/{productName} {
      allow read, write: if true;
    }

    // 売上データコレクション
    match /sales/{saleId} {
      allow read, write: if true;
    }

}
}
\`\`\`

**注意**: 本番環境では適切な認証ルールを設定してください。

## 6. Firestoreインデックスの作成

必要に応じて以下のインデックスを作成:

1. Firebase Console → Firestore Database → インデックス
2. 複合インデックスを追加:
   - **ingredients**: `createdAt` (降順)
   - **recipes**: `createdAt` (降順)
   - **unregisteredProducts**: `lastSeenAt` (降順)

## 7. データベース構造

### ingredients (原材料)

\`\`\`
{
id: string (自動生成)
name: string
unit: string
stockQuantity: number
minStockLevel: number
supplier?: string
unitPrice?: number
description?: string
createdAt: Timestamp
updatedAt: Timestamp
}
\`\`\`

### recipes (レシピ)

\`\`\`
{
id: string (自動生成)
productName: string
ingredients: array of {
ingredientId: string
ingredientName: string
quantity: number
unit: string
}
createdAt: Timestamp
updatedAt: Timestamp
}
\`\`\`

### unregisteredProducts (未登録商品)

\`\`\`
{
id: string (商品名をそのまま使用)
soldQuantity: number
firstSeenAt: Timestamp
lastSeenAt: Timestamp
}
\`\`\`

### sales (売上データ)

\`\`\`
{
id: string (自動生成)
productName: string
category: string
taxType: string
totalSales: number
salesRatio: number
grossProfit: number
profitRatio: number
soldQuantity: number
quantityRatio: number
returnedQuantity: number
returnRatio: number
productId: string
productCode: string
barcode: string
importedAt: Timestamp
}
\`\`\`

## 8. アプリケーションの起動

\`\`\`bash
npm install
npm run dev
\`\`\`

## トラブルシューティング

### Firebaseが初期化されない場合

1. `.env` ファイルが正しく設定されているか確認
2. ブラウザのコンソールでエラーメッセージを確認
3. Firebase プロジェクトの設定が正しいか確認

### データが保存されない場合

1. Firestoreのセキュリティルールを確認
2. ネットワーク接続を確認
3. Firebase Consoleでデータベースの状態を確認
