import type { SalesData, SalesProcessResult, Recipe, Ingredient } from '$lib/types';
import { get } from 'svelte/store';
import { recipes } from '$lib/stores/recipes.firestore';
import { ingredients } from '$lib/stores/ingredients.firestore';
import { unregisteredProducts } from '$lib/stores/unregistered.firestore';

// 無視する商品名のリスト（カテゴリなど）
const IGNORED_PRODUCTS = ['男性', '女性'];

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
    totalUnregistered: 0,
  };

  const currentRecipes = get(recipes);
  const currentIngredients = get(ingredients);

  console.log('[processSalesData] 処理開始:', {
    salesDataCount: salesData.length,
    recipesCount: currentRecipes.length,
    alreadyProcessedCount: alreadyProcessedProducts.length,
  });

  for (const sale of salesData) {
    // 無視する商品をスキップ
    if (IGNORED_PRODUCTS.includes(sale.productName)) {
      console.log('[processSalesData] 無視する商品:', sale.productName);
      continue;
    }

    // すでに処理済みの商品をスキップ
    if (alreadyProcessedProducts.includes(sale.productName)) {
      console.log('[processSalesData] すでに処理済みの商品をスキップ:', sale.productName);
      continue;
    }
    // レシピを検索
    const recipe = currentRecipes.find((r) => r.productName === sale.productName);
    console.log('[processSalesData] 商品:', sale.productName, 'レシピ:', recipe ? '登録済み' : '未登録');

    if (recipe && recipe.ingredients.length > 0) {
      // レシピが登録されている場合、原材料在庫を減算
      const ingredientsReduced: { ingredientName: string; reducedQuantity: number }[] = [];

      for (const recipeIngredient of recipe.ingredients) {
        const totalReduction = recipeIngredient.quantity * sale.soldQuantity;

        // 原材料在庫を減算
        await ingredients.reduceStock(recipeIngredient.ingredientId, totalReduction);

        ingredientsReduced.push({
          ingredientName: recipeIngredient.ingredientName,
          reducedQuantity: totalReduction,
        });
      }

      result.processedProducts.push({
        productName: sale.productName,
        soldQuantity: sale.soldQuantity,
        ingredientsReduced,
      });
      result.totalProcessed++;
    } else {
      // レシピが未登録の場合
      const dateToUse = salesDate || sale.salesDate || new Date().toISOString().split('T')[0];
      console.log('[processSalesData] 未登録商品を追加:', sale.productName, '販売数:', sale.soldQuantity, '日付:', dateToUse);
      await unregisteredProducts.addOrUpdate(sale.productName, sale.soldQuantity, dateToUse);

      const unregisteredProduct = {
        productName: sale.productName,
        soldQuantity: sale.soldQuantity,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      };

      result.unregisteredProducts.push(unregisteredProduct);
      result.totalUnregistered++;
    }
  }

  console.log('[processSalesData] 処理完了:', {
    totalProcessed: result.totalProcessed,
    totalUnregistered: result.totalUnregistered,
  });

  return result;
}
