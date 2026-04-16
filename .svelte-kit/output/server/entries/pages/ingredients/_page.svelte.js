import { d as attr, h as escape_html, e as ensure_array_like } from "../../../chunks/renderer.js";
import { C as Card, B as Button, a as CardContent, d as darkMode, S as Sun, M as Moon } from "../../../chunks/darkMode.js";
import { C as CardHeader, a as CardTitle, B as Badge } from "../../../chunks/Badge.js";
import { E as EditIngredientModal } from "../../../chunks/EditIngredientModal.js";
import { i as ingredients } from "../../../chunks/ingredients.firestore.js";
import { X } from "../../../chunks/x.js";
import { P as Plus } from "../../../chunks/plus.js";
import { S as Square_pen, T as Trash_2 } from "../../../chunks/trash-2.js";
function AddIngredientModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { onClose } = $$props;
    let formData = {
      name: "",
      unit: "",
      stockQuantity: 0,
      minStockLevel: 0,
      supplier: "",
      unitPrice: 0,
      description: ""
    };
    $$renderer2.push(`<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="button" tabindex="-1">`);
    Card($$renderer2, {
      class: "w-full max-w-2xl max-h-[90vh] overflow-y-auto",
      children: ($$renderer3) => {
        CardHeader($$renderer3, {
          children: ($$renderer4) => {
            $$renderer4.push(`<div class="flex items-center justify-between">`);
            CardTitle($$renderer4, {
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->原材料を追加`);
              }
            });
            $$renderer4.push(`<!----> `);
            Button($$renderer4, {
              variant: "ghost",
              size: "icon",
              onclick: onClose,
              children: ($$renderer5) => {
                X($$renderer5, { class: "h-4 w-4" });
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----></div>`);
          }
        });
        $$renderer3.push(`<!----> `);
        CardContent($$renderer3, {
          children: ($$renderer4) => {
            $$renderer4.push(`<form class="space-y-4"><div class="grid gap-4 md:grid-cols-2"><div><label for="name" class="block text-sm font-medium mb-1">原材料名<span class="text-red-500">*</span></label> <input id="name" type="text"${attr("value", formData.name)} required="" class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <div><label for="unit" class="block text-sm font-medium mb-1">単位<span class="text-red-500">*</span></label> <input id="unit" type="text"${attr("value", formData.unit)} placeholder="例: g, ml, 個" required="" class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <div><label for="stockQuantity" class="block text-sm font-medium mb-1">在庫数<span class="text-red-500">*</span></label> <input id="stockQuantity" type="number"${attr("value", formData.stockQuantity)} min="0" step="0.01" required="" class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <div><label for="minStockLevel" class="block text-sm font-medium mb-1">発注レベル<span class="text-red-500">*</span></label> <input id="minStockLevel" type="number"${attr("value", formData.minStockLevel)} min="0" step="0.01" required="" class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <div><label for="unitPrice" class="block text-sm font-medium mb-1">単価</label> <input id="unitPrice" type="number"${attr("value", formData.unitPrice)} min="0" step="0.01" class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <div><label for="supplier" class="block text-sm font-medium mb-1">仕入先</label> <input id="supplier" type="text"${attr("value", formData.supplier)} class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div></div> <div><label for="description" class="block text-sm font-medium mb-1">説明</label> <textarea id="description" rows="3" class="w-full px-3 py-2 border border-input rounded-md bg-background">`);
            const $$body = escape_html(formData.description);
            if ($$body) {
              $$renderer4.push(`${$$body}`);
            }
            $$renderer4.push(`</textarea></div> <div class="flex justify-end gap-2 pt-4">`);
            Button($$renderer4, {
              type: "button",
              variant: "outline",
              onclick: onClose,
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->キャンセル`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> `);
            Button($$renderer4, {
              type: "submit",
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->追加`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----></div></form>`);
          }
        });
        $$renderer3.push(`<!---->`);
      }
    });
    $$renderer2.push(`<!----></div>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let currentIngredients = [];
    let isDarkMode = false;
    let editingIngredient = null;
    let showAddModal = false;
    ingredients.subscribe((value) => {
      currentIngredients = value;
    });
    darkMode.subscribe((value) => {
      isDarkMode = value;
    });
    function toggleDarkMode() {
      darkMode.toggle();
    }
    function handleEdit(ingredient) {
      editingIngredient = ingredient;
    }
    function handleDelete(id) {
      if (confirm("この原材料を削除してもよろしいですか？")) {
        ingredients.remove(id);
      }
    }
    function closeEditModal() {
      editingIngredient = null;
    }
    function closeAddModal() {
      showAddModal = false;
    }
    function getStockStatus(ingredient) {
      if (ingredient.stockQuantity === 0) return "out";
      if (ingredient.stockQuantity <= ingredient.minStockLevel) return "low";
      return "ok";
    }
    function getStockBadgeVariant(status) {
      switch (status) {
        case "ok":
          return "default";
        case "low":
          return "warning";
        case "out":
          return "destructive";
      }
    }
    function getStockBadgeText(status) {
      switch (status) {
        case "ok":
          return "正常";
        case "low":
          return "在庫少";
        case "out":
          return "在庫切れ";
      }
    }
    $$renderer2.push(`<div class="min-h-screen bg-background"><div class="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8"><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 sm:pb-6 gap-4 ml-14 sm:ml-0"><div><h1 class="text-2xl sm:text-3xl font-semibold tracking-tight">原材料マスタ</h1> <p class="text-muted-foreground mt-1 text-xs sm:text-sm">原材料の基本情報と在庫を管理</p></div> <div class="flex items-center gap-2">`);
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
      onclick: () => showAddModal = true,
      class: "touch-manipulation",
      children: ($$renderer3) => {
        Plus($$renderer3, { class: "h-4 w-4" });
        $$renderer3.push(`<!----> <span class="hidden sm:inline">原材料を追加</span>`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></div></div> `);
    Card($$renderer2, {
      children: ($$renderer3) => {
        CardHeader($$renderer3, {
          children: ($$renderer4) => {
            CardTitle($$renderer4, {
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->原材料一覧`);
              }
            });
          }
        });
        $$renderer3.push(`<!----> `);
        CardContent($$renderer3, {
          children: ($$renderer4) => {
            if (currentIngredients.length === 0) {
              $$renderer4.push("<!--[0-->");
              $$renderer4.push(`<div class="py-12 text-center text-muted-foreground">原材料が登録されていません。「原材料を追加」から登録してください。</div>`);
            } else {
              $$renderer4.push("<!--[-1-->");
              $$renderer4.push(`<div class="block md:hidden space-y-3 -mx-4 sm:mx-0"><!--[-->`);
              const each_array = ensure_array_like(currentIngredients);
              for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                let ingredient = each_array[$$index];
                const status = getStockStatus(ingredient);
                $$renderer4.push(`<div class="border-b last:border-b-0 md:border md:rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"><div class="flex items-start justify-between"><div class="flex-1"><div class="font-medium text-base">${escape_html(ingredient.name)}</div> `);
                if (ingredient.description) {
                  $$renderer4.push("<!--[0-->");
                  $$renderer4.push(`<div class="text-xs text-muted-foreground mt-0.5">${escape_html(ingredient.description)}</div>`);
                } else {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]--></div> `);
                Badge($$renderer4, {
                  variant: getStockBadgeVariant(status),
                  class: "ml-2",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->${escape_html(getStockBadgeText(status))}`);
                  }
                });
                $$renderer4.push(`<!----></div> <div class="grid grid-cols-2 gap-3 text-sm"><div><div class="text-xs text-muted-foreground mb-1">在庫数</div> <div class="font-semibold">${escape_html(ingredient.stockQuantity.toLocaleString())} ${escape_html(ingredient.unit)}</div></div> <div><div class="text-xs text-muted-foreground mb-1">単価</div> <div class="font-semibold">${escape_html(ingredient.unitPrice ? `¥${ingredient.unitPrice.toLocaleString()}` : "-")}</div></div> <div><div class="text-xs text-muted-foreground mb-1">発注レベル</div> <div class="font-semibold">${escape_html(ingredient.minStockLevel.toLocaleString())}</div></div> <div><div class="text-xs text-muted-foreground mb-1">仕入先</div> <div class="font-semibold truncate">${escape_html(ingredient.supplier || "-")}</div></div></div> <div class="flex justify-end gap-2 pt-2 border-t border-border">`);
                Button($$renderer4, {
                  variant: "ghost",
                  size: "sm",
                  onclick: () => handleEdit(ingredient),
                  class: "touch-manipulation",
                  children: ($$renderer5) => {
                    Square_pen($$renderer5, { class: "h-4 w-4" });
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----> `);
                Button($$renderer4, {
                  variant: "ghost",
                  size: "sm",
                  onclick: () => handleDelete(ingredient.id),
                  class: "touch-manipulation",
                  children: ($$renderer5) => {
                    Trash_2($$renderer5, { class: "h-4 w-4 text-red-500" });
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----></div></div>`);
              }
              $$renderer4.push(`<!--]--></div> <div class="hidden md:block overflow-x-auto -mx-4 sm:mx-0 sm:rounded-lg border-y sm:border border-border"><table class="min-w-full divide-y divide-border"><thead class="bg-muted/50"><tr><th class="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">原材料名</th><th class="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">在庫数</th><th class="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">単位</th><th class="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">単価</th><th class="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">発注レベル</th><th class="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">仕入先</th><th class="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ステータス</th><th class="px-4 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">アクション</th></tr></thead><tbody class="bg-background divide-y divide-border"><!--[-->`);
              const each_array_1 = ensure_array_like(currentIngredients);
              for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                let ingredient = each_array_1[$$index_1];
                const status = getStockStatus(ingredient);
                $$renderer4.push(`<tr class="hover:bg-muted/50 transition-colors"><td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><div class="text-sm font-medium">${escape_html(ingredient.name)}</div> `);
                if (ingredient.description) {
                  $$renderer4.push("<!--[0-->");
                  $$renderer4.push(`<div class="text-xs text-muted-foreground">${escape_html(ingredient.description)}</div>`);
                } else {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]--></td><td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><div class="text-sm font-semibold">${escape_html(ingredient.stockQuantity.toLocaleString())}</div></td><td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><div class="text-sm">${escape_html(ingredient.unit)}</div></td><td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><div class="text-sm">${escape_html(ingredient.unitPrice ? `¥${ingredient.unitPrice.toLocaleString()}` : "-")}</div></td><td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><div class="text-sm">${escape_html(ingredient.minStockLevel.toLocaleString())}</div></td><td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><div class="text-sm">${escape_html(ingredient.supplier || "-")}</div></td><td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">`);
                Badge($$renderer4, {
                  variant: getStockBadgeVariant(status),
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->${escape_html(getStockBadgeText(status))}`);
                  }
                });
                $$renderer4.push(`<!----></td><td class="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium"><div class="flex justify-end gap-2">`);
                Button($$renderer4, {
                  variant: "ghost",
                  size: "sm",
                  onclick: () => handleEdit(ingredient),
                  children: ($$renderer5) => {
                    Square_pen($$renderer5, { class: "h-4 w-4" });
                  },
                  $$slots: { default: true }
                });
                $$renderer4.push(`<!----> `);
                Button($$renderer4, {
                  variant: "ghost",
                  size: "sm",
                  onclick: () => handleDelete(ingredient.id),
                  children: ($$renderer5) => {
                    Trash_2($$renderer5, { class: "h-4 w-4 text-red-500" });
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
    $$renderer2.push(`<!----></div></div> `);
    if (editingIngredient) {
      $$renderer2.push("<!--[0-->");
      EditIngredientModal($$renderer2, { ingredient: editingIngredient, onClose: closeEditModal });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (showAddModal) {
      $$renderer2.push("<!--[0-->");
      AddIngredientModal($$renderer2, { onClose: closeAddModal });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
