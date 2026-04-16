import { c as attr_class, f as stringify } from "./renderer.js";
function CardHeader($$renderer, $$props) {
  let { class: className = "", children } = $$props;
  $$renderer.push(`<div${attr_class(`flex flex-col space-y-1.5 p-6 ${stringify(className)}`)}>`);
  children($$renderer);
  $$renderer.push(`<!----></div>`);
}
function CardTitle($$renderer, $$props) {
  let { class: className = "", children } = $$props;
  $$renderer.push(`<h3${attr_class(`text-2xl font-semibold leading-none tracking-tight ${stringify(className)}`)}>`);
  children($$renderer);
  $$renderer.push(`<!----></h3>`);
}
function Badge($$renderer, $$props) {
  let { variant = "default", class: className = "", children } = $$props;
  const variantClasses = {
    default: "border-transparent bg-primary/10 text-primary",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive: "border-transparent bg-red-500/10 text-red-500 dark:text-red-400",
    outline: "text-foreground border-border",
    success: "border-transparent bg-green-500/10 text-green-600 dark:text-green-400",
    warning: "border-transparent bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
  };
  $$renderer.push(`<div${attr_class(`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${stringify(variantClasses[variant])} ${stringify(className)}`)}>`);
  children($$renderer);
  $$renderer.push(`<!----></div>`);
}
export {
  Badge as B,
  CardHeader as C,
  CardTitle as a
};
