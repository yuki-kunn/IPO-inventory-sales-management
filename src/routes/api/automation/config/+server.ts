import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, initializationError } from '$lib/server/firebase-admin';
import { createErrorResponse } from '$lib/utils/errorHandler';
import { dev } from '$app/environment';

// 自動化設定（実行時刻・有効フラグ・手動トリガ）
// Pythonの run.py / firestore_client.py と automation/config を共有する

const COLLECTION = 'automation';
const CONFIG_DOC = 'config';

const DEFAULT_CONFIG = {
	enabled: true,
	scheduledTime: '09:00',
	timezone: 'Asia/Tokyo',
	lastRunDate: '',
	forceRun: false,
	runDate: ''
};

// 設定取得
export const GET: RequestHandler = async () => {
	if (!adminDb) {
		if (dev) {
			return json({ config: DEFAULT_CONFIG });
		}
		return createErrorResponse(
			initializationError || new Error('Database not initialized'),
			'データベース接続に失敗しました',
			500
		);
	}

	try {
		const ref = adminDb.collection(COLLECTION).doc(CONFIG_DOC);
		const doc = await ref.get();

		if (!doc.exists) {
			await ref.set(DEFAULT_CONFIG);
			return json({ config: DEFAULT_CONFIG });
		}

		return json({ config: { ...DEFAULT_CONFIG, ...doc.data() } });
	} catch (error: any) {
		return createErrorResponse(error, '設定の取得に失敗しました', 500);
	}
};

// 設定更新（部分更新）
export const POST: RequestHandler = async ({ request }) => {
	if (!adminDb) {
		if (dev) {
			return json({ success: true, message: '開発環境では保存されません' });
		}
		return createErrorResponse(
			initializationError || new Error('Database not initialized'),
			'データベース接続に失敗しました',
			500
		);
	}

	try {
		const body = await request.json();
		const allowed: Record<string, unknown> = {};

		// 許可フィールドのみ受け付ける
		if (typeof body.enabled === 'boolean') allowed.enabled = body.enabled;
		if (typeof body.forceRun === 'boolean') allowed.forceRun = body.forceRun;
		if (typeof body.scheduledTime === 'string') {
			// "HH:MM" 形式を検証
			if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(body.scheduledTime)) {
				return json(
					{ success: false, message: '時刻は HH:MM 形式で入力してください' },
					{ status: 400 }
				);
			}
			allowed.scheduledTime = body.scheduledTime;
		}
		// 指定日実行の対象日（"YYYY-MM-DD" または空文字でクリア）
		if (typeof body.runDate === 'string') {
			if (body.runDate !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(body.runDate)) {
				return json(
					{ success: false, message: '日付は YYYY-MM-DD 形式で入力してください' },
					{ status: 400 }
				);
			}
			allowed.runDate = body.runDate;
		}

		if (Object.keys(allowed).length === 0) {
			return json({ success: false, message: '更新可能な項目がありません' }, { status: 400 });
		}

		await adminDb.collection(COLLECTION).doc(CONFIG_DOC).set(allowed, { merge: true });
		return json({ success: true });
	} catch (error: any) {
		return createErrorResponse(error, '設定の更新に失敗しました', 500);
	}
};
