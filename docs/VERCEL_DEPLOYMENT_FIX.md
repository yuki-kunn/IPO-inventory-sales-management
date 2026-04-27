# Vercel デプロイエラー解決ガイド

## 現在のエラー

```
GET /api/firestore/dailySales 500 (Internal Server Error)
```

## 原因と解決策

### 問題1: Firebase Admin SDKの初期化失敗

Vercelでは環境変数だけでは不十分な場合があります。サービスアカウントキーが必要です。

### 解決手順

#### ステップ1: サービスアカウントキーの取得

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト「ipo-kaidashi」を選択
3. **⚙️ プロジェクトの設定** → **サービス アカウント** タブをクリック
4. 「新しい秘密鍵の生成」ボタンをクリック
5. `ipo-kaidashi-xxxxx.json` ファイルがダウンロードされます

#### ステップ2: JSONをBase64エンコード

**Mac/Linux の場合:**
```bash
base64 -i ipo-kaidashi-xxxxx.json | tr -d '\n' > encoded.txt
cat encoded.txt
```

**Windows (PowerShell) の場合:**
```powershell
$bytes = [System.IO.File]::ReadAllBytes("ipo-kaidashi-xxxxx.json")
$base64 = [System.Convert]::ToBase64String($bytes)
$base64 | Out-File -FilePath encoded.txt -NoNewline
Get-Content encoded.txt
```

出力された長い文字列をコピーします。

#### ステップ3: Vercelに環境変数を追加

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクト「ipo-inventory-sales-management」を選択
3. **Settings** → **Environment Variables** をクリック
4. 以下を追加:

| Name | Value |
|------|-------|
| `FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY` | （コピーしたBase64文字列） |

5. **Save** をクリック
6. **Redeploy** をクリック（重要！環境変数を反映するため）

#### ステップ4: 既存の環境変数を確認

以下も設定されているか確認:

```bash
PUBLIC_FIREBASE_API_KEY=（既存の値）
PUBLIC_FIREBASE_AUTH_DOMAIN=ipo-kaidashi.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=ipo-kaidashi
PUBLIC_FIREBASE_STORAGE_BUCKET=ipo-kaidashi.firebasestorage.app
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=916304773249
PUBLIC_FIREBASE_APP_ID=1:916304773249:web:aabc3399d8cff99da14d80

NOTION_API_KEY=（既存の値）
NOTION_DATABASE_ID=（既存の値）
NOTION_DATABASE_ID_IMPORT=（既存の値）

WEATHER_API_KEY=（既存の値）
```

## 別の解決方法（より簡単）

Firebase Admin SDKの初期化方法を変更することで、サービスアカウントキーなしでも動作させることができます。

### コード修正版

`src/lib/server/firebase-admin.ts` を以下のように修正:

```typescript
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

let adminDb: FirebaseFirestore.Firestore | null = null;
let initializationError: Error | null = null;

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    adminDb = getFirestore();
    return adminDb;
  }

  try {
    // Vercel環境では環境変数から自動的に認証情報を取得
    const config: any = {};

    if (env.PUBLIC_FIREBASE_PROJECT_ID) {
      config.projectId = env.PUBLIC_FIREBASE_PROJECT_ID;
    }

    // デフォルト認証を使用（Vercel/GCP環境）
    initializeApp(config);

    console.log('[Firebase Admin] Initialized successfully');
    adminDb = getFirestore();
    return adminDb;
  } catch (error) {
    console.error('[Firebase Admin] Initialization failed:', error);
    initializationError = error as Error;

    if (!dev) {
      throw error;
    }
    return null;
  }
}

initializeFirebaseAdmin();

export { adminDb, initializationError };
```

## トラブルシューティング

### エラーログの確認方法

Vercel Dashboardで:
1. プロジェクトを選択
2. **Deployments** タブをクリック
3. 最新のデプロイをクリック
4. **Function Logs** でエラー詳細を確認

### よくあるエラー

#### Error: "Could not load the default credentials"

**解決策**: サービスアカウントキーを設定する（上記ステップ1-3）

#### Error: "PERMISSION_DENIED"

**原因**: Firestoreルールが厳しすぎる

**解決策**:
```bash
firebase deploy --only firestore:rules
```

ルールファイル（firestore.rules）を確認:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // クライアント側はブロック
    }
  }
}
```

これは正常です。Admin SDKは影響を受けません。

#### Error: "App not initialized"

**解決策**: Vercelで再デプロイ

```bash
# ローカルで変更をコミット
git add .
git commit -m "Fix Firebase Admin initialization"
git push origin main

# または、Vercelダッシュボードで手動で再デプロイ
```

## 確認方法

デプロイ後、以下のURLにアクセスしてテスト:

```
https://ipo-inventory-sales-management.vercel.app/api/firestore/dailySales
```

成功すれば:
```json
{
  "dailySales": [...]
}
```

失敗すれば:
```json
{
  "error": "..."
}
```

## まとめ

1. **推奨**: サービスアカウントキーをBase64エンコードして設定
2. **代替**: コード修正版を使用（簡単だが権限が弱い場合あり）
3. 環境変数設定後は**必ず再デプロイ**
4. Vercelのログで詳細なエラーを確認
