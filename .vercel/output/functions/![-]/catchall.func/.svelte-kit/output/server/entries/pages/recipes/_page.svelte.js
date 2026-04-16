import { e as ensure_array_like, h as escape_html, d as attr } from "../../../chunks/renderer.js";
import { d as darkMode, B as Button, S as Sun, M as Moon, C as Card, a as CardContent } from "../../../chunks/darkMode.js";
import { C as CardHeader, a as CardTitle, B as Badge } from "../../../chunks/Badge.js";
import { r as recipes, u as unregisteredProducts } from "../../../chunks/unregistered.firestore.js";
import { i as ingredients } from "../../../chunks/ingredients.firestore.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import { P as Plus } from "../../../chunks/plus.js";
import { C as Chef_hat } from "../../../chunks/chef-hat.js";
import { S as Square_pen, T as Trash_2 } from "../../../chunks/trash-2.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let currentRecipes = [];
    let currentIngredients = [];
    let isDarkMode = false;
    let showAddModal = false;
    let editingRecipe = null;
    let prefilledProductName = "";
    let modalFormData = { productName: "", ingredients: [] };
    recipes.subscribe((value) => {
      currentRecipes = value;
    });
    ingredients.subscribe((value) => {
      currentIngredients = value;
    });
    darkMode.subscribe((value) => {
      isDarkMode = value;
    });
    function toggleDarkMode() {
      darkMode.toggle();
    }
    function handleDelete(id) {
      if (confirm("このレシピを削除してもよろしいですか?")) {
        recipes.remove(id);
      }
    }
    function closeModal() {
      showAddModal = false;
      editingRecipe = null;
      prefilledProductName = "";
    }
    function openAddModal() {
      modalFormData = { productName: prefilledProductName || "", ingredients: [] };
      showAddModal = true;
    }
    function openEditModal(recipe) {
      modalFormData = {
        productName: recipe.productName,
        ingredients: recipe.ingredients.map((ing) => ({ ingredientName: ing.ingredientName, quantity: ing.quantity }))
      };
      editingRecipe = recipe;
    }
    function addIngredientToRecipe() {
      modalFormData.ingredients = [
        ...modalFormData.ingredients,
        { ingredientName: "", quantity: 0 }
      ];
    }
    function removeIngredientFromRecipe(index) {
      modalFormData.ingredients = modalFormData.ingredients.filter((_, i) => i !== index);
    }
    async function handleSaveRecipe() {
      if (!modalFormData.productName || modalFormData.ingredients.length === 0) {
        alert("商品名と原材料を入力してください。");
        return;
      }
      const recipeIngredients = [];
      for (const ing of modalFormData.ingredients) {
        if (!ing.ingredientName || ing.quantity <= 0) {
          continue;
        }
        const existingIngredient = currentIngredients.find((i) => i.name === ing.ingredientName);
        if (!existingIngredient) {
          alert(`原材料「${ing.ingredientName}」が見つかりません。先に原材料マスタに登録してください。`);
          return;
        }
        console.log("[Recipes] 原材料を使用:", existingIngredient.name, "ID:", existingIngredient.id);
        recipeIngredients.push({
          ingredientId: existingIngredient.id,
          ingredientName: existingIngredient.name,
          quantity: ing.quantity,
          unit: existingIngredient.unit
        });
      }
      if (recipeIngredients.length === 0) {
        alert("有効な原材料を追加してください。");
        return;
      }
      if (editingRecipe) {
        await recipes.update(editingRecipe.id, {
          productName: modalFormData.productName,
          ingredients: recipeIngredients
        });
        console.log("[Recipes] レシピ更新完了:", modalFormData.productName);
      } else {
        const newRecipe = {
          productName: modalFormData.productName,
          ingredients: recipeIngredients,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await recipes.add(newRecipe);
        console.log("[Recipes] 未登録商品リストから削除:", modalFormData.productName);
        await unregisteredProducts.remove(modalFormData.productName);
      }
      closeModal();
    }
    $$renderer2.push(`<div class="min-h-screen bg-background"><div class="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8"><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 sm:pb-6 gap-4 ml-14 sm:ml-0"><div><h1 class="text-2xl sm:text-3xl font-semibold tracking-tight">登録済み商品</h1> <p class="text-muted-foreground mt-1 text-xs sm:text-sm">商品ごとのレシピを管理</p></div> <div class="flex items-center gap-2">`);
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
      onclick: openAddModal,
      class: "touch-manipulation",
      children: ($$renderer3) => {
        Plus($$renderer3, { class: "h-4 w-4" });
        $$renderer3.push(`<!----> <span class="hidden sm:inline">商品を追加</span>`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></div></div> <div class="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">`);
    if (currentRecipes.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="col-span-full">`);
      Card($$renderer2, {
        children: ($$renderer3) => {
          CardContent($$renderer3, {
            class: "py-12 text-center text-muted-foreground",
            children: ($$renderer4) => {
              $$renderer4.push(`<!---->登録済み商品がありません。商品を追加してください。`);
            }
          });
        }
      });
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(currentRecipes);
      for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
        let recipe = each_array[$$index_1];
        Card($$renderer2, {
          children: ($$renderer3) => {
            CardHeader($$renderer3, {
              children: ($$renderer4) => {
                $$renderer4.push(`<div class="flex items-start justify-between"><div class="flex items-center gap-2">`);
                Chef_hat($$renderer4, { class: "h-5 w-5 text-primary" });
                $$renderer4.push(`<!----> `);
                CardTitle($$renderer4, {
                  class: "text-lg",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->${escape_html(recipe.productName)}`);
                  }
                });
                $$renderer4.push(`<!----></div> <div class="flex gap-1">`);
                Button($$renderer4, {
                  variant: "ghost",
                  size: "sm",
                  onclick: () => openEditModal(recipe),
                  children: ($$renderer5) => {
                    Square_pen($$renderer5, { class: "h-4 w-4" });
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----> `);
                Button($$renderer4, {
                  variant: "ghost",
                  size: "sm",
                  onclick: () => handleDelete(recipe.id),
                  children: ($$renderer5) => {
                    Trash_2($$renderer5, { class: "h-4 w-4 text-red-500" });
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----></div></div>`);
              }
            });
            $$renderer3.push(`<!----> `);
            CardContent($$renderer3, {
              children: ($$renderer4) => {
                $$renderer4.push(`<div class="space-y-2"><p class="text-sm font-medium text-muted-foreground">原材料:</p> <!--[-->`);
                const each_array_1 = ensure_array_like(recipe.ingredients);
                for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
                  let ingredient = each_array_1[$$index];
                  $$renderer4.push(`<div class="flex justify-between items-center text-sm"><span>${escape_html(ingredient.ingredientName)}</span> `);
                  Badge($$renderer4, {
                    variant: "outline",
                    children: ($$renderer5) => {
                      $$renderer5.push(`<!---->${escape_html(ingredient.quantity)} ${escape_html(ingredient.unit)}`);
                    }
                  });
                  $$renderer4.push(`<!----></div>`);
                }
                $$renderer4.push(`<!--]--></div>`);
              }
            });
            $$renderer3.push(`<!---->`);
          }
        });
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div></div> `);
    if (showAddModal || editingRecipe) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="button" tabindex="-1">`);
      Card($$renderer2, {
        class: "w-full max-w-2xl max-h-[90vh] overflow-y-auto",
        children: ($$renderer3) => {
          CardHeader($$renderer3, {
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="flex items-center justify-between">`);
              CardTitle($$renderer4, {
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->${escape_html(editingRecipe ? "商品の原材料を編集" : "商品の原材料を追加")}`);
                }
              });
              $$renderer4.push(`<!----> `);
              Button($$renderer4, {
                variant: "ghost",
                size: "icon",
                onclick: closeModal,
                children: ($$renderer5) => {
                  $$renderer5.push(`<span class="text-lg">×</span>`);
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!----></div>`);
            }
          });
          $$renderer3.push(`<!----> `);
          CardContent($$renderer3, {
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="space-y-4"><div><label for="productName" class="block text-sm font-medium mb-1">商品名<span class="text-red-500">*</span></label> <input id="productName" type="text"${attr("value", modalFormData.productName)} required="" class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <div><div class="flex items-center justify-between mb-2"><div class="block text-sm font-medium">原材料<span class="text-red-500">*</span></div> `);
              Button($$renderer4, {
                variant: "outline",
                size: "sm",
                onclick: addIngredientToRecipe,
                children: ($$renderer5) => {
                  Plus($$renderer5, { class: "h-4 w-4" });
                  $$renderer5.push(`<!----> 追加`);
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!----></div> <div class="space-y-2">`);
              if (currentIngredients.length === 0) {
                $$renderer4.push("<!--[0-->");
                $$renderer4.push(`<div class="text-sm text-muted-foreground p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md"><p class="font-medium">原材料が登録されていません</p> <p class="mt-1">先に「原材料マスタ」ページで原材料を登録してください。</p> `);
                Button($$renderer4, {
                  variant: "outline",
                  size: "sm",
                  class: "mt-2",
                  onclick: () => window.location.href = "/ingredients",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->原材料マスタへ`);
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----></div>`);
              } else if (modalFormData.ingredients.length === 0) {
                $$renderer4.push("<!--[1-->");
                $$renderer4.push(`<p class="text-sm text-muted-foreground">原材料を追加してください。</p>`);
              } else {
                $$renderer4.push("<!--[-1-->");
                $$renderer4.push(`<!--[-->`);
                const each_array_2 = ensure_array_like(modalFormData.ingredients);
                for (let index = 0, $$length = each_array_2.length; index < $$length; index++) {
                  let ingredient = each_array_2[index];
                  const selectedIngredient = currentIngredients.find((i) => i.name === ingredient.ingredientName);
                  $$renderer4.push(`<div class="grid grid-cols-12 gap-2 items-center">`);
                  $$renderer4.select(
                    {
                      value: ingredient.ingredientName,
                      required: true,
                      class: "col-span-6 px-3 py-2 border border-input rounded-md bg-background"
                    },
                    ($$renderer5) => {
                      $$renderer5.option({ value: "" }, ($$renderer6) => {
                        $$renderer6.push(`原材料を選択`);
                      });
                      $$renderer5.push(`<!--[-->`);
                      const each_array_3 = ensure_array_like(currentIngredients);
                      for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
                        let ing = each_array_3[$$index_2];
                        $$renderer5.option({ value: ing.name }, ($$renderer6) => {
                          $$renderer6.push(`${escape_html(ing.name)}`);
                        });
                      }
                      $$renderer5.push(`<!--]-->`);
                    }
                  );
                  $$renderer4.push(` <input type="number"${attr("value", ingredient.quantity)} min="0" step="0.01" placeholder="使用量" required="" class="col-span-3 px-3 py-2 border border-input rounded-md bg-background"/> <div class="col-span-2 text-sm text-muted-foreground">${escape_html(selectedIngredient?.unit || "-")}</div> `);
                  Button($$renderer4, {
                    variant: "ghost",
                    size: "sm",
                    class: "col-span-1",
                    onclick: () => removeIngredientFromRecipe(index),
                    children: ($$renderer5) => {
                      Trash_2($$renderer5, { class: "h-4 w-4 text-red-500" });
                    },
                    $$slots: { default: true }
                  });
                  $$renderer4.push(`<!----></div>`);
                }
                $$renderer4.push(`<!--]-->`);
              }
              $$renderer4.push(`<!--]--></div></div> <div class="flex justify-end gap-2 pt-4">`);
              Button($$renderer4, {
                type: "button",
                variant: "outline",
                onclick: closeModal,
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->キャンセル`);
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!----> `);
              Button($$renderer4, {
                type: "button",
                onclick: handleSaveRecipe,
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->保存`);
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!----></div></div>`);
            }
          });
          $$renderer3.push(`<!---->`);
        }
      });
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
