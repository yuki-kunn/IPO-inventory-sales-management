/**
 * 通貨フォーマット（円表示）
 */
export function formatCurrency(value: number): string {
	return `¥${Math.round(value).toLocaleString()}`;
}

/**
 * パーセンテージフォーマット
 */
export function formatPercentage(value: number): string {
	return `${value.toFixed(1)}%`;
}

/**
 * 日付フォーマット（月/日）
 */
export function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return `${date.getMonth() + 1}/${date.getDate()}`;
}
