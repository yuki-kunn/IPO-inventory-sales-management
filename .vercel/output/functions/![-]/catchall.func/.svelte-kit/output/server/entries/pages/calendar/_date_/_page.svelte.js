import { s as sanitize_props, a as spread_props, b as slot, h as escape_html } from "../../../../chunks/renderer.js";
import "clsx";
import { d as darkMode, B as Button, S as Sun, M as Moon, C as Card, a as CardContent } from "../../../../chunks/darkMode.js";
import "../../../../chunks/dailySales.firestore.js";
import "../../../../chunks/unregistered.firestore.js";
import "../../../../chunks/ingredients.firestore.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import { I as Icon } from "../../../../chunks/Icon.js";
import { C as Calendar } from "../../../../chunks/calendar.js";
function Arrow_left($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.469.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["path", { "d": "m12 19-7-7 7-7" }],
    ["path", { "d": "M19 12H5" }]
  ];
  Icon($$renderer, spread_props([
    { name: "arrow-left" },
    $$sanitized_props,
    {
      /**
       * @component @name ArrowLeft
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTIgMTktNy03IDctNyIgLz4KICA8cGF0aCBkPSJNMTkgMTJINSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/arrow-left
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
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isDarkMode = false;
    let salesDate = "";
    darkMode.subscribe((value) => {
      isDarkMode = value;
    });
    function toggleDarkMode() {
      darkMode.toggle();
    }
    $$renderer2.push(`<div class="min-h-screen bg-background"><div class="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8"><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 sm:pb-6 gap-4 ml-14 sm:ml-0"><div class="flex items-center gap-2 sm:gap-4">`);
    Button($$renderer2, {
      variant: "ghost",
      size: "icon",
      onclick: () => window.location.href = "/calendar",
      class: "touch-manipulation",
      children: ($$renderer3) => {
        Arrow_left($$renderer3, { class: "h-5 w-5" });
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> <div><h1 class="text-xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2">`);
    Calendar($$renderer2, { class: "h-6 w-6 sm:h-8 sm:w-8" });
    $$renderer2.push(`<!----> ${escape_html(salesDate)}</h1> <p class="text-muted-foreground mt-1 text-xs sm:text-sm">この日の売上データ</p></div></div> <div class="flex items-center gap-2">`);
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
    $$renderer2.push(`<!----></div></div> `);
    {
      $$renderer2.push("<!--[0-->");
      Card($$renderer2, {
        children: ($$renderer3) => {
          CardContent($$renderer3, {
            class: "py-12 text-center text-muted-foreground",
            children: ($$renderer4) => {
              $$renderer4.push(`<!---->読み込み中...`);
            }
          });
        }
      });
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
export {
  _page as default
};
