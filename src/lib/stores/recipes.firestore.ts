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
	onSnapshot,
	Timestamp
} from 'firebase/firestore';
import { browser } from '$app/environment';

const COLLECTION_NAME = 'recipes';

// Firestoreのストア
function createRecipesFirestoreStore() {
	const { subscribe, set } = writable<Recipe[]>([]);

	let unsubscribe: (() => void) | null = null;

	// Firestoreのリアルタイムリスナーをセットアップ
	function initListener() {
		if (!browser || !db) {
			console.log('[Recipes] ブラウザまたはDBが利用不可');
			return;
		}

		console.log('[Recipes] リスナーを初期化中...');
		const collectionRef = collection(db, COLLECTION_NAME);

		unsubscribe = onSnapshot(collectionRef, (snapshot) => {
			const recipes: Recipe[] = [];
			snapshot.forEach((doc) => {
				const data = doc.data();
				recipes.push({
					id: doc.id,
					productName: data.productName,
					ingredients: data.ingredients || [],
					createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
					updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
				});
			});

			// クライアント側でソート（作成日時の降順）
			recipes.sort((a, b) => {
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			});

			console.log('[Recipes] データ更新:', recipes.length, '件');
			recipes.forEach((r) => {
				console.log('[Recipes]  -', r.productName, '原材料:', r.ingredients.length, '件');
			});

			set(recipes);
		});
	}

	// ブラウザ環境でリスナーを初期化
	if (browser && db) {
		initListener();
	}

	return {
		subscribe,
		add: async (recipe: Omit<Recipe, 'id'>) => {
			if (!browser || !db) return;

			try {
				console.log('[Recipes] レシピ追加:', recipe.productName);
				await addDoc(collection(db, COLLECTION_NAME), {
					...recipe,
					createdAt: Timestamp.now(),
					updatedAt: Timestamp.now()
				});
				console.log('[Recipes] レシピ追加成功:', recipe.productName);
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
			} catch (error) {
				console.error('Failed to update recipe:', error);
				throw error;
			}
		},
		remove: async (id: string) => {
			if (!browser || !db) return;

			try {
				await deleteDoc(doc(db, COLLECTION_NAME, id));
			} catch (error) {
				console.error('Failed to delete recipe:', error);
				throw error;
			}
		},
		findByProductName: async (productName: string): Promise<Recipe | undefined> => {
			if (!browser || !db) return undefined;

			try {
				const snapshot = await getDocs(collection(db, COLLECTION_NAME));
				const recipe = snapshot.docs.find((doc) => doc.data().productName === productName);
				if (!recipe) return undefined;

				const data = recipe.data();
				return {
					id: recipe.id,
					productName: data.productName,
					ingredients: data.ingredients || [],
					createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
					updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
				};
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
			} catch (error) {
				console.error('Failed to reset recipes:', error);
				throw error;
			}
		},
		destroy: () => {
			if (unsubscribe) {
				unsubscribe();
			}
		}
	};
}

export const recipes = createRecipesFirestoreStore();
