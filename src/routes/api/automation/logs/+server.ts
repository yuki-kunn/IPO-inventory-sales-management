import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, initializationError } from '$lib/server/firebase-admin';
import { createErrorResponse } from '$lib/utils/errorHandler';
import { dev } from '$app/environment';

// 自動化の実行ログ（automation/config/logs サブコレクション）
// Python の add_log() が書き込んだログを直近順に返す

const COLLECTION = 'automation';
const CONFIG_DOC = 'config';
const LOGS = 'logs';

export const GET: RequestHandler = async ({ url }) => {
	if (!adminDb) {
		if (dev) {
			return json({ logs: [] });
		}
		return createErrorResponse(
			initializationError || new Error('Database not initialized'),
			'データベース接続に失敗しました',
			500
		);
	}

	try {
		const limit = Math.min(Number(url.searchParams.get('limit') ?? '30'), 100);

		const snapshot = await adminDb
			.collection(COLLECTION)
			.doc(CONFIG_DOC)
			.collection(LOGS)
			.orderBy('createdAt', 'desc')
			.limit(limit)
			.get();

		const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
		return json({ logs });
	} catch (error: any) {
		return createErrorResponse(error, 'ログの取得に失敗しました', 500);
	}
};
