import { d as derived, w as writable } from "./utils2.js";
import "firebase/app";
import "firebase/firestore";
function createIngredientsFirestoreStore() {
  const { subscribe, set, update } = writable([]);
  return {
    subscribe,
    add: async (ingredient) => {
      {
        console.log("[Ingredients] ブラウザまたはDBが利用不可 - add");
        return;
      }
    },
    update: async (id, updatedIngredient) => {
      {
        console.log("[Ingredients] ブラウザまたはDBが利用不可 - update");
        return;
      }
    },
    remove: async (id) => {
      return;
    },
    reduceStock: async (ingredientId, quantity) => {
      return;
    },
    reset: async () => {
      return;
    },
    destroy: () => {
    }
  };
}
const ingredients = createIngredientsFirestoreStore();
const ingredientStats = derived(ingredients, ($ingredients) => {
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
    totalValue
  };
});
export {
  ingredientStats as a,
  ingredients as i
};
