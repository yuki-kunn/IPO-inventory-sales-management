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
		console.warn('[Firebase Admin] 開発環境: クライアント側Firestore SDKを使用してください');
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

				console.log('[Firebase Admin] Initialized with service account key');
				adminDb = getFirestore();
				return adminDb;
			} catch (error) {
				console.error('[Firebase Admin] Service account key initialization failed:', error);
				throw error;
			}
		}

		// フォールバック: プロジェクトIDで初期化を試みる
		const projectId = env.FIREBASE_ADMIN_PROJECT_ID || env.PUBLIC_FIREBASE_PROJECT_ID;

		if (projectId) {
			console.log('[Firebase Admin] Attempting initialization with project ID:', projectId);

			initializeApp({
				projectId: projectId
			});

			console.log('[Firebase Admin] Initialized with project ID');
			adminDb = getFirestore();
			return adminDb;
		}

		// 最後の手段: デフォルト認証
		console.log('[Firebase Admin] Attempting default initialization');
		initializeApp();
		console.log('[Firebase Admin] Initialized with default credentials');

		adminDb = getFirestore();
		return adminDb;
	} catch (error) {
		console.error('[Firebase Admin] Initialization failed:', error);
		console.error('[Firebase Admin] Error details:', {
			hasServiceAccountKey: !!env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY,
			hasAdminProjectId: !!env.FIREBASE_ADMIN_PROJECT_ID,
			hasPublicProjectId: !!env.PUBLIC_FIREBASE_PROJECT_ID,
			isDev: dev
		});

		initializationError = error as Error;
		throw new Error(`Firebase Admin SDK の初期化に失敗しました: ${(error as Error).message}`);
	}
}

// 初期化を実行
try {
	initializeFirebaseAdmin();
} catch (error) {
	console.error('[Firebase Admin] Failed to initialize on startup:', error);
}

export { adminDb, initializationError };
