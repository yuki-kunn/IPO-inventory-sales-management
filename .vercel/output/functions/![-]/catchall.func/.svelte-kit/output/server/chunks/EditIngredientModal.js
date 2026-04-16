import { d as attr, h as escape_html } from "./renderer.js";
import "./ingredients.firestore.js";
import { C as Card, B as Button, a as CardContent } from "./darkMode.js";
import { C as CardHeader, a as CardTitle } from "./Badge.js";
import { X } from "./x.js";
function EditIngredientModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { ingredient, onClose } = $$props;
    let name = "";
    let unit = "";
    let stockQuantity = 0;
    let minStockLevel = 0;
    let supplier = "";
    let unitPrice = 0;
    let description = "";
    $$renderer2.push(`<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="button" tabindex="-1">`);
    Card($$renderer2, {
      class: "w-full max-w-2xl max-h-[90vh] overflow-y-auto",
      children: ($$renderer3) => {
        CardHeader($$renderer3, {
          children: ($$renderer4) => {
            $$renderer4.push(`<div class="flex items-center justify-between">`);
            CardTitle($$renderer4, {
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->原材料を編集`);
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
            $$renderer4.push(`<form class="space-y-4"><div class="grid gap-4 md:grid-cols-2"><div><label for="name" class="block text-sm font-medium mb-1">原材料名<span class="text-red-500">*</span></label> <input id="name" type="text"${attr("value", name)} required="" class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <div><label for="unit" class="block text-sm font-medium mb-1">単位<span class="text-red-500">*</span></label> <input id="unit" type="text"${attr("value", unit)} placeholder="例: g, ml, 個" required="" class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <div><label for="stockQuantity" class="block text-sm font-medium mb-1">在庫数<span class="text-red-500">*</span></label> <input id="stockQuantity" type="number"${attr("value", stockQuantity)} min="0" step="0.01" required="" class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <div><label for="minStockLevel" class="block text-sm font-medium mb-1">発注レベル<span class="text-red-500">*</span></label> <input id="minStockLevel" type="number"${attr("value", minStockLevel)} min="0" step="0.01" required="" class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <div><label for="unitPrice" class="block text-sm font-medium mb-1">単価</label> <input id="unitPrice" type="number"${attr("value", unitPrice)} min="0" step="0.01" class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div> <div><label for="supplier" class="block text-sm font-medium mb-1">仕入先</label> <input id="supplier" type="text"${attr("value", supplier)} class="w-full px-3 py-2 border border-input rounded-md bg-background"/></div></div> <div><label for="description" class="block text-sm font-medium mb-1">説明</label> <textarea id="description" rows="3" class="w-full px-3 py-2 border border-input rounded-md bg-background">`);
            const $$body = escape_html(description);
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
                $$renderer5.push(`<!---->保存`);
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
export {
  EditIngredientModal as E
};
