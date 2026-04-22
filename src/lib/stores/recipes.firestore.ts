import { writable } from 'svelte/store';
import type { Recipe } from '$lib/types';
import { db } from '$lib/firebase';
import {
	collection,
	doc,
	getDocs,
	addDoc,
	updateDoc,
	deleteDoc,
	Timestamp
} from 'firebase/firestore';
import { browser } from '$app/environment';

const COLLECTION_NAME = 'recipes';

// Notionからレシピを取得
async function fetchRecipesFromNotion(): Promise<Recipe[]> {
	try {
		const response = await fetch('/api/notion/recipes');

		if (!response.ok) {
			throw new Error(`Notion API error: ${response.status}`);
		}

		const data = await response.json();
		return data.recipes || [];
	} catch (error) {
		console.error('[Recipes] Notionからの取得に失敗:', error);
		return [];
	}
}

// Notionのストア（Notion = マスターデータ、Firestore = トランザクション保存のみ）
function createRecipesFirestoreStore() {
	const { subscribe, set } = writable<Recipe[]>([]);

	// 初回読み込み
	async function loadRecipes() {
		if (!browser) {
			return;
		}

		const notionRecipes = await fetchRecipesFromNotion();

		// 商品名順でソート
		notionRecipes.sort((a, b) => a.productName.localeCompare(b.productName, 'ja'));

		set(notionRecipes);
	}

	// ブラウザ環境で初回読み込み
	if (browser) {
		loadRecipes();
	}

	return {
		subscribe,
		refresh: async () => {
			await loadRecipes();
		},
		add: async (recipe: Omit<Recipe, 'id'>) => {
			if (!browser || !db) return;

			try {
				await addDoc(collection(db, COLLECTION_NAME), {
					...recipe,
					createdAt: Timestamp.now(),
					updatedAt: Timestamp.now()
				});
				// 追加後、Notionから再取得して表示を更新
				await loadRecipes();
			} catch (error) {
				console.error('[Recipes] レシピ追加失敗:', error);
				throw error;
			}
		},
		update: async (id: string, updatedRecipe: Partial<Recipe>) => {
			if (!browser || !db) return;

			try {
				const recipeRef = doc(db, COLLECTION_NAME, id);
				await updateDoc(recipeRef, {
					...updatedRecipe,
					updatedAt: Timestamp.now()
				});
				// 更新後、Notionから再取得して表示を更新
				await loadRecipes();
			} catch (error) {
				console.error('[Recipes] レシピ更新失敗:', error);
				throw error;
			}
		},
		remove: async (id: string) => {
			if (!browser || !db) return;

			try {
				await deleteDoc(doc(db, COLLECTION_NAME, id));
				// 削除後、Notionから再取得して表示を更新
				await loadRecipes();
			} catch (error) {
				console.error('[Recipes] レシピ削除失敗:', error);
				throw error;
			}
		},
		findByProductName: async (productName: string): Promise<Recipe | undefined> => {
			if (!browser) return undefined;

			try {
				// Notionから検索
				const notionRecipes = await fetchRecipesFromNotion();
				return notionRecipes.find((r) => r.productName === productName);
			} catch (error) {
				console.error('Failed to find recipe:', error);
				return undefined;
			}
		},
		reset: async () => {
			if (!browser || !db) return;

			try {
				const snapshot = await getDocs(collection(db, COLLECTION_NAME));
				const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
				await Promise.all(deletePromises);
				// リセット後、Notionから再取得
				await loadRecipes();
			} catch (error) {
				console.error('Failed to reset recipes:', error);
				throw error;
			}
		}
	};
}

export const recipes = createRecipesFirestoreStore();
