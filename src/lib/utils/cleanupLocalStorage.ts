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


	let removedCount = 0;
	for (const key of keysToRemove) {
		const value = localStorage.getItem(key);
		if (value !== null) {
			localStorage.removeItem(key);
			removedCount++;
		}
	}

	if (removedCount > 0) {
	} else {
	}
}
