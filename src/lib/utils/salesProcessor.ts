import type { SalesData, SalesProcessResult, Recipe, Ingredient } from '$lib/types';
import { get } from 'svelte/store';
import { recipes } from '$lib/stores/recipes.firestore';
import { ingredients } from '$lib/stores/ingredients.firestore';
import { unregisteredProducts } from '$lib/stores/unregistered.api';

// 無視する商品名のリスト（カテゴリなど）
const IGNORED_PRODUCTS = ['男性', '女性'];

// ジュースとしてNotionに登録されている商品のリスト
const JUICE_PRODUCTS = ['リンゴ', 'マンゴー'];

/**
 * レシピを検索する（ジュース対応含む）
 * @param productName 商品名
 * @param allRecipes 全レシピ
 * @returns 見つかったレシピまたはundefined
 */
function findRecipe(productName: string, allRecipes: Recipe[]): Recipe | undefined {
	// まず完全一致で検索
	let recipe = allRecipes.find((r) => r.productName === productName);

	// 見つからない場合、ジュース商品なら「ジュース」を追加して再検索
	if (!recipe && JUICE_PRODUCTS.includes(productName)) {
		const juiceName = `${productName}ジュース`;
		recipe = allRecipes.find((r) => r.productName === juiceName);
		if (recipe) {
		}
	}

	return recipe;
}

/**
 * 売上データを処理し、レシピに基づいて原材料在庫を減算する
 * @param salesData 売上データ
 * @param salesDate 売上日（YYYY-MM-DD形式）
 * @param alreadyProcessedProducts すでに処理済みの商品名リスト
 */
export async function processSalesData(
	salesData: SalesData[],
	salesDate?: string,
	alreadyProcessedProducts: string[] = []
): Promise<SalesProcessResult> {
	const result: SalesProcessResult = {
		processedProducts: [],
		unregisteredProducts: [],
		totalProcessed: 0,
		totalUnregistered: 0
	};

	const currentRecipes = get(recipes);
	const currentIngredients = get(ingredients);

	if (currentRecipes.length === 0 || currentIngredients.length === 0) {
		console.warn(
			'[salesProcessor] レシピまたは原材料が未ロード。呼び出し元で refresh() を await してください。' +
				` recipes=${currentRecipes.length} ingredients=${currentIngredients.length}`
		);
		return result;
	}

	for (const sale of salesData) {
		// 無視する商品をスキップ
		if (IGNORED_PRODUCTS.includes(sale.productName)) {
			continue;
		}

		// すでに処理済みの商品をスキップ
		if (alreadyProcessedProducts.includes(sale.productName)) {
			continue;
		}
		// レシピを検索（ジュース対応含む）
		const recipe = findRecipe(sale.productName, currentRecipes);

		if (recipe && recipe.ingredients.length > 0) {
			// レシピが登録されている場合、原材料在庫を減算
			const ingredientsReduced: { ingredientName: string; reducedQuantity: number }[] = [];

			for (const recipeIngredient of recipe.ingredients) {
				const totalReduction = recipeIngredient.quantity * sale.soldQuantity;

				// 原材料在庫を減算
				await ingredients.reduceStock(recipeIngredient.ingredientId, totalReduction);

				ingredientsReduced.push({
					ingredientName: recipeIngredient.ingredientName,
					reducedQuantity: totalReduction
				});
			}

			result.processedProducts.push({
				productName: sale.productName,
				soldQuantity: sale.soldQuantity,
				ingredientsReduced
			});
			result.totalProcessed++;
		} else {
			// レシピが未登録の場合
			const dateToUse = salesDate || sale.salesDate || new Date().toISOString().split('T')[0];
			await unregisteredProducts.addOrUpdate(sale.productName, sale.soldQuantity, dateToUse);

			const unregisteredProduct = {
				productName: sale.productName,
				soldQuantity: sale.soldQuantity,
				firstSeenAt: new Date().toISOString(),
				lastSeenAt: new Date().toISOString(),
				salesDates: [dateToUse]
			};

			result.unregisteredProducts.push(unregisteredProduct);
			result.totalUnregistered++;
		}
	}


	return result;
}
