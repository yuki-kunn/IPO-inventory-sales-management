import { writable } from 'svelte/store';
import type { UnregisteredProduct } from '$lib/types';
import { db } from '$lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { browser } from '$app/environment';

const COLLECTION_NAME = 'unregisteredProducts';

// Firestoreのストア
function createUnregisteredProductsFirestoreStore() {
  const { subscribe, set } = writable<UnregisteredProduct[]>([]);

  let unsubscribe: (() => void) | null = null;

  // Firestoreのリアルタイムリスナーをセットアップ
  function initListener() {
    if (!browser || !db) {
      console.log('[UnregisteredProducts] ブラウザまたはDBが利用不可');
      return;
    }

    console.log('[UnregisteredProducts] リスナーを初期化中...');
    const collectionRef = collection(db, COLLECTION_NAME);

    unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const products: UnregisteredProduct[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          products.push({
            productName: doc.id,
            soldQuantity: data.soldQuantity,
            salesDates: data.salesDates || [],
            firstSeenAt: data.firstSeenAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            lastSeenAt: data.lastSeenAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          });
        });

        // クライアント側でソート
        products.sort((a, b) => {
          return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
        });

        console.log('[UnregisteredProducts] データ更新:', products.length, '件');
        set(products);
      },
      (error) => {
        console.error('[UnregisteredProducts] リスナーエラー:', error);
      }
    );
  }

  // ブラウザ環境でリスナーを初期化
  if (browser && db) {
    initListener();
  }

  return {
    subscribe,
    addOrUpdate: async (productName: string, soldQuantity: number, salesDate: string) => {
      if (!browser || !db) {
        console.log('[UnregisteredProducts] ブラウザまたはDBが利用不可 - addOrUpdate');
        return;
      }

      try {
        console.log('[UnregisteredProducts] addOrUpdate:', productName, soldQuantity, '日付:', salesDate);
        const productRef = doc(db, COLLECTION_NAME, productName);
        const productDoc = await getDoc(productRef);
        const now = Timestamp.now();

        if (productDoc.exists()) {
          // 既存の商品を更新
          const currentData = productDoc.data();
          const existingSalesDates = currentData.salesDates || [];
          const updatedSalesDates = existingSalesDates.includes(salesDate)
            ? existingSalesDates
            : [...existingSalesDates, salesDate];

          await setDoc(productRef, {
            soldQuantity: (currentData.soldQuantity || 0) + soldQuantity,
            salesDates: updatedSalesDates,
            firstSeenAt: currentData.firstSeenAt || now,
            lastSeenAt: now,
          });
          console.log('[UnregisteredProducts] 既存商品を更新:', productName, '売上日:', updatedSalesDates);
        } else {
          // 新規追加
          await setDoc(productRef, {
            soldQuantity,
            salesDates: [salesDate],
            firstSeenAt: now,
            lastSeenAt: now,
          });
          console.log('[UnregisteredProducts] 新規商品を追加:', productName, '売上日:', salesDate);
        }
      } catch (error) {
        console.error('[UnregisteredProducts] Failed to add/update:', error);
        throw error;
      }
    },
    remove: async (productName: string) => {
      if (!browser || !db) {
        console.log('[UnregisteredProducts] ブラウザまたはDBが利用不可 - remove');
        return;
      }

      try {
        console.log('[UnregisteredProducts] 削除:', productName);
        await deleteDoc(doc(db, COLLECTION_NAME, productName));
        console.log('[UnregisteredProducts] 削除成功:', productName);
      } catch (error) {
        console.error('[UnregisteredProducts] 削除失敗:', error);
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
        console.error('Failed to clear unregistered products:', error);
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

export const unregisteredProducts = createUnregisteredProductsFirestoreStore();
