# .env ファイルの修正方法

## 問題

現在の `.env` ファイルの値に余分なダブルクォートやカンマが含まれています：

```
VITE_FIREBASE_PROJECT_ID="\"ipo-pre-staging\","  ← 間違い
```

## 正しい書き方

`.env` ファイルでは、値を **ダブルクォートで囲まない** でください：

```bash
# ❌ 間違い
VITE_FIREBASE_PROJECT_ID="\"ipo-pre-staging\","
VITE_FIREBASE_API_KEY="\"your-api-key\","

# ✅ 正しい
VITE_FIREBASE_PROJECT_ID=ipo-pre-staging
VITE_FIREBASE_API_KEY=your-api-key
```

## 修正手順

1. `.env` ファイルを開く
2. すべての値から **ダブルクォート** と **カンマ** を削除
3. ファイルを保存
4. 開発サーバーを再起動

## 正しい .env ファイルの例

\`\`\`bash
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
\`\`\`

## 注意点

- 値に **スペースが含まれる場合のみ** ダブルクォートを使用
- **カンマは不要**
- **セミコロンは不要**
- 各行は `KEY=value` の形式

## 修正後の確認

開発サーバーを再起動後、ブラウザのコンソールで以下を確認：

\`\`\`
[Firebase] Config: {
projectId: "your-project-id", ← ダブルクォートやカンマがないこと
apiKeySet: true,
authDomainSet: true
}
\`\`\`
