import { getApps, initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

/**
 * Firebase Admin SDK の初期化
 * サーバー側でのみ使用可能（クライアント側では使用不可）
 */

let adminDb: FirebaseFirestore.Firestore | null = null;
let initializationError: Error | null = null;

function initializeFirebaseAdmin() {
	// すでに初期化されている場合はスキップ
	if (getApps().length > 0) {
		adminDb = getFirestore();
		return adminDb;
	}

	try {
		// サービスアカウントキーがBase64エンコードされている場合
		if (env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY) {
			const serviceAccountJson = Buffer.from(
				env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY,
				'base64'
			).toString('utf-8');
			const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;

			initializeApp({
				credential: cert(serviceAccount)
			});

			console.log('[Firebase Admin] Initialized with service account key');
		}
		// プロジェクトIDのみで初期化（Vercel/GCPなど、デフォルト認証が使える環境）
		else if (env.FIREBASE_ADMIN_PROJECT_ID) {
			initializeApp({
				projectId: env.FIREBASE_ADMIN_PROJECT_ID
			});

			console.log('[Firebase Admin] Initialized with project ID');
		}
		// 開発環境: PUBLIC_FIREBASE_PROJECT_IDを使用
		else if (dev && env.PUBLIC_FIREBASE_PROJECT_ID) {
			console.warn('[Firebase Admin] 開発環境: クライアント側Firestore SDKを使用してください');
			console.warn('[Firebase Admin] Admin SDK機能は本番環境でのみ動作します');

			// 開発環境では初期化しない（クライアント側SDKを使用）
			initializationError = new Error('開発環境ではAdmin SDKは使用できません');
			return null;
		}
		// 環境変数から自動検出
		else {
			initializeApp();
			console.log('[Firebase Admin] Initialized with default credentials');
		}

		adminDb = getFirestore();
		return adminDb;
	} catch (error) {
		console.error('[Firebase Admin] Initialization failed:', error);
		initializationError = error as Error;

		if (dev) {
			console.warn('[Firebase Admin] 開発環境では通常のFirestore SDKを使用してください');
			return null;
		}

		throw new Error('Firebase Admin SDK の初期化に失敗しました');
	}
}

// 初期化を実行
initializeFirebaseAdmin();

export { adminDb, initializationError };
