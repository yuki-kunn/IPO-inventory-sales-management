import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchIngredientsFromNotion, updateIngredientStocks } from '$lib/server/notionIngredients';
import { createErrorResponse, createValidationError } from '$lib/utils/errorHandler';

// Notionから原材料在庫データを取得
export const GET: RequestHandler = async () => {
	try {
		return json({ ingredients: await fetchIngredientsFromNotion() });
	} catch (err: any) {
		return createErrorResponse(err, 'データ取得に失敗しました', 500);
	}
};

// Notionの在庫を更新
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { updates } = await request.json();

		if (!Array.isArray(updates) || updates.length === 0) {
			return createValidationError('更新データがありません', 'updates');
		}

		await updateIngredientStocks(updates);
		return json({ success: true });
	} catch (error: any) {
		return createErrorResponse(error, '在庫更新に失敗しました', 500);
	}
};
