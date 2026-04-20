import type { Ingredient } from '$lib/types';

export type StockStatus = 'ok' | 'low' | 'out';

/**
 * 在庫ステータスを判定
 */
export function getStockStatus(ingredient: Ingredient): StockStatus {
	if (ingredient.stockQuantity === 0) return 'out';
	if (ingredient.stockQuantity <= ingredient.minStockLevel) return 'low';
	return 'ok';
}

/**
 * 在庫ステータスに応じたバッジの種類を取得
 */
export function getStockBadgeVariant(
	status: StockStatus
): 'default' | 'warning' | 'destructive' {
	switch (status) {
		case 'ok':
			return 'default';
		case 'low':
			return 'warning';
		case 'out':
			return 'destructive';
	}
}

/**
 * 在庫ステータスに応じたバッジのテキストを取得
 */
export function getStockBadgeText(status: StockStatus): string {
	switch (status) {
		case 'ok':
			return '正常';
		case 'low':
			return '在庫少';
		case 'out':
			return '在庫切れ';
	}
}
