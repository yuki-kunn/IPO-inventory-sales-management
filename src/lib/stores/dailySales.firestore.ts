import { writable } from 'svelte/store';
import type { DailySales, SalesData } from '$lib/types';
import { db } from '$lib/firebase';
import {
	collection,
	doc,
	getDoc,
	getDocs,
	setDoc,
	updateDoc,
	deleteDoc,
	onSnapshot,
	Timestamp
} from 'firebase/firestore';
import { browser } from '$app/environment';

const COLLECTION_NAME = 'dailySales';

// Firestoreのストア
function createDailySalesFirestoreStore() {
	const { subscribe, set } = writable<DailySales[]>([]);

	let unsubscribe: (() => void) | null = null;

	// Firestoreのリアルタイムリスナーをセットアップ
	function initListener() {
		if (!browser || !db) {
			console.log('[DailySales] ブラウザまたはDBが利用不可');
			return;
		}

		console.log('[DailySales] リスナーを初期化中...');
		const collectionRef = collection(db, COLLECTION_NAME);

		unsubscribe = onSnapshot(collectionRef, (snapshot) => {
			const dailySales: DailySales[] = [];
			snapshot.forEach((doc) => {
				const data = doc.data();
				dailySales.push({
					id: doc.id,
					date: data.date,
					totalSales: data.totalSales || 0,
					totalProfit: data.totalProfit || 0,
					totalQuantity: data.totalQuantity || 0,
					productCount: data.productCount || 0,
					sales: data.sales || [],
					inventoryProcessed: data.inventoryProcessed || false,
					unregisteredCount: data.unregisteredCount || 0,
					processedProducts: data.processedProducts || [],
					weather: data.weather || '',
					createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
					updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
				});
			});

			// 日付の降順でソート
			dailySales.sort((a, b) => {
				return new Date(b.date).getTime() - new Date(a.date).getTime();
			});

			console.log('[DailySales] データ更新:', dailySales.length, '日分');
			dailySales.forEach((ds) => {
				console.log(
					'[DailySales]  -',
					ds.date,
					'売上:',
					ds.totalSales.toLocaleString(),
					'円',
					'商品数:',
					ds.productCount
				);
			});

			set(dailySales);
		});
	}

	// ブラウザ環境でリスナーを初期化
	if (browser && db) {
		initListener();
	}

	return {
		subscribe,
		addOrUpdate: async (
			salesDate: string,
			salesData: SalesData[],
			unregisteredCount: number = 0
		) => {
			if (!browser || !db) {
				console.log('[DailySales] ブラウザまたはDBが利用不可 - addOrUpdate');
				return;
			}

			try {
				console.log(
					'[DailySales] 日別売上を追加/更新:',
					salesDate,
					'件数:',
					salesData.length,
					'未登録:',
					unregisteredCount
				);

				// 集計
				const totalSales = salesData.reduce((sum, s) => sum + s.totalSales, 0);
				const totalProfit = salesData.reduce((sum, s) => sum + s.grossProfit, 0);
				const totalQuantity = salesData.reduce((sum, s) => sum + s.soldQuantity, 0);
				const productCount = salesData.length;

				const dailySalesRef = doc(db, COLLECTION_NAME, salesDate);
				const existingDoc = await getDoc(dailySalesRef);

				if (existingDoc.exists()) {
					// 既存のデータがある場合は上書き
					console.log('[DailySales] 既存データを更新:', salesDate);
					await setDoc(dailySalesRef, {
						date: salesDate,
						totalSales,
						totalProfit,
						totalQuantity,
						productCount,
						sales: salesData,
						inventoryProcessed: existingDoc.data().inventoryProcessed || false,
						unregisteredCount,
						processedProducts: existingDoc.data().processedProducts || [],
						weather: existingDoc.data().weather || '',
						createdAt: existingDoc.data().createdAt || Timestamp.now(),
						updatedAt: Timestamp.now()
					});
				} else {
					// 新規作成
					console.log('[DailySales] 新規データを作成:', salesDate);
					await setDoc(dailySalesRef, {
						date: salesDate,
						totalSales,
						totalProfit,
						totalQuantity,
						productCount,
						sales: salesData,
						inventoryProcessed: false,
						unregisteredCount,
						weather: '',
						processedProducts: [],
						createdAt: Timestamp.now(),
						updatedAt: Timestamp.now()
					});
				}

				console.log('[DailySales] 保存成功:', salesDate);
			} catch (error) {
				console.error('[DailySales] 保存失敗:', error);
				throw error;
			}
		},
		markAsProcessed: async (
			date: string,
			unregisteredCount: number,
			processedProducts: string[]
		) => {
			if (!browser || !db) {
				console.log('[DailySales] ブラウザまたはDBが利用不可 - markAsProcessed');
				return;
			}

			try {
				console.log(
					'[DailySales] 処理済みとしてマーク:',
					date,
					'処理商品数:',
					processedProducts.length
				);
				const dailySalesRef = doc(db, COLLECTION_NAME, date);
				await updateDoc(dailySalesRef, {
					inventoryProcessed: true,
					unregisteredCount,
					processedProducts,
					updatedAt: Timestamp.now()
				});
				console.log('[DailySales] マーク成功:', date);
			} catch (error) {
				console.error('[DailySales] マーク失敗:', error);
				throw error;
			}
		},
		updateWeather: async (date: string, weather: string) => {
			if (!browser || !db) {
				console.log('[DailySales] ブラウザまたはDBが利用不可 - updateWeather');
				return;
			}

			try {
				console.log('[DailySales] 天候を更新:', date, '天候:', weather);
				const dailySalesRef = doc(db, COLLECTION_NAME, date);
				await updateDoc(dailySalesRef, {
					weather,
					updatedAt: Timestamp.now()
				});
				console.log('[DailySales] 天候更新成功:', date);
			} catch (error) {
				console.error('[DailySales] 天候更新失敗:', error);
				throw error;
			}
		},
		remove: async (date: string) => {
			if (!browser || !db) return;

			try {
				console.log('[DailySales] 削除:', date);
				await deleteDoc(doc(db, COLLECTION_NAME, date));
				console.log('[DailySales] 削除成功:', date);
			} catch (error) {
				console.error('[DailySales] 削除失敗:', error);
				throw error;
			}
		},
		clear: async () => {
			if (!browser || !db) return;

			try {
				const snapshot = await getDocs(collection(db, COLLECTION_NAME));
				const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
				await Promise.all(deletePromises);
			} catch (error) {
				console.error('[DailySales] クリア失敗:', error);
				throw error;
			}
		},
		getByDate: async (date: string): Promise<DailySales | null> => {
			if (!browser || !db) {
				console.log('[DailySales] ブラウザまたはDBが利用不可 - getByDate');
				return null;
			}

			try {
				const dailySalesRef = doc(db, COLLECTION_NAME, date);
				const dailySalesDoc = await getDoc(dailySalesRef);

				if (dailySalesDoc.exists()) {
					const data = dailySalesDoc.data();
					return {
						id: dailySalesDoc.id,
						date: data.date,
						totalSales: data.totalSales || 0,
						totalProfit: data.totalProfit || 0,
						totalQuantity: data.totalQuantity || 0,
						productCount: data.productCount || 0,
						sales: data.sales || [],
						inventoryProcessed: data.inventoryProcessed || false,
						unregisteredCount: data.unregisteredCount || 0,
						processedProducts: data.processedProducts || [],
						weather: data.weather || '',
						createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
						updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
					};
				}

				return null;
			} catch (error) {
				console.error('[DailySales] 取得失敗:', error);
				return null;
			}
		},
		destroy: () => {
			if (unsubscribe) {
				unsubscribe();
			}
		}
	};
}

export const dailySales = createDailySalesFirestoreStore();
