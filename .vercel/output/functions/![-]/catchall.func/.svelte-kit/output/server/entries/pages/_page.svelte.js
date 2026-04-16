import { s as sanitize_props, a as spread_props, b as slot, f as stringify, h as escape_html, e as ensure_array_like, c as attr_class, i as derived } from "../../chunks/renderer.js";
import { C as Card, a as CardContent, B as Button, d as darkMode, S as Sun, M as Moon } from "../../chunks/darkMode.js";
import { C as CardHeader, a as CardTitle, B as Badge } from "../../chunks/Badge.js";
import { S as Square_pen, T as Trash_2 } from "../../chunks/trash-2.js";
import { E as EditIngredientModal } from "../../chunks/EditIngredientModal.js";
import { i as ingredients, a as ingredientStats } from "../../chunks/ingredients.firestore.js";
import "../../chunks/dailySales.firestore.js";
import "../../chunks/unregistered.firestore.js";
import { I as Icon } from "../../chunks/Icon.js";
function Circle_x($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.469.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["path", { "d": "m15 9-6 6" }],
    ["path", { "d": "m9 9 6 6" }]
  ];
  Icon($$renderer, spread_props([
    { name: "circle-x" },
    $$sanitized_props,
    {
      /**
       * @component @name CircleX
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8cGF0aCBkPSJtMTUgOS02IDYiIC8+CiAgPHBhdGggZD0ibTkgOSA2IDYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/circle-x
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
function Dollar_sign($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.469.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["line", { "x1": "12", "x2": "12", "y1": "2", "y2": "22" }],
    [
      "path",
      { "d": "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "dollar-sign" },
    $$sanitized_props,
    {
      /**
       * @component @name DollarSign
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8bGluZSB4MT0iMTIiIHgyPSIxMiIgeTE9IjIiIHkyPSIyMiIgLz4KICA8cGF0aCBkPSJNMTcgNUg5LjVhMy41IDMuNSAwIDAgMCAwIDdoNWEzLjUgMy41IDAgMCAxIDAgN0g2IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/dollar-sign
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
function File($$renderer, $$props) {
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
      {
        "d": "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
      }
    ],
    ["path", { "d": "M14 2v4a2 2 0 0 0 2 2h4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "file" },
    $$sanitized_props,
    {
      /**
       * @component @name File
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTUgMkg2YTIgMiAwIDAgMC0yIDJ2MTZhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMi0yVjdaIiAvPgogIDxwYXRoIGQ9Ik0xNCAydjRhMiAyIDAgMCAwIDIgMmg0IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/file
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
function Folder($$renderer, $$props) {
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
      {
        "d": "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "folder" },
    $$sanitized_props,
    {
      /**
       * @component @name Folder
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAgMjBhMiAyIDAgMCAwIDItMlY4YTIgMiAwIDAgMC0yLTJoLTcuOWEyIDIgMCAwIDEtMS42OS0uOUw5LjYgMy45QTIgMiAwIDAgMCA3LjkzIDNINGEyIDIgMCAwIDAtMiAydjEzYTIgMiAwIDAgMCAyIDJaIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/folder
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
function Package($$renderer, $$props) {
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
      {
        "d": "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
      }
    ],
    ["path", { "d": "M12 22V12" }],
    [
      "path",
      { "d": "m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" }
    ],
    ["path", { "d": "m7.5 4.27 9 5.15" }]
  ];
  Icon($$renderer, spread_props([
    { name: "package" },
    $$sanitized_props,
    {
      /**
       * @component @name Package
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTEgMjEuNzNhMiAyIDAgMCAwIDIgMGw3LTRBMiAyIDAgMCAwIDIxIDE2VjhhMiAyIDAgMCAwLTEtMS43M2wtNy00YTIgMiAwIDAgMC0yIDBsLTcgNEEyIDIgMCAwIDAgMyA4djhhMiAyIDAgMCAwIDEgMS43M3oiIC8+CiAgPHBhdGggZD0iTTEyIDIyVjEyIiAvPgogIDxwYXRoIGQ9Im0zLjMgNyA3LjcwMyA0LjczNGEyIDIgMCAwIDAgMS45OTQgMEwyMC43IDciIC8+CiAgPHBhdGggZD0ibTcuNSA0LjI3IDkgNS4xNSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/package
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
function Triangle_alert($$renderer, $$props) {
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
      {
        "d": "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
      }
    ],
    ["path", { "d": "M12 9v4" }],
    ["path", { "d": "M12 17h.01" }]
  ];
  Icon($$renderer, spread_props([
    { name: "triangle-alert" },
    $$sanitized_props,
    {
      /**
       * @component @name TriangleAlert
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMjEuNzMgMTgtOC0xNGEyIDIgMCAwIDAtMy40OCAwbC04IDE0QTIgMiAwIDAgMCA0IDIxaDE2YTIgMiAwIDAgMCAxLjczLTMiIC8+CiAgPHBhdGggZD0iTTEyIDl2NCIgLz4KICA8cGF0aCBkPSJNMTIgMTdoLjAxIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/triangle-alert
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
function Upload($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.469.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["path", { "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
    ["polyline", { "points": "17 8 12 3 7 8" }],
    ["line", { "x1": "12", "x2": "12", "y1": "3", "y2": "15" }]
  ];
  Icon($$renderer, spread_props([
    { name: "upload" },
    $$sanitized_props,
    {
      /**
       * @component @name Upload
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjEgMTV2NGEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMnYtNCIgLz4KICA8cG9seWxpbmUgcG9pbnRzPSIxNyA4IDEyIDMgNyA4IiAvPgogIDxsaW5lIHgxPSIxMiIgeDI9IjEyIiB5MT0iMyIgeTI9IjE1IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/upload
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
function StatsCard($$renderer, $$props) {
  let {
    title,
    value,
    description,
    icon: Icon2,
    iconColor = "text-blue-600"
  } = $$props;
  Card($$renderer, {
    class: "hover:border-primary/50 transition-colors",
    children: ($$renderer2) => {
      CardHeader($$renderer2, {
        class: "flex flex-row items-center justify-between space-y-0 pb-2",
        children: ($$renderer3) => {
          CardTitle($$renderer3, {
            class: "text-xs font-medium text-muted-foreground uppercase tracking-wide",
            children: ($$renderer4) => {
              $$renderer4.push(`<!---->${escape_html(title)}`);
            }
          });
          $$renderer3.push(`<!----> `);
          if (Icon2) {
            $$renderer3.push("<!--[-->");
            Icon2($$renderer3, { class: `h-4 w-4 ${stringify(iconColor)}` });
            $$renderer3.push("<!--]-->");
          } else {
            $$renderer3.push("<!--[!-->");
            $$renderer3.push("<!--]-->");
          }
        }
      });
      $$renderer2.push(`<!----> `);
      CardContent($$renderer2, {
        children: ($$renderer3) => {
          $$renderer3.push(`<div class="text-2xl font-semibold">${escape_html(value)}</div> <p class="text-xs text-muted-foreground mt-1">${escape_html(description)}</p>`);
        }
      });
      $$renderer2.push(`<!---->`);
    }
  });
}
function IngredientsTable($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { ingredients: ingredients2, onEdit, onDelete } = $$props;
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
    $$renderer2.push(`<div class="overflow-x-auto rounded-lg border border-border"><table class="min-w-full divide-y divide-border"><thead class="bg-muted/50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">原材料名</th><th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">在庫数</th><th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">単位</th><th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">単価</th><th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">発注レベル</th><th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">仕入先</th><th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ステータス</th><th class="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">アクション</th></tr></thead><tbody class="bg-background divide-y divide-border">`);
    if (ingredients2.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<tr><td colspan="8" class="px-6 py-12 text-center text-muted-foreground">原材料が登録されていません</td></tr>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(ingredients2);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let ingredient = each_array[$$index];
        const status = getStockStatus(ingredient);
        $$renderer2.push(`<tr class="hover:bg-muted/50 transition-colors"><td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium">${escape_html(ingredient.name)}</div> `);
        if (ingredient.description) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="text-xs text-muted-foreground">${escape_html(ingredient.description)}</div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></td><td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-semibold">${escape_html(ingredient.stockQuantity.toLocaleString())}</div></td><td class="px-6 py-4 whitespace-nowrap"><div class="text-sm">${escape_html(ingredient.unit)}</div></td><td class="px-6 py-4 whitespace-nowrap"><div class="text-sm">${escape_html(ingredient.unitPrice ? `¥${ingredient.unitPrice.toLocaleString()}` : "-")}</div></td><td class="px-6 py-4 whitespace-nowrap"><div class="text-sm">${escape_html(ingredient.minStockLevel.toLocaleString())}</div></td><td class="px-6 py-4 whitespace-nowrap"><div class="text-sm">${escape_html(ingredient.supplier || "-")}</div></td><td class="px-6 py-4 whitespace-nowrap">`);
        Badge($$renderer2, {
          variant: getStockBadgeVariant(status),
          children: ($$renderer3) => {
            $$renderer3.push(`<!---->${escape_html(getStockBadgeText(status))}`);
          }
        });
        $$renderer2.push(`<!----></td><td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><div class="flex justify-end gap-2">`);
        if (onEdit) {
          $$renderer2.push("<!--[0-->");
          Button($$renderer2, {
            variant: "ghost",
            size: "sm",
            onclick: () => onEdit(ingredient),
            children: ($$renderer3) => {
              Square_pen($$renderer3, { class: "h-4 w-4" });
            },
            $$slots: { default: true }
          });
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (onDelete) {
          $$renderer2.push("<!--[0-->");
          Button($$renderer2, {
            variant: "ghost",
            size: "sm",
            onclick: () => onDelete(ingredient.id),
            children: ($$renderer3) => {
              Trash_2($$renderer3, { class: "h-4 w-4 text-red-500" });
            },
            $$slots: { default: true }
          });
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div></td></tr>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></tbody></table></div>`);
  });
}
function SalesUploader($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let fileInput;
    let folderInput;
    let uploading = false;
    let batchResults = [];
    function triggerFileInput() {
      fileInput.click();
    }
    function triggerFolderInput() {
      folderInput.click();
    }
    Card($$renderer2, {
      children: ($$renderer3) => {
        CardHeader($$renderer3, {
          children: ($$renderer4) => {
            CardTitle($$renderer4, {
              class: "flex items-center gap-2",
              children: ($$renderer5) => {
                Upload($$renderer5, { class: "h-5 w-5" });
                $$renderer5.push(`<!----> 売上CSVファイルをアップロード`);
              }
            });
          }
        });
        $$renderer3.push(`<!----> `);
        CardContent($$renderer3, {
          children: ($$renderer4) => {
            $$renderer4.push(`<div class="space-y-4"><p class="text-sm text-muted-foreground">商品別売上データ（Shift-JIS/UTF-8対応）のCSVファイルをアップロードしてください。</p> <input type="file" accept=".csv" class="hidden"/> <input type="file" accept=".csv" multiple="" webkitdirectory="" class="hidden"/> <div class="grid grid-cols-2 gap-2">`);
            Button($$renderer4, {
              onclick: triggerFileInput,
              disabled: uploading,
              variant: "outline",
              children: ($$renderer5) => {
                File($$renderer5, { class: "h-4 w-4 mr-2" });
                $$renderer5.push(`<!----> ${escape_html("ファイル選択")}`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> `);
            Button($$renderer4, {
              onclick: triggerFolderInput,
              disabled: uploading,
              children: ($$renderer5) => {
                Folder($$renderer5, { class: "h-4 w-4 mr-2" });
                $$renderer5.push(`<!----> ${escape_html("フォルダ選択")}`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----></div> `);
            if (batchResults.length > 0) {
              $$renderer4.push("<!--[0-->");
              $$renderer4.push(`<div class="rounded-md p-4 bg-blue-500/10 border border-blue-500/20"><p class="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">一括処理完了: ${escape_html(batchResults.length)}ファイル</p> <div class="space-y-2 max-h-64 overflow-y-auto"><!--[-->`);
              const each_array = ensure_array_like(batchResults);
              for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                let result = each_array[$$index];
                $$renderer4.push(`<div${attr_class(`text-xs p-2 rounded ${stringify(result.success ? "bg-green-500/10" : "bg-red-500/10")}`)}><div class="flex items-center justify-between"><span${attr_class(`font-medium ${stringify(result.success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300")}`)}>${escape_html(result.date)}</span> <span class="text-muted-foreground">${escape_html(result.success ? "✓" : "✗")}</span></div> `);
                if (result.success) {
                  $$renderer4.push("<!--[0-->");
                  $$renderer4.push(`<div class="mt-1 text-muted-foreground space-x-3"><span>商品: ${escape_html(result.imported)}件</span> <span>処理: ${escape_html(result.processed)}件</span> `);
                  if (result.unregistered > 0) {
                    $$renderer4.push("<!--[0-->");
                    $$renderer4.push(`<span class="text-yellow-600 dark:text-yellow-400">未登録: ${escape_html(result.unregistered)}件</span>`);
                  } else {
                    $$renderer4.push("<!--[-1-->");
                  }
                  $$renderer4.push(`<!--]--></div>`);
                } else {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]--></div>`);
              }
              $$renderer4.push(`<!--]--></div> <div class="mt-3 pt-3 border-t border-blue-500/20"><div class="grid grid-cols-3 gap-2 text-xs"><div class="text-center"><div class="font-medium text-green-600 dark:text-green-400">${escape_html(batchResults.filter((r) => r.success).length)}</div> <div class="text-muted-foreground">成功</div></div> <div class="text-center"><div class="font-medium text-blue-600 dark:text-blue-400">${escape_html(batchResults.reduce((sum, r) => sum + r.imported, 0))}</div> <div class="text-muted-foreground">総商品数</div></div> <div class="text-center"><div class="font-medium text-yellow-600 dark:text-yellow-400">${escape_html(batchResults.reduce((sum, r) => sum + r.unregistered, 0))}</div> <div class="text-muted-foreground">未登録</div></div></div></div> `);
              if (batchResults.some((r) => r.unregistered > 0)) {
                $$renderer4.push("<!--[0-->");
                Button($$renderer4, {
                  variant: "outline",
                  size: "sm",
                  class: "mt-3 w-full",
                  onclick: () => window.location.href = "/unregistered",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->未登録商品ページで確認`);
                  },
                  $$slots: { default: true }
                });
              } else {
                $$renderer4.push("<!--[-1-->");
              }
              $$renderer4.push(`<!--]--></div>`);
            } else {
              $$renderer4.push("<!--[-1-->");
            }
            $$renderer4.push(`<!--]--> `);
            {
              $$renderer4.push("<!--[-1-->");
            }
            $$renderer4.push(`<!--]--> <div class="text-xs text-muted-foreground space-y-2"><div><p class="font-medium mb-1">アップロード方法:</p> <ul class="text-[10px] space-y-1 ml-4 list-disc"><li><strong>ファイル選択</strong>: 単一ファイルまたは複数ファイルを選択</li> <li><strong>フォルダ選択</strong>: フォルダ内のすべてのCSVファイルを一括アップロード</li></ul></div> <div><p class="font-medium mb-1">対応フォーマット:</p> <code class="block bg-muted p-2 rounded text-[10px] leading-relaxed">商品名,カテゴリー,税区分,販売総売上,構成比%,粗利総額,構成比%,販売商品数,構成比%,返品商品数,構成比%,商品ID,商品コード,バーコード</code></div> <p class="text-[10px]">※ Shift-JIS/UTF-8対応 | ファイル名から日付を自動抽出（例: 商品別売上_20260413-20260413.csv）</p></div></div>`);
          }
        });
        $$renderer3.push(`<!---->`);
      }
    });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let currentIngredients = [];
    let currentStats = {
      totalIngredients: 0,
      lowStockIngredients: 0,
      outOfStockIngredients: 0,
      totalValue: 0
    };
    let editingIngredient = null;
    let showUploader = false;
    let isDarkMode = false;
    ingredients.subscribe((value) => {
      currentIngredients = value;
    });
    ingredientStats.subscribe((value) => {
      currentStats = value;
    });
    darkMode.subscribe((value) => {
      isDarkMode = value;
    });
    function handleEdit(ingredient) {
      editingIngredient = ingredient;
    }
    function handleDelete(id) {
      if (confirm("この原材料を削除してもよろしいですか?")) {
        ingredients.remove(id);
      }
    }
    function closeEditModal() {
      editingIngredient = null;
    }
    function toggleDarkMode() {
      darkMode.toggle();
    }
    let lowStockIngredients = derived(() => currentIngredients.filter((i) => i.stockQuantity > 0 && i.stockQuantity <= i.minStockLevel));
    $$renderer2.push(`<div class="min-h-screen bg-background"><div class="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8"><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 sm:pb-6 gap-4 ml-14 sm:ml-0"><div><h1 class="text-2xl sm:text-3xl font-semibold tracking-tight">AirREGI 在庫・売上管理</h1> <p class="text-muted-foreground mt-1 text-xs sm:text-sm">原材料在庫と売上データを統合管理</p></div> <div class="flex items-center gap-2">`);
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
      variant: "outline",
      onclick: () => showUploader = !showUploader,
      class: "touch-manipulation",
      children: ($$renderer3) => {
        Upload($$renderer3, { class: "h-4 w-4" });
        $$renderer3.push(`<!----> <span class="hidden sm:inline">${escape_html(showUploader ? "閉じる" : "売上取込")}</span>`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></div></div> `);
    if (showUploader) {
      $$renderer2.push("<!--[0-->");
      SalesUploader($$renderer2);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="grid gap-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">`);
    StatsCard($$renderer2, {
      title: "総原材料数",
      value: currentStats.totalIngredients,
      description: "登録されている原材料の総数",
      icon: Package,
      iconColor: "text-blue-600 dark:text-blue-400"
    });
    $$renderer2.push(`<!----> `);
    StatsCard($$renderer2, {
      title: "在庫少",
      value: currentStats.lowStockIngredients,
      description: "発注が必要な原材料",
      icon: Triangle_alert,
      iconColor: "text-yellow-600 dark:text-yellow-400"
    });
    $$renderer2.push(`<!----> `);
    StatsCard($$renderer2, {
      title: "在庫切れ",
      value: currentStats.outOfStockIngredients,
      description: "在庫が0の原材料",
      icon: Circle_x,
      iconColor: "text-red-600 dark:text-red-400"
    });
    $$renderer2.push(`<!----> `);
    StatsCard($$renderer2, {
      title: "総在庫価値",
      value: `¥${currentStats.totalValue.toLocaleString()}`,
      description: "在庫の総額",
      icon: Dollar_sign,
      iconColor: "text-green-600 dark:text-green-400"
    });
    $$renderer2.push(`<!----></div> `);
    if (lowStockIngredients().length > 0) {
      $$renderer2.push("<!--[0-->");
      Card($$renderer2, {
        class: "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20",
        children: ($$renderer3) => {
          CardHeader($$renderer3, {
            children: ($$renderer4) => {
              CardTitle($$renderer4, {
                class: "text-yellow-800 dark:text-yellow-200 flex items-center gap-2",
                children: ($$renderer5) => {
                  Triangle_alert($$renderer5, { class: "h-5 w-5" });
                  $$renderer5.push(`<!----> 発注アラート`);
                }
              });
            }
          });
          $$renderer3.push(`<!----> `);
          CardContent($$renderer3, {
            children: ($$renderer4) => {
              $$renderer4.push(`<p class="text-sm text-yellow-700 dark:text-yellow-300 mb-3">以下の原材料は在庫が少なくなっています。発注をご検討ください。</p> <div class="flex flex-wrap gap-2"><!--[-->`);
              const each_array = ensure_array_like(lowStockIngredients());
              for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                let ingredient = each_array[$$index];
                Badge($$renderer4, {
                  variant: "warning",
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->${escape_html(ingredient.name)} (残り${escape_html(ingredient.stockQuantity)}${escape_html(ingredient.unit)})`);
                  }
                });
              }
              $$renderer4.push(`<!--]--></div>`);
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
                $$renderer5.push(`<!---->原材料一覧`);
              }
            });
          }
        });
        $$renderer3.push(`<!----> `);
        CardContent($$renderer3, {
          children: ($$renderer4) => {
            IngredientsTable($$renderer4, {
              ingredients: currentIngredients,
              onEdit: handleEdit,
              onDelete: handleDelete
            });
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
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
