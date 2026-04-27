import { writable, derived } from 'svelte/store';
import type { Ingredient, IngredientStats } from '$lib/types';
import { browser } from '$app/environment';

// Notion経由で原材料を管理するストア
function createIngredientsNotionStore() {
	const { subscribe, set, update } = writable<Ingredient[]>([]);

	let refreshInterval: ReturnType<typeof setInterval> | null = null;

	// Notionから最新データを取得
	async function fetchIngredients() {
		if (!browser) return;

		try {
			const response = await fetch('/api/notion/ingredients');

			if (!response.ok) {
				throw new Error(`Failed to fetch ingredients: ${response.statusText}`);
			}

			const data = await response.json();

			if (data.ingredients) {
				data.ingredients.forEach((i: Ingredient) => {
				});
				set(data.ingredients);
			}
		} catch (error) {
			console.error('[Ingredients] データ取得エラー:', error);
		}
	}

	// 定期的にデータを取得（30秒ごと）
	function initAutoRefresh() {
		if (!browser) return;

		// 初回読み込み
		fetchIngredients();

		// 30秒ごとに更新
		refreshInterval = setInterval(() => {
			fetchIngredients();
		}, 30000);
	}

	// ブラウザ環境で自動更新を開始
	if (browser) {
		initAutoRefresh();
	}

	return {
		subscribe,
		refresh: fetchIngredients,
		add: async (ingredient: Omit<Ingredient, 'id'>) => {
			// 注意: Notionへの追加は現在未実装（手動でNotionに追加する想定）
			// 追加後に最新データを取得
			await fetchIngredients();
		},
		update: async (id: string, updatedIngredient: Partial<Ingredient>) => {
			if (!browser) return;

			// 在庫数のみ更新可能
			if (updatedIngredient.stockQuantity !== undefined) {
				try {
					const response = await fetch('/api/notion/ingredients', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							updates: [{ id, newStock: updatedIngredient.stockQuantity }]
						})
					});

					if (!response.ok) {
						throw new Error('Failed to update ingredient');
					}

					// 更新後に最新データを取得
					await fetchIngredients();
				} catch (error) {
					console.error('[Ingredients] 更新エラー:', error);
					throw error;
				}
			} else {
			}
		},
		remove: async (id: string) => {
		},
		reduceStock: async (ingredientId: string, quantity: number) => {
			if (!browser) return;

			try {
				// 現在のストアから在庫を取得
				let currentIngredients: Ingredient[] = [];
				const unsubscribe = subscribe((value) => {
					currentIngredients = value;
				});
				unsubscribe();

				const ingredient = currentIngredients.find((i) => i.id === ingredientId);
				if (!ingredient) {
					throw new Error('Ingredient not found');
				}

				const currentStock = ingredient.stockQuantity || 0;
				const newStock = Math.max(0, currentStock - quantity);

				// Notionに更新
				const response = await fetch('/api/notion/ingredients', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						updates: [{ id: ingredientId, newStock }]
					})
				});

				if (!response.ok) {
					throw new Error('Failed to reduce stock');
				}


				// 更新後に最新データを取得
				await fetchIngredients();
			} catch (error) {
				console.error('[Ingredients] 在庫減算エラー:', error);
				throw error;
			}
		},
		reset: async () => {
		},
		destroy: () => {
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
		}
	};
}

export const ingredients = createIngredientsNotionStore();

// 統計情報の派生ストア
export const ingredientStats = derived(ingredients, ($ingredients): IngredientStats => {
	const totalIngredients = $ingredients.length;
	const lowStockIngredients = $ingredients.filter(
		(i) => i.stockQuantity > 0 && i.stockQuantity <= i.minStockLevel
	).length;
	const outOfStockIngredients = $ingredients.filter((i) => i.stockQuantity === 0).length;
	const totalValue = $ingredients.reduce((sum, i) => sum + (i.unitPrice || 0) * i.stockQuantity, 0);

	return {
		totalIngredients,
		lowStockIngredients,
		outOfStockIngredients,
		totalValue
	};
});
