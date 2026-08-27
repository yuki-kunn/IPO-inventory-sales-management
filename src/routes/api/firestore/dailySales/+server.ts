import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, initializationError } from '$lib/server/firebase-admin';
import { createErrorResponse, createValidationError } from '$lib/utils/errorHandler';
import type { DailySales, SalesData, CustomerInfo } from '$lib/types';
import { dev } from '$app/environment';

// 日別売上データの取得
export const GET: RequestHandler = async ({ url }) => {
	// 開発環境でAdmin SDKが使えない場合
	if (!adminDb) {
		if (dev) {
			return json({ dailySales: [] });
		}
		return createErrorResponse(
			initializationError || new Error('Database not initialized'),
			'データベース接続に失敗しました',
			500
		);
	}

	try {
		const date = url.searchParams.get('date');

		// 特定の日付の売上を取得
		if (date) {
			const docRef = adminDb.collection('dailySales').doc(date);
			const doc = await docRef.get();

			if (!doc.exists) {
				return json({ dailySale: null });
			}

			const data = doc.data() as DailySales;
			return json({ dailySale: { ...data, id: doc.id } });
		}

		// すべての売上を取得
		const snapshot = await adminDb.collection('dailySales').orderBy('date', 'desc').get();

		const dailySales: DailySales[] = snapshot.docs.map((doc) => ({
			...(doc.data() as DailySales),
			id: doc.id
		}));

		return json({ dailySales });
	} catch (error: any) {
		return createErrorResponse(error, '日別売上データの取得に失敗しました', 500);
	}
};

// 日別売上データの追加・更新
export const POST: RequestHandler = async ({ request }) => {
	// 開発環境でAdmin SDKが使えない場合
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
		const {
			action,
			date,
			salesData,
			unregisteredCount,
			customerInfo,
			processedProducts,
			weather,
			discountTotal
		} = body;

		if (!action) {
			return createValidationError('アクションが指定されていません', 'action');
		}

		// addOrUpdate アクション
		if (action === 'addOrUpdate') {
			if (!date || !salesData) {
				return createValidationError('日付と売上データが必要です', 'date');
			}

			const docRef = adminDb.collection('dailySales').doc(date);
			const doc = await docRef.get();

			// 集計データを計算
			const totalSales = salesData.reduce((sum: number, s: SalesData) => sum + s.totalSales, 0);
			const totalProfit = salesData.reduce((sum: number, s: SalesData) => sum + s.grossProfit, 0);
			const totalQuantity = salesData.reduce(
				(sum: number, s: SalesData) => sum + s.soldQuantity,
				0
			);
			const productCount = salesData.length;

			// 既存データがあれば更新、なければ作成
			if (doc.exists) {
				const existingData = doc.data() as any;

				const batch = adminDb.batch();

				// 1. 旧ドキュメントを履歴としてスタッシュ（全バージョン保持）
				const stashRef = docRef.collection('stash').doc();
				batch.set(stashRef, {
					...existingData,
					stashedAt: new Date().toISOString(),
					stashReason: 'csv-reimport-replace'
				});

				// 2. 新データで完全置き換え（マージしない）。在庫は次のreflectで再計算する。
				//    旧reflectionDeltaをpendingRevertDeltaへ退避し、reflect時に旧反映を取り消す。
				const replaceData: any = {
					id: date,
					date,
					totalSales,
					totalProfit,
					totalQuantity,
					productCount,
					salesData: salesData as SalesData[],
					sales: salesData as SalesData[],
					inventoryProcessed: false,
					isProcessed: false,
					processedAt: null,
					processedProducts: [],
					unregisteredCount: 0,
					customerInfo: customerInfo ?? existingData.customerInfo ?? [],
					weather: weather ?? existingData.weather ?? '',
					discountTotal: discountTotal ?? existingData.discountTotal ?? 0,
					reflectionDelta: null,
					pendingRevertDelta: existingData.reflectionDelta ?? null,
					createdAt: existingData.createdAt ?? new Date().toISOString(),
					updatedAt: new Date().toISOString()
				};
				batch.set(docRef, replaceData);

				await batch.commit();
			} else {
				// 新規作成
				const newData: any = {
					id: date,
					date,
					totalSales,
					totalProfit,
					totalQuantity,
					productCount,
					salesData: salesData as SalesData[],
					sales: salesData as SalesData[], // 互換性のため
					unregisteredCount: unregisteredCount ?? 0,
					customerInfo: (customerInfo as CustomerInfo[]) ?? [],
					inventoryProcessed: false,
					isProcessed: false,
					processedAt: null,
					processedProducts: [],
					weather: weather ?? '',
					discountTotal: discountTotal ?? 0,
					reflectionDelta: null,
					pendingRevertDelta: null,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				};

				await docRef.set(newData);
			}

			return json({ success: true, message: '日別売上を保存しました' });
		}

		// markAsProcessed アクション
		if (action === 'markAsProcessed') {
			if (!date) {
				return createValidationError('日付が必要です', 'date');
			}

			const docRef = adminDb.collection('dailySales').doc(date);
			const doc = await docRef.get();

			if (!doc.exists) {
				return createValidationError('指定された日付の売上データが見つかりません', 'date');
			}

			await docRef.update({
				inventoryProcessed: true,
				isProcessed: true,
				processedAt: new Date().toISOString(),
				unregisteredCount: unregisteredCount ?? 0,
				processedProducts: processedProducts ?? [],
				updatedAt: new Date().toISOString()
			});

			return json({ success: true, message: '処理済みとしてマークしました' });
		}

		return createValidationError('無効なアクションです', 'action');
	} catch (error: any) {
		return createErrorResponse(error, '日別売上データの保存に失敗しました', 500);
	}
};

// 日別売上データの削除
export const DELETE: RequestHandler = async ({ url }) => {
	// 開発環境でAdmin SDKが使えない場合
	if (!adminDb) {
		if (dev) {
			return json({ success: true, message: '開発環境では削除されません' });
		}
		return createErrorResponse(
			initializationError || new Error('Database not initialized'),
			'データベース接続に失敗しました',
			500
		);
	}

	try {
		const date = url.searchParams.get('date');

		if (!date) {
			return createValidationError('日付が必要です', 'date');
		}

		await adminDb.collection('dailySales').doc(date).delete();

		return json({ success: true, message: '日別売上を削除しました' });
	} catch (error: any) {
		return createErrorResponse(error, '日別売上データの削除に失敗しました', 500);
	}
};
