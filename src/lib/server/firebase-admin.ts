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

	// 開発環境では初期化しない
	if (dev) {
		initializationError = new Error('開発環境ではAdmin SDKは使用できません');
		return null;
	}

	try {
		// サービスアカウントキーがBase64エンコードされている場合（推奨）
		if (env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY) {
			try {
				const serviceAccountJson = Buffer.from(
					env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY,
					'base64'
				).toString('utf-8');
				const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;

				initializeApp({
					credential: cert(serviceAccount)
				});

				adminDb = getFirestore();
				return adminDb;
			} catch (error) {
				throw error;
			}
		}

		// フォールバック: プロジェクトIDで初期化を試みる
		const projectId = env.FIREBASE_ADMIN_PROJECT_ID || env.PUBLIC_FIREBASE_PROJECT_ID;

		if (projectId) {
			initializeApp({
				projectId: projectId
			});

			adminDb = getFirestore();
			return adminDb;
		}

		// 最後の手段: デフォルト認証
		initializeApp();

		adminDb = getFirestore();
		return adminDb;
	} catch (error) {
		initializationError = error as Error;
		throw new Error(`Firebase Admin SDK の初期化に失敗しました: ${(error as Error).message}`);
	}
}

// 初期化を実行
try {
	initializeFirebaseAdmin();
} catch (error) {
	// エラーは initializationError に保存済み
}

export { adminDb, initializationError };
