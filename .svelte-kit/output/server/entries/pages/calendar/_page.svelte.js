import { s as sanitize_props, a as spread_props, b as slot, h as escape_html, e as ensure_array_like, c as attr_class, f as stringify, i as derived } from "../../../chunks/renderer.js";
import { d as darkMode, B as Button, S as Sun, M as Moon, C as Card, a as CardContent } from "../../../chunks/darkMode.js";
import { C as CardHeader, a as CardTitle, B as Badge } from "../../../chunks/Badge.js";
import { d as dailySales } from "../../../chunks/dailySales.firestore.js";
import { C as Calendar } from "../../../chunks/calendar.js";
import { I as Icon } from "../../../chunks/Icon.js";
function Chevron_left($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.469.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [["path", { "d": "m15 18-6-6 6-6" }]];
  Icon($$renderer, spread_props([
    { name: "chevron-left" },
    $$sanitized_props,
    {
      /**
       * @component @name ChevronLeft
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTUgMTgtNi02IDYtNiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/chevron-left
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
function Chevron_right($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.469.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [["path", { "d": "m9 18 6-6-6-6" }]];
  Icon($$renderer, spread_props([
    { name: "chevron-right" },
    $$sanitized_props,
    {
      /**
       * @component @name ChevronRight
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtOSAxOCA2LTYtNi02IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/chevron-right
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
    let dailySalesData = [];
    let isDarkMode = false;
    let currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    let currentMonth = (/* @__PURE__ */ new Date()).getMonth();
    dailySales.subscribe((value) => {
      dailySalesData = value;
    });
    darkMode.subscribe((value) => {
      isDarkMode = value;
    });
    function toggleDarkMode() {
      darkMode.toggle();
    }
    function previousMonth() {
      if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
      } else {
        currentMonth--;
      }
    }
    function nextMonth() {
      if (currentMonth === 11) {
        currentMonth = 0;
        currentYear++;
      } else {
        currentMonth++;
      }
    }
    function goToToday() {
      const today = /* @__PURE__ */ new Date();
      currentYear = today.getFullYear();
      currentMonth = today.getMonth();
    }
    let calendarDays = derived(() => () => {
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      const firstDayOfWeek = firstDay.getDay();
      const daysInMonth = lastDay.getDate();
      const days = [];
      for (let i = 0; i < firstDayOfWeek; i++) {
        days.push({
          date: null,
          dateString: null,
          isCurrentMonth: false,
          isToday: false,
          salesData: null
        });
      }
      for (let date = 1; date <= daysInMonth; date++) {
        const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
        const isToday = date === (/* @__PURE__ */ new Date()).getDate() && currentMonth === (/* @__PURE__ */ new Date()).getMonth() && currentYear === (/* @__PURE__ */ new Date()).getFullYear();
        const salesData = dailySalesData.find((ds) => ds.date === dateString) || null;
        days.push({ date, dateString, isCurrentMonth: true, isToday, salesData });
      }
      return days;
    });
    const monthNames = [
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月"
    ];
    const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
    $$renderer2.push(`<div class="min-h-screen bg-background"><div class="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8"><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 sm:pb-6 gap-4 ml-14 sm:ml-0"><div><h1 class="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2">`);
    Calendar($$renderer2, { class: "h-6 w-6 sm:h-8 sm:w-8" });
    $$renderer2.push(`<!----> 売上カレンダー</h1> <p class="text-muted-foreground mt-1 text-xs sm:text-sm">日別の売上データを確認</p></div> <div class="flex items-center gap-2">`);
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
    Card($$renderer2, {
      children: ($$renderer3) => {
        CardHeader($$renderer3, {
          children: ($$renderer4) => {
            $$renderer4.push(`<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">`);
            CardTitle($$renderer4, {
              class: "text-xl sm:text-2xl",
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->${escape_html(currentYear)}年 ${escape_html(monthNames[currentMonth])}`);
              }
            });
            $$renderer4.push(`<!----> <div class="flex items-center gap-1 sm:gap-2">`);
            Button($$renderer4, {
              variant: "outline",
              size: "sm",
              onclick: previousMonth,
              class: "touch-manipulation",
              children: ($$renderer5) => {
                Chevron_left($$renderer5, { class: "h-4 w-4" });
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> `);
            Button($$renderer4, {
              variant: "outline",
              size: "sm",
              onclick: goToToday,
              class: "touch-manipulation",
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->今月`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> `);
            Button($$renderer4, {
              variant: "outline",
              size: "sm",
              onclick: nextMonth,
              class: "touch-manipulation",
              children: ($$renderer5) => {
                Chevron_right($$renderer5, { class: "h-4 w-4" });
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----></div></div>`);
          }
        });
        $$renderer3.push(`<!----> `);
        CardContent($$renderer3, {
          children: ($$renderer4) => {
            $$renderer4.push(`<div class="grid grid-cols-7 gap-1 sm:gap-2 mb-2"><!--[-->`);
            const each_array = ensure_array_like(weekDays);
            for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
              let day = each_array[$$index];
              $$renderer4.push(`<div class="text-center text-xs sm:text-sm font-medium text-muted-foreground p-1 sm:p-2">${escape_html(day)}</div>`);
            }
            $$renderer4.push(`<!--]--></div> <div class="grid grid-cols-7 gap-1 sm:gap-2"><!--[-->`);
            const each_array_1 = ensure_array_like(calendarDays()());
            for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
              let day = each_array_1[$$index_1];
              if (day.isCurrentMonth && day.date !== null) {
                $$renderer4.push("<!--[0-->");
                $$renderer4.push(`<button${attr_class(`aspect-square p-1 sm:p-2 rounded-lg border border-border hover:bg-muted/50 active:bg-muted/50 transition-colors touch-manipulation ${stringify(day.isToday ? "border-primary bg-primary/10" : "")} ${stringify(day.salesData ? "bg-blue-50 dark:bg-blue-950/20" : "")}`)}><div class="flex flex-col items-center justify-center h-full gap-0.5"><div class="text-xs sm:text-sm font-medium">${escape_html(day.date)}</div> `);
                if (day.salesData) {
                  $$renderer4.push("<!--[0-->");
                  $$renderer4.push(`<div class="text-[8px] sm:text-[10px] text-muted-foreground truncate w-full text-center px-0.5">¥${escape_html(day.salesData.totalSales.toLocaleString())}</div> `);
                  if (day.salesData.unregisteredCount > 0) {
                    $$renderer4.push("<!--[0-->");
                    $$renderer4.push(`<div class="text-[9px] sm:text-xs text-red-600 dark:text-red-400 font-medium">未${escape_html(day.salesData.unregisteredCount)}</div>`);
                  } else if (day.salesData.inventoryProcessed) {
                    $$renderer4.push("<!--[1-->");
                    $$renderer4.push(`<div class="text-[10px] text-green-600 dark:text-green-400">✓</div>`);
                  } else {
                    $$renderer4.push("<!--[-1-->");
                  }
                  $$renderer4.push(`<!--]-->`);
                } else {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]--></div></button>`);
              } else {
                $$renderer4.push("<!--[-1-->");
                $$renderer4.push(`<div class="aspect-square p-2"></div>`);
              }
              $$renderer4.push(`<!--]-->`);
            }
            $$renderer4.push(`<!--]--></div>`);
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
              class: "text-base sm:text-lg",
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->凡例`);
              }
            });
          }
        });
        $$renderer3.push(`<!----> `);
        CardContent($$renderer3, {
          children: ($$renderer4) => {
            $$renderer4.push(`<div class="grid gap-2 grid-cols-2 md:grid-cols-4"><div class="flex items-center gap-2"><div class="w-6 h-6 sm:w-8 sm:h-8 rounded border border-primary bg-primary/10 flex-shrink-0"></div> <span class="text-xs sm:text-sm">今日</span></div> <div class="flex items-center gap-2"><div class="w-6 h-6 sm:w-8 sm:h-8 rounded border border-border bg-blue-50 dark:bg-blue-950/20 flex-shrink-0"></div> <span class="text-xs sm:text-sm">売上あり</span></div> <div class="flex items-center gap-2">`);
            Badge($$renderer4, {
              variant: "destructive",
              class: "text-[9px] sm:text-[10px] whitespace-nowrap",
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->未登録 N`);
              }
            });
            $$renderer4.push(`<!----> <span class="text-xs sm:text-sm">未登録</span></div> <div class="flex items-center gap-2">`);
            Badge($$renderer4, {
              variant: "default",
              class: "text-[9px] sm:text-[10px] whitespace-nowrap",
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->反映済み`);
              }
            });
            $$renderer4.push(`<!----> <span class="text-xs sm:text-sm">反映済</span></div></div>`);
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
