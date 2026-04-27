# ドキュメント

このフォルダには、プロジェクトの各種ドキュメントが含まれています。

## 📘 開発者向けドキュメント

### アーキテクチャ・設計
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 🆕 システムアーキテクチャと設計原則
  - プロジェクト構成
  - データフロー
  - セキュリティアーキテクチャ
  - コンポーネント設計原則
  - パフォーマンス最適化
  - 今後の拡張ポイント

## 📗 セットアップ・環境構築

- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Firebaseプロジェクトのセットアップ手順
- **[ENV_FIX_GUIDE.md](./ENV_FIX_GUIDE.md)** - 環境変数のトラブルシューティング

## 🚀 デプロイ

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 本番環境へのデプロイ手順（完全版）
- **[VERCEL_DEPLOYMENT_FIX.md](./VERCEL_DEPLOYMENT_FIX.md)** - Vercelデプロイ時のエラー解決ガイド

## 🔒 セキュリティ

- **[SECURITY.md](./SECURITY.md)** - セキュリティアーキテクチャと実装詳細
  - Firestore完全ロックダウン
  - CSRF保護
  - レート制限
  - セキュリティヘッダー

## 🔧 トラブルシューティング

- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - よくある問題と解決方法

## ドキュメント構成

```
docs/
├── README.md                     # このファイル
├── ARCHITECTURE.md              # 🆕 アーキテクチャドキュメント
├── FIREBASE_SETUP.md            # Firebaseセットアップガイド
├── ENV_FIX_GUIDE.md             # 環境変数ガイド
├── DEPLOYMENT.md                # デプロイガイド
├── VERCEL_DEPLOYMENT_FIX.md     # Vercelエラー解決
├── SECURITY.md                  # セキュリティドキュメント
└── TROUBLESHOOTING.md           # トラブルシューティング
```

## 推奨する読む順番

### 初めての方

1. [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebaseプロジェクトの作成
2. [ENV_FIX_GUIDE.md](./ENV_FIX_GUIDE.md) - 環境変数の設定
3. 開発サーバーを起動して動作確認

### デプロイする方

1. [DEPLOYMENT.md](./DEPLOYMENT.md) - 全体の流れを把握
2. [VERCEL_DEPLOYMENT_FIX.md](./VERCEL_DEPLOYMENT_FIX.md) - エラーが出たら参照
3. [SECURITY.md](./SECURITY.md) - セキュリティ設定の確認

### エラーが出た方

1. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - よくある問題を確認
2. [VERCEL_DEPLOYMENT_FIX.md](./VERCEL_DEPLOYMENT_FIX.md) - デプロイエラーの場合
3. [ENV_FIX_GUIDE.md](./ENV_FIX_GUIDE.md) - 環境変数エラーの場合
