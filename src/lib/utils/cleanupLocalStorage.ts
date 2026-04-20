import { browser } from '$app/environment';

/**
 * ローカルストレージに残っている古いデータをクリーンアップする
 * Firebase Firestoreに移行したため、ローカルストレージは不要
 */
export function cleanupLocalStorage() {
	if (!browser) return;

	const keysToRemove = [
		'cafe-sales-data',
		'cafe-ingredients-data',
		'cafe-recipes-data',
		'cafe-unregistered-products'
	];

	console.log('[cleanupLocalStorage] ローカルストレージのクリーンアップを開始');

	let removedCount = 0;
	for (const key of keysToRemove) {
		const value = localStorage.getItem(key);
		if (value !== null) {
			localStorage.removeItem(key);
			removedCount++;
			console.log(`[cleanupLocalStorage] 削除: ${key}`);
		}
	}

	if (removedCount > 0) {
		console.log(
			`[cleanupLocalStorage] ${removedCount}個のローカルストレージアイテムを削除しました`
		);
	} else {
		console.log('[cleanupLocalStorage] クリーンアップ不要（データなし）');
	}
}
