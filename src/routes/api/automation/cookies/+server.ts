import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, initializationError } from '$lib/server/firebase-admin';
import { createErrorResponse } from '$lib/utils/errorHandler';
import { dev } from '$app/environment';

// AirREGI セッションCookieの登録・状態取得
// admin画面でDevToolsから貼り付けたCookieを automation/config.airregiCookies に保存し、
// Python の run.py / airregi_scraper.py がそこから読む。
//
// セキュリティ: Cookie値自体はGETで返さない（状態メタ情報のみ返す）。

const COLLECTION = 'automation';
const CONFIG_DOC = 'config';

interface CookieMeta {
	count: number;
	updatedAt: string | null;
	names: string[];
}

// 貼り付けられたCookie(JSON配列 or タブ区切り)を正規化して件数・名前を得る
function summarize(raw: string): CookieMeta {
	const trimmed = raw.trim();
	if (!trimmed) return { count: 0, updatedAt: null, names: [] };

	let names: string[] = [];
	try {
		if (trimmed[0] === '[' || trimmed[0] === '{') {
			const data = JSON.parse(trimmed);
			const arr = Array.isArray(data) ? data : [data];
			names = arr.map((c) => c?.name).filter(Boolean);
		} else {
			// タブ/カンマ区切りテーブル or name=value
			const lines = trimmed.split('\n').filter((l) => l.trim());
			for (let i = 0; i < lines.length; i++) {
				const cols = lines[i].includes('\t') ? lines[i].split('\t') : lines[i].split(',');
				if (i === 0 && /name|cookie/i.test(cols[0])) continue;
				const name = cols[0]?.trim();
				if (name && !name.includes('=')) names.push(name);
				else if (lines[i].includes('=')) names.push(lines[i].split('=')[0].trim());
			}
		}
	} catch {
		// パース不能でも保存は許可（Python側で再判定）。件数だけ不明にする
		return { count: -1, updatedAt: null, names: [] };
	}
	return { count: names.length, updatedAt: null, names };
}

// Cookie状態の取得（値は返さない）
export const GET: RequestHandler = async () => {
	if (!adminDb) {
		if (dev) {
			return json({ cookieMeta: { count: 0, updatedAt: null, names: [] } });
		}
		return createErrorResponse(
			initializationError || new Error('Database not initialized'),
			'データベース接続に失敗しました',
			500
		);
	}

	try {
		const doc = await adminDb.collection(COLLECTION).doc(CONFIG_DOC).get();
		const data = doc.data() || {};
		const raw = (data.airregiCookies as string) || '';
		const meta = summarize(raw);
		meta.updatedAt = (data.airregiCookiesUpdatedAt as string) || null;
		return json({ cookieMeta: meta });
	} catch (error: any) {
		return createErrorResponse(error, 'Cookie状態の取得に失敗しました', 500);
	}
};

// Cookieの保存
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
		const raw = (body.cookies ?? '').toString().trim();

		if (!raw) {
			return json({ success: false, message: 'Cookieが空です' }, { status: 400 });
		}

		const meta = summarize(raw);
		if (meta.count === 0) {
			return json(
				{ success: false, message: '有効なCookieが見つかりませんでした' },
				{ status: 400 }
			);
		}

		const now = new Date().toISOString();
		await adminDb
			.collection(COLLECTION)
			.doc(CONFIG_DOC)
			.set({ airregiCookies: raw, airregiCookiesUpdatedAt: now }, { merge: true });

		return json({ success: true, count: meta.count, updatedAt: now });
	} catch (error: any) {
		return createErrorResponse(error, 'Cookieの保存に失敗しました', 500);
	}
};
