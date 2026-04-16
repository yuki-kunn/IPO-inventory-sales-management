import { s as sanitize_props, a as spread_props, b as slot, h as escape_html, e as ensure_array_like } from "../../../chunks/renderer.js";
import { d as darkMode, B as Button, S as Sun, M as Moon, C as Card, a as CardContent } from "../../../chunks/darkMode.js";
import { C as CardHeader, a as CardTitle, B as Badge } from "../../../chunks/Badge.js";
import { u as unregisteredProducts, r as recipes } from "../../../chunks/unregistered.firestore.js";
import { d as dailySales } from "../../../chunks/dailySales.firestore.js";
import { g as get } from "../../../chunks/utils2.js";
import { i as ingredients } from "../../../chunks/ingredients.firestore.js";
import { P as Plus } from "../../../chunks/plus.js";
import { I as Icon } from "../../../chunks/Icon.js";
function Circle_alert($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.469.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["line", { "x1": "12", "x2": "12", "y1": "8", "y2": "12" }],
    [
      "line",
      { "x1": "12", "x2": "12.01", "y1": "16", "y2": "16" }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "circle-alert" },
    $$sanitized_props,
    {
      /**
       * @component @name CircleAlert
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8bGluZSB4MT0iMTIiIHgyPSIxMiIgeTE9IjgiIHkyPSIxMiIgLz4KICA8bGluZSB4MT0iMTIiIHgyPSIxMi4wMSIgeTE9IjE2IiB5Mj0iMTYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/circle-alert
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Refresh_cw($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.469.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "path",
      { "d": "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }
    ],
    ["path", { "d": "M21 3v5h-5" }],
    [
      "path",
      { "d": "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }
    ],
    ["path", { "d": "M8 16H3v5" }]
  ];
  Icon($$renderer, spread_props([
    { name: "refresh-cw" },
    $$sanitized_props,
    {
      /**
       * @component @name RefreshCw
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMyAxMmE5IDkgMCAwIDEgOS05IDkuNzUgOS43NSAwIDAgMSA2Ljc0IDIuNzRMMjEgOCIgLz4KICA8cGF0aCBkPSJNMjEgM3Y1aC01IiAvPgogIDxwYXRoIGQ9Ik0yMSAxMmE5IDkgMCAwIDEtOSA5IDkuNzUgOS43NSAwIDAgMS02Ljc0LTIuNzRMMyAxNiIgLz4KICA8cGF0aCBkPSJNOCAxNkgzdjUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/refresh-cw
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
const IGNORED_PRODUCTS = ["男性", "女性"];
async function processSalesData(salesData, salesDate, alreadyProcessedProducts = []) {
  const result = {
    processedProducts: [],
    unregisteredProducts: [],
    totalProcessed: 0,
    totalUnregistered: 0
  };
  const currentRecipes = get(recipes);
  get(ingredients);
  console.log("[processSalesData] 処理開始:", {
    salesDataCount: salesData.length,
    recipesCount: currentRecipes.length,
    alreadyProcessedCount: alreadyProcessedProducts.length
  });
  for (const sale of salesData) {
    if (IGNORED_PRODUCTS.includes(sale.productName)) {
      console.log("[processSalesData] 無視する商品:", sale.productName);
      continue;
    }
    if (alreadyProcessedProducts.includes(sale.productName)) {
      console.log("[processSalesData] すでに処理済みの商品をスキップ:", sale.productName);
      continue;
    }
    const recipe = currentRecipes.find((r) => r.productName === sale.productName);
    console.log("[processSalesData] 商品:", sale.productName, "レシピ:", recipe ? "登録済み" : "未登録");
    if (recipe && recipe.ingredients.length > 0) {
      const ingredientsReduced = [];
      for (const recipeIngredient of recipe.ingredients) {
        const totalReduction = recipeIngredient.quantity * sale.soldQuantity;
        await ingredients.reduceStock(recipeIngredient.ingredientId, totalReduction);
        ingredientsReduced.push({
          ingredientName: recipeIngredient.ingredientName,
          reducedQuantity: totalReduction
        });
      }
      result.processedProducts.push({
        productName: sale.productName,
        soldQuantity: sale.soldQuantity,
        ingredientsReduced
      });
      result.totalProcessed++;
    } else {
      const dateToUse = salesDate || sale.salesDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      console.log("[processSalesData] 未登録商品を追加:", sale.productName, "販売数:", sale.soldQuantity, "日付:", dateToUse);
      await unregisteredProducts.addOrUpdate(sale.productName, sale.soldQuantity, dateToUse);
      const unregisteredProduct = {
        productName: sale.productName,
        soldQuantity: sale.soldQuantity,
        firstSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastSeenAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      result.unregisteredProducts.push(unregisteredProduct);
      result.totalUnregistered++;
    }
  }
  console.log("[processSalesData] 処理完了:", {
    totalProcessed: result.totalProcessed,
    totalUnregistered: result.totalUnregistered
  });
  return result;
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let products = [];
    let isDarkMode = false;
    let reprocessing = {};
    unregisteredProducts.subscribe((value) => {
      products = value;
    });
    darkMode.subscribe((value) => {
      isDarkMode = value;
    });
    function toggleDarkMode() {
      darkMode.toggle();
    }
    function handleRegisterProduct(productName) {
      window.location.href = `/recipes?productName=${encodeURIComponent(productName)}`;
    }
    function handleRemoveProduct(productName) {
      if (confirm(`「${productName}」を未登録リストから削除しますか?`)) {
        unregisteredProducts.remove(productName);
      }
    }
    async function handleReprocessDate(date) {
      if (reprocessing[date]) return;
      if (!confirm(`${date}の売上データを再計算します。
登録済みレシピに基づいて原材料在庫を再度減算します。
よろしいですか？`)) {
        return;
      }
      try {
        reprocessing[date] = true;
        console.log("[UnregisteredProducts] 再計算開始:", date);
        const dailyData = await dailySales.getByDate(date);
        if (!dailyData || !dailyData.sales || dailyData.sales.length === 0) {
          alert(`${date}の売上データが見つかりません。`);
          return;
        }
        console.log("[UnregisteredProducts] 売上データ取得:", dailyData.sales.length, "件");
        const alreadyProcessed = dailyData.processedProducts || [];
        console.log("[UnregisteredProducts] すでに処理済みの商品:", alreadyProcessed);
        const result = await processSalesData(dailyData.sales, date, alreadyProcessed);
        console.log("[UnregisteredProducts] 再計算完了:", result);
        const newlyProcessedProducts = result.processedProducts.map((p) => p.productName);
        const allProcessedProducts = [.../* @__PURE__ */ new Set([...alreadyProcessed, ...newlyProcessedProducts])];
        await dailySales.markAsProcessed(date, result.totalUnregistered, allProcessedProducts);
        alert(`${date}の売上データを再計算しました。

今回処理: ${result.totalProcessed}件
未登録: ${result.totalUnregistered}件
総処理済み: ${allProcessedProducts.length}件`);
      } catch (error) {
        console.error("[UnregisteredProducts] 再計算エラー:", error);
        alert(`再計算中にエラーが発生しました: ${error}`);
      } finally {
        reprocessing[date] = false;
      }
    }
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    $$renderer2.push(`<div class="min-h-screen bg-background"><div class="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8"><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 sm:pb-6 gap-4 ml-14 sm:ml-0"><div><h1 class="text-2xl sm:text-3xl font-semibold tracking-tight">未登録商品</h1> <p class="text-muted-foreground mt-1 text-xs sm:text-sm">原材料が登録されていない商品の一覧</p></div> <div class="flex items-center gap-2">`);
    Button($$renderer2, {
      variant: "outline",
      onclick: toggleDarkMode,
      size: "icon",
      class: "touch-manipulation",
      children: ($$renderer3) => {
        if (isDarkMode) {
          $$renderer3.push("<!--[0-->");
          Sun($$renderer3, { class: "h-5 w-5" });
        } else {
          $$renderer3.push("<!--[-1-->");
          Moon($$renderer3, { class: "h-5 w-5" });
        }
        $$renderer3.push(`<!--]-->`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> `);
    Button($$renderer2, {
      onclick: () => window.location.href = "/recipes",
      class: "touch-manipulation",
      children: ($$renderer3) => {
        Plus($$renderer3, { class: "h-4 w-4" });
        $$renderer3.push(`<!----> <span class="hidden sm:inline">商品を登録</span>`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></div></div> <div class="grid gap-3 grid-cols-1 sm:grid-cols-2">`);
    Card($$renderer2, {
      children: ($$renderer3) => {
        CardHeader($$renderer3, {
          children: ($$renderer4) => {
            CardTitle($$renderer4, {
              class: "text-lg",
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->未登録商品数`);
              }
            });
          }
        });
        $$renderer3.push(`<!----> `);
        CardContent($$renderer3, {
          children: ($$renderer4) => {
            $$renderer4.push(`<div class="text-3xl font-bold">${escape_html(products.length)}</div> <p class="text-sm text-muted-foreground mt-1">レシピ登録が必要な商品</p>`);
          }
        });
        $$renderer3.push(`<!---->`);
      }
    });
    $$renderer2.push(`<!----> `);
    Card($$renderer2, {
      children: ($$renderer3) => {
        CardHeader($$renderer3, {
          children: ($$renderer4) => {
            CardTitle($$renderer4, {
              class: "text-lg",
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->原材料登録が必要`);
              }
            });
          }
        });
        $$renderer3.push(`<!----> `);
        CardContent($$renderer3, {
          children: ($$renderer4) => {
            $$renderer4.push(`<div class="text-3xl font-bold">${escape_html(products.reduce((sum, p) => sum + p.soldQuantity, 0))}</div> <p class="text-sm text-muted-foreground mt-1">未登録商品の総販売個数</p>`);
          }
        });
        $$renderer3.push(`<!---->`);
      }
    });
    $$renderer2.push(`<!----></div> `);
    if (products.length > 0) {
      $$renderer2.push("<!--[0-->");
      Card($$renderer2, {
        class: "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20",
        children: ($$renderer3) => {
          CardHeader($$renderer3, {
            children: ($$renderer4) => {
              CardTitle($$renderer4, {
                class: "text-orange-800 dark:text-orange-200 flex items-center gap-2",
                children: ($$renderer5) => {
                  Circle_alert($$renderer5, { class: "h-5 w-5" });
                  $$renderer5.push(`<!----> 原材料登録アラート`);
                }
              });
            }
          });
          $$renderer3.push(`<!----> `);
          CardContent($$renderer3, {
            children: ($$renderer4) => {
              const allSalesDates = Array.from(new Set(products.flatMap((p) => p.salesDates))).sort((a, b) => b.localeCompare(a));
              $$renderer4.push(`<p class="text-sm text-orange-700 dark:text-orange-300 mb-4">以下の商品の原材料が登録されていません。原材料在庫が正確に管理されるよう、商品の原材料を登録してください。</p> `);
              if (allSalesDates.length > 0) {
                $$renderer4.push("<!--[0-->");
                $$renderer4.push(`<div class="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800"><p class="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">原材料登録後の再計算</p> <p class="text-xs text-orange-700 dark:text-orange-300 mb-3">未登録商品に原材料を登録した後、以下の日付の売上を再計算できます。</p> <div class="flex flex-wrap gap-2"><!--[-->`);
                const each_array = ensure_array_like(allSalesDates);
                for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                  let date = each_array[$$index];
                  Button($$renderer4, {
                    variant: "outline",
                    size: "sm",
                    onclick: () => handleReprocessDate(date),
                    disabled: reprocessing[date],
                    class: "text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700",
                    children: ($$renderer5) => {
                      if (reprocessing[date]) {
                        $$renderer5.push("<!--[0-->");
                        Refresh_cw($$renderer5, { class: "h-3 w-3 mr-1 animate-spin" });
                      } else {
                        $$renderer5.push("<!--[-1-->");
                        Refresh_cw($$renderer5, { class: "h-3 w-3 mr-1" });
                      }
                      $$renderer5.push(`<!--]--> ${escape_html(date)} を再計算`);
                    },
                    $$slots: { default: true }
                  });
                }
                $$renderer4.push(`<!--]--></div></div>`);
              } else {
                $$renderer4.push("<!--[-1-->");
              }
              $$renderer4.push(`<!--]-->`);
            }
          });
          $$renderer3.push(`<!---->`);
        }
      });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    Card($$renderer2, {
      children: ($$renderer3) => {
        CardHeader($$renderer3, {
          children: ($$renderer4) => {
            CardTitle($$renderer4, {
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->未登録商品一覧`);
              }
            });
          }
        });
        $$renderer3.push(`<!----> `);
        CardContent($$renderer3, {
          children: ($$renderer4) => {
            if (products.length === 0) {
              $$renderer4.push("<!--[0-->");
              $$renderer4.push(`<div class="py-12 text-center text-muted-foreground">未登録商品はありません</div>`);
            } else {
              $$renderer4.push("<!--[-1-->");
              $$renderer4.push(`<div class="block md:hidden space-y-3 -mx-4 sm:mx-0"><!--[-->`);
              const each_array_1 = ensure_array_like(products);
              for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
                let product = each_array_1[$$index_2];
                $$renderer4.push(`<div class="border-b last:border-b-0 md:border md:rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"><div class="flex items-start justify-between"><div class="flex-1"><div class="font-medium text-base">${escape_html(product.productName)}</div> `);
                Badge($$renderer4, {
                  variant: "destructive",
                  class: "mt-1",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->未登録`);
                  }
                });
                $$renderer4.push(`<!----></div></div> <div class="grid grid-cols-2 gap-3 text-sm"><div><div class="text-xs text-muted-foreground mb-1">累計販売数</div> <div class="font-semibold">${escape_html(product.soldQuantity)}</div></div> <div><div class="text-xs text-muted-foreground mb-1">初回検出</div> <div class="text-xs">${escape_html(formatDate(product.firstSeenAt))}</div></div></div> <div><div class="text-xs text-muted-foreground mb-1">売上日</div> <div class="flex flex-wrap gap-1"><!--[-->`);
                const each_array_2 = ensure_array_like(product.salesDates);
                for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
                  let date = each_array_2[$$index_1];
                  Badge($$renderer4, {
                    variant: "outline",
                    class: "text-xs",
                    children: ($$renderer5) => {
                      $$renderer5.push(`<!---->${escape_html(date)}`);
                    }
                  });
                }
                $$renderer4.push(`<!--]--></div></div> <div class="flex justify-end gap-2 pt-2 border-t border-border">`);
                Button($$renderer4, {
                  variant: "outline",
                  size: "sm",
                  onclick: () => handleRegisterProduct(product.productName),
                  class: "touch-manipulation",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->原材料登録`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----> `);
                Button($$renderer4, {
                  variant: "ghost",
                  size: "sm",
                  onclick: () => handleRemoveProduct(product.productName),
                  class: "touch-manipulation",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->削除`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----></div></div>`);
              }
              $$renderer4.push(`<!--]--></div> <div class="hidden md:block overflow-x-auto -mx-4 sm:mx-0 sm:rounded-lg border-y sm:border border-border"><table class="min-w-full divide-y divide-border"><thead class="bg-muted/50"><tr><th class="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">商品名</th><th class="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">累計販売数</th><th class="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">売上日</th><th class="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">初回検出日時</th><th class="px-4 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">アクション</th></tr></thead><tbody class="bg-background divide-y divide-border"><!--[-->`);
              const each_array_3 = ensure_array_like(products);
              for (let $$index_4 = 0, $$length = each_array_3.length; $$index_4 < $$length; $$index_4++) {
                let product = each_array_3[$$index_4];
                $$renderer4.push(`<tr class="hover:bg-muted/50 transition-colors"><td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><div class="text-sm font-medium flex items-center gap-2">${escape_html(product.productName)} `);
                Badge($$renderer4, {
                  variant: "destructive",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->未登録`);
                  }
                });
                $$renderer4.push(`<!----></div></td><td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><div class="text-sm font-semibold">${escape_html(product.soldQuantity)}</div></td><td class="px-4 sm:px-6 py-3 sm:py-4"><div class="flex flex-wrap gap-1"><!--[-->`);
                const each_array_4 = ensure_array_like(product.salesDates);
                for (let $$index_3 = 0, $$length2 = each_array_4.length; $$index_3 < $$length2; $$index_3++) {
                  let date = each_array_4[$$index_3];
                  Badge($$renderer4, {
                    variant: "outline",
                    children: ($$renderer5) => {
                      $$renderer5.push(`<!---->${escape_html(date)}`);
                    }
                  });
                }
                $$renderer4.push(`<!--]--></div></td><td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><div class="text-sm text-muted-foreground">${escape_html(formatDate(product.firstSeenAt))}</div></td><td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium"><div class="flex justify-end gap-2">`);
                Button($$renderer4, {
                  variant: "outline",
                  size: "sm",
                  onclick: () => handleRegisterProduct(product.productName),
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->原材料登録`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----> `);
                Button($$renderer4, {
                  variant: "ghost",
                  size: "sm",
                  onclick: () => handleRemoveProduct(product.productName),
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->削除`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----></div></td></tr>`);
              }
              $$renderer4.push(`<!--]--></tbody></table></div>`);
            }
            $$renderer4.push(`<!--]-->`);
          }
        });
        $$renderer3.push(`<!---->`);
      }
    });
    $$renderer2.push(`<!----></div></div>`);
  });
}
export {
  _page as default
};
