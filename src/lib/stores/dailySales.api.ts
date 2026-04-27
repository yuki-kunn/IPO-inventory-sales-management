import { writable } from 'svelte/store';
import type { DailySales, SalesData, CustomerInfo } from '$lib/types';
import { browser } from '$app/environment';

// API経由でのdailySalesストア（Firestoreへの直接アクセスなし）
function createDailySalesApiStore() {
	const { subscribe, set } = writable<DailySales[]>([]);

	let refreshInterval: ReturnType<typeof setInterval> | null = null;

	// API経由でデータを取得
	async function fetchDailySales() {
		if (!browser) return;

		try {
			const response = await fetch('/api/firestore/dailySales');

			if (!response.ok) {
				console.error('[DailySales API] データ取得失敗:', response.status);
				return;
			}

			const data = await response.json();
			const dailySales = data.dailySales || [];

			// 日付の降順でソート
			dailySales.sort((a: DailySales, b: DailySales) => {
				return new Date(b.date).getTime() - new Date(a.date).getTime();
			});

			set(dailySales);
		} catch (error) {
			console.error('[DailySales API] データ取得エラー:', error);
		}
	}

	// 自動更新を開始（30秒ごと）
	function initAutoRefresh() {
		if (!browser) return;

		// 初回読み込み
		fetchDailySales();

		// 30秒ごとに更新
		refreshInterval = setInterval(() => {
			fetchDailySales();
		}, 30000);
	}

	// ブラウザ環境で自動更新を開始
	if (browser) {
		initAutoRefresh();
	}

	return {
		subscribe,
		addOrUpdate: async (
			salesDate: string,
			salesData: SalesData[],
			unregisteredCount: number = 0,
			customerInfo?: CustomerInfo[]
		) => {
			if (!browser) return;

			try {
				const response = await fetch('/api/firestore/dailySales', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'addOrUpdate',
						date: salesDate,
						salesData,
						unregisteredCount,
						customerInfo
					})
				});

				if (!response.ok) {
					throw new Error('Failed to save daily sales');
				}


				// データを再取得
				await fetchDailySales();
			} catch (error) {
				console.error('[DailySales API] 保存失敗:', error);
				throw error;
			}
		},
		markAsProcessed: async (
			date: string,
			unregisteredCount: number,
			processedProducts: string[]
		) => {
			if (!browser) return;

			try {

				const response = await fetch('/api/firestore/dailySales', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'markAsProcessed',
						date,
						unregisteredCount,
						processedProducts
					})
				});

				if (!response.ok) {
					throw new Error('Failed to mark as processed');
				}


				// データを再取得
				await fetchDailySales();
			} catch (error) {
				console.error('[DailySales API] マーク失敗:', error);
				throw error;
			}
		},
		updateWeather: async (date: string, weather: string) => {
			if (!browser) return;

			try {

				// 天候更新用の別APIを呼ぶか、またはaddOrUpdateを利用
				// ここでは簡易的にgetして更新
				const response = await fetch(`/api/firestore/dailySales?date=${date}`);
				if (!response.ok) {
					throw new Error('Failed to fetch daily sales');
				}

				const data = await response.json();
				const dailySale = data.dailySale;

				if (!dailySale) {
					throw new Error('Daily sales not found');
				}

				// 天候情報を含めて再保存
				await fetch('/api/firestore/dailySales', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'addOrUpdate',
						date,
						salesData: dailySale.salesData || dailySale.sales || [],
						unregisteredCount: dailySale.unregisteredCount || 0,
						customerInfo: dailySale.customerInfo,
						weather // 天候情報を追加
					})
				});


				// データを再取得
				await fetchDailySales();
			} catch (error) {
				console.error('[DailySales API] 天候更新失敗:', error);
				throw error;
			}
		},
		remove: async (date: string) => {
			if (!browser) return;

			try {

				const response = await fetch(`/api/firestore/dailySales?date=${date}`, {
					method: 'DELETE'
				});

				if (!response.ok) {
					throw new Error('Failed to delete daily sales');
				}


				// データを再取得
				await fetchDailySales();
			} catch (error) {
				console.error('[DailySales API] 削除失敗:', error);
				throw error;
			}
		},
		clear: async () => {
			// 全削除は実装しない（安全のため）
		},
		getByDate: async (date: string): Promise<DailySales | null> => {
			if (!browser) return null;

			try {
				const response = await fetch(`/api/firestore/dailySales?date=${date}`);

				if (!response.ok) {
					console.error('[DailySales API] 取得失敗:', response.status);
					return null;
				}

				const data = await response.json();
				return data.dailySale || null;
			} catch (error) {
				console.error('[DailySales API] 取得失敗:', error);
				return null;
			}
		},
		refresh: fetchDailySales,
		destroy: () => {
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
		}
	};
}

export const dailySales = createDailySalesApiStore();
