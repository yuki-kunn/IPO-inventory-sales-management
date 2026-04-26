import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase-admin';
import { createErrorResponse, createValidationError } from '$lib/utils/errorHandler';
import type { UnregisteredProduct } from '$lib/types';

// 未登録商品の取得
export const GET: RequestHandler = async () => {
	try {
		const snapshot = await adminDb
			.collection('unregisteredProducts')
			.orderBy('lastSeenAt', 'desc')
			.get();

		const products: UnregisteredProduct[] = snapshot.docs.map((doc) => ({
			...(doc.data() as UnregisteredProduct),
			productName: doc.id
		}));

		return json({ products });
	} catch (error: any) {
		return createErrorResponse(error, '未登録商品の取得に失敗しました', 500);
	}
};

// 未登録商品の追加・更新
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { action, productName, quantity, date } = body;

		if (!action) {
			return createValidationError('アクションが指定されていません', 'action');
		}

		// addOrUpdate アクション
		if (action === 'addOrUpdate') {
			if (!productName || quantity === undefined || !date) {
				return createValidationError('商品名、数量、日付が必要です', 'productName');
			}

			const docRef = adminDb.collection('unregisteredProducts').doc(productName);
			const doc = await docRef.get();

			if (doc.exists) {
				// 既存の商品を更新
				const existingData = doc.data() as UnregisteredProduct;
				await docRef.update({
					totalQuantity: (existingData.totalQuantity || 0) + quantity,
					lastSeenAt: new Date().toISOString(),
					dates: [...(existingData.dates || []), { date, quantity }]
				});
			} else {
				// 新規商品を追加
				const newProduct: UnregisteredProduct = {
					productName,
					totalQuantity: quantity,
					firstSeenAt: new Date().toISOString(),
					lastSeenAt: new Date().toISOString(),
					dates: [{ date, quantity }]
				};
				await docRef.set(newProduct);
			}

			return json({ success: true, message: '未登録商品を保存しました' });
		}

		return createValidationError('無効なアクションです', 'action');
	} catch (error: any) {
		return createErrorResponse(error, '未登録商品の保存に失敗しました', 500);
	}
};

// 未登録商品の削除
export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const productName = url.searchParams.get('productName');

		if (!productName) {
			return createValidationError('商品名が必要です', 'productName');
		}

		await adminDb.collection('unregisteredProducts').doc(productName).delete();

		return json({ success: true, message: '未登録商品を削除しました' });
	} catch (error: any) {
		return createErrorResponse(error, '未登録商品の削除に失敗しました', 500);
	}
};
