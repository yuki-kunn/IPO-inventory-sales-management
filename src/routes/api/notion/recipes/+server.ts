import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchRecipesFromNotion } from '$lib/server/notionRecipes';
import { createErrorResponse } from '$lib/utils/errorHandler';

export const GET: RequestHandler = async () => {
	try {
		const recipes = await fetchRecipesFromNotion();
		return json({ recipes });
	} catch (err: any) {
		return createErrorResponse(err, 'レシピデータの取得に失敗しました', 500);
	}
};
