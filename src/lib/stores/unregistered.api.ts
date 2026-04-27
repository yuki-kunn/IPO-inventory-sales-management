import { writable } from 'svelte/store';
import type { UnregisteredProduct } from '$lib/types';
import { browser } from '$app/environment';

// API経由でのunregisteredProductsストア（Firestoreへの直接アクセスなし）
function createUnregisteredProductsApiStore() {
	const { subscribe, set } = writable<UnregisteredProduct[]>([]);

	let refreshInterval: ReturnType<typeof setInterval> | null = null;

	// API経由でデータを取得
	async function fetchUnregisteredProducts() {
		if (!browser) return;

		try {
			const response = await fetch('/api/firestore/unregistered');

			if (!response.ok) {
				console.error('[Unregistered API] データ取得失敗:', response.status);
				return;
			}

			const data = await response.json();
			const products = data.products || [];

			// 日付の降順でソート
			products.sort((a: UnregisteredProduct, b: UnregisteredProduct) => {
				return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
			});

			set(products);
		} catch (error) {
			console.error('[Unregistered API] データ取得エラー:', error);
		}
	}

	// 自動更新を開始（30秒ごと）
	function initAutoRefresh() {
		if (!browser) return;

		// 初回読み込み
		fetchUnregisteredProducts();

		// 30秒ごとに更新
		refreshInterval = setInterval(() => {
			fetchUnregisteredProducts();
		}, 30000);
	}

	// ブラウザ環境で自動更新を開始
	if (browser) {
		initAutoRefresh();
	}

	return {
		subscribe,
		addOrUpdate: async (productName: string, quantity: number, date: string) => {
			if (!browser) return;

			try {

				const response = await fetch('/api/firestore/unregistered', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'addOrUpdate',
						productName,
						quantity,
						date
					})
				});

				if (!response.ok) {
					throw new Error('Failed to save unregistered product');
				}


				// データを再取得
				await fetchUnregisteredProducts();
			} catch (error) {
				console.error('[Unregistered API] 保存失敗:', error);
				throw error;
			}
		},
		remove: async (productName: string) => {
			if (!browser) return;

			try {

				const response = await fetch(
					`/api/firestore/unregistered?productName=${encodeURIComponent(productName)}`,
					{
						method: 'DELETE'
					}
				);

				if (!response.ok) {
					throw new Error('Failed to delete unregistered product');
				}


				// データを再取得
				await fetchUnregisteredProducts();
			} catch (error) {
				console.error('[Unregistered API] 削除失敗:', error);
				throw error;
			}
		},
		clear: async () => {
			// 全削除は実装しない（安全のため）
		},
		refresh: fetchUnregisteredProducts,
		destroy: () => {
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
		}
	};
}

export const unregisteredProducts = createUnregisteredProductsApiStore();
