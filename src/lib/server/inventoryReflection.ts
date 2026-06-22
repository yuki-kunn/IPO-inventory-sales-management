import type { SalesData, SalesProcessResult } from '$lib/types';
import { adminDb, initializationError } from '$lib/server/firebase-admin';
import { fetchRecipesFromNotion } from './notionRecipes';
import { fetchIngredientsFromNotion, updateIngredientStocks } from './notionIngredients';
import type { Recipe } from '$lib/types';

const IGNORED_PRODUCTS = ['男性', '女性'];
const JUICE_PRODUCTS = ['リンゴ', 'マンゴー'];

export interface ReflectResult extends SalesProcessResult {
	salesDate: string;
	alreadyProcessedCount: number;
}

/**
 * 商品名からレシピを検索する。
 * 完全一致を優先。見つからずジュース対象商品の場合は「〇〇ジュース」で再検索。
 */
function findRecipe(productName: string, recipes: Recipe[]): Recipe | undefined {
	const exact = recipes.find((r) => r.productName === productName);
	if (exact) return exact;

	if (JUICE_PRODUCTS.includes(productName)) {
		const juiceName = `${productName}ジュース`;
		return recipes.find((r) => r.productName === juiceName);
	}

	return undefined;
}

/**
 * 未登録商品をFirestoreにupsertする。
 * src/routes/api/firestore/unregistered/+server.ts の addOrUpdate ロジックを踏襲。
 */
async function upsertUnregistered(productName: string, quantity: number, date: string): Promise<void> {
	if (!adminDb) throw initializationError ?? new Error('データベース未初期化');

	const docRef = adminDb.collection('unregisteredProducts').doc(productName);
	const doc = await docRef.get();

	if (doc.exists) {
		const data = doc.data() as any;
		const existingSalesDates: string[] =
			data.salesDates ?? (data.dates?.map((d: any) => String(d.date ?? d)) ?? []);
		await docRef.update({
			soldQuantity: (data.soldQuantity ?? data.totalQuantity ?? 0) + quantity,
			salesDates: Array.from(new Set([...existingSalesDates, date])),
			lastSeenAt: new Date().toISOString()
		});
	} else {
		await docRef.set({
			productName,
			soldQuantity: quantity,
			salesDates: [date],
			firstSeenAt: new Date().toISOString(),
			lastSeenAt: new Date().toISOString()
		} as any);
	}
}

/**
 * 指定日の売上データから在庫反映を行う。
 * 1. Notion原材料在庫の減算
 * 2. 未登録商品のFirestore記録
 * 3. dailySalesドキュメントの処理済みマーク
 *
 * Notion在庫更新（step 7）はdailySalesドキュメント更新（step 9）より前に行う。
 * Notion失敗時はドキュメントが未マークのまま残り、再実行可能となる。
 */
export async function reflectInventory(date: string): Promise<ReflectResult> {
	if (!adminDb) throw initializationError ?? new Error('データベース未初期化');

	const doc = await adminDb.collection('dailySales').doc(date).get();
	if (!doc.exists) throw new Error('指定日の売上データがありません: ' + date);

	const data = doc.data() as any;
	const sales: SalesData[] = data.salesData ?? data.sales ?? [];
	const alreadyProcessed: string[] = data.processedProducts ?? [];

	const recipes = await fetchRecipesFromNotion();
	const ingredients = await fetchIngredientsFromNotion();
	if (recipes.length === 0) throw new Error('レシピが0件のため在庫反映を中止しました');

	const stockMap = new Map<string, number>(ingredients.map((i) => [i.id, i.stockQuantity ?? 0]));
	const reductionByIngredient = new Map<string, number>();

	const result: ReflectResult = {
		processedProducts: [],
		unregisteredProducts: [],
		totalProcessed: 0,
		totalUnregistered: 0,
		salesDate: date,
		alreadyProcessedCount: 0
	};
	const newlyProcessed: string[] = [];
	const unregisteredToWrite: { name: string; qty: number }[] = [];

	for (const sale of sales) {
		if (IGNORED_PRODUCTS.includes(sale.productName)) continue;
		if (alreadyProcessed.includes(sale.productName)) {
			result.alreadyProcessedCount++;
			continue;
		}

		const recipe = findRecipe(sale.productName, recipes);

		if (recipe && recipe.ingredients.length > 0) {
			const reduced: { ingredientName: string; reducedQuantity: number }[] = [];
			for (const ri of recipe.ingredients) {
				const amt = ri.quantity * sale.soldQuantity;
				reductionByIngredient.set(
					ri.ingredientId,
					(reductionByIngredient.get(ri.ingredientId) ?? 0) + amt
				);
				reduced.push({ ingredientName: ri.ingredientName, reducedQuantity: amt });
			}
			result.processedProducts.push({
				productName: sale.productName,
				soldQuantity: sale.soldQuantity,
				ingredientsReduced: reduced
			});
			result.totalProcessed++;
			newlyProcessed.push(sale.productName);
		} else {
			const now = new Date().toISOString();
			unregisteredToWrite.push({ name: sale.productName, qty: sale.soldQuantity });
			result.unregisteredProducts.push({
				productName: sale.productName,
				soldQuantity: sale.soldQuantity,
				salesDates: [date],
				firstSeenAt: now,
				lastSeenAt: now
			});
			result.totalUnregistered++;
			newlyProcessed.push(sale.productName);
		}
	}

	// Notion在庫更新（dailySales更新より前に実行）
	const updates = Array.from(reductionByIngredient.entries()).map(([id, total]) => ({
		id,
		newStock: Math.max(0, (stockMap.get(id) ?? 0) - total)
	}));
	if (updates.length) await updateIngredientStocks(updates);

	for (const u of unregisteredToWrite) await upsertUnregistered(u.name, u.qty, date);

	const mergedProcessed = Array.from(new Set([...alreadyProcessed, ...newlyProcessed]));
	const now = new Date().toISOString();
	await adminDb.collection('dailySales').doc(date).update({
		inventoryProcessed: true,
		isProcessed: true,
		processedAt: now,
		unregisteredCount: (data.unregisteredCount ?? 0) + result.totalUnregistered,
		processedProducts: mergedProcessed,
		updatedAt: now
	});

	return result;
}
