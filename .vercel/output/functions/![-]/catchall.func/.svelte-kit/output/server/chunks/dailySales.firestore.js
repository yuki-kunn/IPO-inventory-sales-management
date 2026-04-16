import { w as writable } from "./utils2.js";
import "firebase/app";
import "firebase/firestore";
function createDailySalesFirestoreStore() {
  const { subscribe, set } = writable([]);
  return {
    subscribe,
    addOrUpdate: async (salesDate, salesData, unregisteredCount = 0) => {
      {
        console.log("[DailySales] ブラウザまたはDBが利用不可 - addOrUpdate");
        return;
      }
    },
    markAsProcessed: async (date, unregisteredCount, processedProducts) => {
      {
        console.log("[DailySales] ブラウザまたはDBが利用不可 - markAsProcessed");
        return;
      }
    },
    remove: async (date) => {
      return;
    },
    clear: async () => {
      return;
    },
    getByDate: async (date) => {
      {
        console.log("[DailySales] ブラウザまたはDBが利用不可 - getByDate");
        return null;
      }
    },
    destroy: () => {
    }
  };
}
const dailySales = createDailySalesFirestoreStore();
export {
  dailySales as d
};
