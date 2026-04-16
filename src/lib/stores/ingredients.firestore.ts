import { writable, derived } from 'svelte/store';
import type { Ingredient, IngredientStats } from '$lib/types';
import { db } from '$lib/firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { browser } from '$app/environment';

const COLLECTION_NAME = 'ingredients';

// Firestoreのストア
function createIngredientsFirestoreStore() {
  const { subscribe, set, update } = writable<Ingredient[]>([]);

  let unsubscribe: (() => void) | null = null;

  // Firestoreのリアルタイムリスナーをセットアップ
  function initListener() {
    if (!browser || !db) {
      console.log('[Ingredients] ブラウザまたはDBが利用不可');
      return;
    }

    console.log('[Ingredients] リスナーを初期化中...');
    const collectionRef = collection(db, COLLECTION_NAME);

    unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const ingredients: Ingredient[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        ingredients.push({
          id: doc.id,
          name: data.name,
          unit: data.unit,
          stockQuantity: data.stockQuantity,
          minStockLevel: data.minStockLevel,
          supplier: data.supplier,
          unitPrice: data.unitPrice,
          description: data.description,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      });

      // クライアント側でソート（作成日時の降順）
      ingredients.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      console.log('[Ingredients] データ更新:', ingredients.length, '件');
      ingredients.forEach((i) => {
        console.log('[Ingredients]  -', i.name, '在庫:', i.stockQuantity, i.unit);
      });

      set(ingredients);
    });
  }

  // ブラウザ環境でリスナーを初期化
  if (browser && db) {
    initListener();
  }

  return {
    subscribe,
    add: async (ingredient: Omit<Ingredient, 'id'>) => {
      if (!browser || !db) {
        console.log('[Ingredients] ブラウザまたはDBが利用不可 - add');
        return;
      }

      try {
        console.log('[Ingredients] 原材料追加:', ingredient.name);

        // undefinedのフィールドを除外
        const data: any = {
          name: ingredient.name,
          unit: ingredient.unit,
          stockQuantity: ingredient.stockQuantity,
          minStockLevel: ingredient.minStockLevel,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        if (ingredient.supplier !== undefined) {
          data.supplier = ingredient.supplier;
        }
        if (ingredient.unitPrice !== undefined) {
          data.unitPrice = ingredient.unitPrice;
        }
        if (ingredient.description !== undefined) {
          data.description = ingredient.description;
        }

        await addDoc(collection(db, COLLECTION_NAME), data);
        console.log('[Ingredients] 原材料追加成功:', ingredient.name);
      } catch (error) {
        console.error('[Ingredients] 原材料追加失敗:', error);
        throw error;
      }
    },
    update: async (id: string, updatedIngredient: Partial<Ingredient>) => {
      if (!browser || !db) {
        console.log('[Ingredients] ブラウザまたはDBが利用不可 - update');
        return;
      }

      try {
        console.log('[Ingredients] 原材料更新:', id, updatedIngredient);

        // undefinedのフィールドを除外してFirestoreに送信
        const data: any = {
          updatedAt: Timestamp.now(),
        };

        // 必須フィールド
        if (updatedIngredient.name !== undefined) {
          data.name = updatedIngredient.name;
        }
        if (updatedIngredient.unit !== undefined) {
          data.unit = updatedIngredient.unit;
        }
        if (updatedIngredient.stockQuantity !== undefined) {
          data.stockQuantity = updatedIngredient.stockQuantity;
        }
        if (updatedIngredient.minStockLevel !== undefined) {
          data.minStockLevel = updatedIngredient.minStockLevel;
        }

        // オプションフィールド
        if (updatedIngredient.supplier !== undefined) {
          data.supplier = updatedIngredient.supplier;
        }
        if (updatedIngredient.unitPrice !== undefined) {
          data.unitPrice = updatedIngredient.unitPrice;
        }
        if (updatedIngredient.description !== undefined) {
          data.description = updatedIngredient.description;
        }

        const ingredientRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(ingredientRef, data);
        console.log('[Ingredients] 原材料更新成功:', id);
      } catch (error) {
        console.error('[Ingredients] 原材料更新失敗:', error);
        throw error;
      }
    },
    remove: async (id: string) => {
      if (!browser || !db) return;

      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      } catch (error) {
        console.error('Failed to delete ingredient:', error);
        throw error;
      }
    },
    reduceStock: async (ingredientId: string, quantity: number) => {
      if (!browser || !db) return;

      try {
        // まず現在の在庫を取得
        const ingredients = await getDocs(collection(db, COLLECTION_NAME));
        const ingredient = ingredients.docs.find((doc) => doc.id === ingredientId);

        if (ingredient) {
          const currentStock = ingredient.data().stockQuantity || 0;
          const newStock = Math.max(0, currentStock - quantity);

          const ingredientRef = doc(db, COLLECTION_NAME, ingredientId);
          await updateDoc(ingredientRef, {
            stockQuantity: newStock,
            updatedAt: Timestamp.now(),
          });
        }
      } catch (error) {
        console.error('Failed to reduce stock:', error);
        throw error;
      }
    },
    reset: async () => {
      if (!browser || !db) return;

      try {
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      } catch (error) {
        console.error('Failed to reset ingredients:', error);
        throw error;
      }
    },
    destroy: () => {
      if (unsubscribe) {
        unsubscribe();
      }
    },
  };
}

export const ingredients = createIngredientsFirestoreStore();

// 統計情報の派生ストア
export const ingredientStats = derived(ingredients, ($ingredients): IngredientStats => {
  const totalIngredients = $ingredients.length;
  const lowStockIngredients = $ingredients.filter(
    (i) => i.stockQuantity > 0 && i.stockQuantity <= i.minStockLevel
  ).length;
  const outOfStockIngredients = $ingredients.filter((i) => i.stockQuantity === 0).length;
  const totalValue = $ingredients.reduce(
    (sum, i) => sum + (i.unitPrice || 0) * i.stockQuantity,
    0
  );

  return {
    totalIngredients,
    lowStockIngredients,
    outOfStockIngredients,
    totalValue,
  };
});
