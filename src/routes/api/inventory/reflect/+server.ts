import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { reflectInventory } from '$lib/server/inventoryReflection';
import { createErrorResponse, createValidationError } from '$lib/utils/errorHandler';

export const POST: RequestHandler = async ({ request }) => {
	let date: string;
	try {
		({ date } = await request.json());
	} catch {
		return createValidationError('リクエストボディが不正です', 'body');
	}
	if (!date || typeof date !== 'string') return createValidationError('日付が必要です', 'date');
	try {
		const result = await reflectInventory(date);
		return json({ success: true, result });
	} catch (err: any) {
		return createErrorResponse(err, '在庫反映に失敗しました', 500);
	}
};
