import { w as writable } from "./utils2.js";
import "firebase/app";
import "firebase/firestore";
function createRecipesFirestoreStore() {
  const { subscribe, set } = writable([]);
  return {
    subscribe,
    add: async (recipe) => {
      return;
    },
    update: async (id, updatedRecipe) => {
      return;
    },
    remove: async (id) => {
      return;
    },
    findByProductName: async (productName) => {
      return void 0;
    },
    reset: async () => {
      return;
    },
    destroy: () => {
    }
  };
}
const recipes = createRecipesFirestoreStore();
function createUnregisteredProductsFirestoreStore() {
  const { subscribe, set } = writable([]);
  return {
    subscribe,
    addOrUpdate: async (productName, soldQuantity, salesDate) => {
      {
        console.log("[UnregisteredProducts] ブラウザまたはDBが利用不可 - addOrUpdate");
        return;
      }
    },
    remove: async (productName) => {
      {
        console.log("[UnregisteredProducts] ブラウザまたはDBが利用不可 - remove");
        return;
      }
    },
    clear: async () => {
      return;
    },
    destroy: () => {
    }
  };
}
const unregisteredProducts = createUnregisteredProductsFirestoreStore();
export {
  recipes as r,
  unregisteredProducts as u
};
