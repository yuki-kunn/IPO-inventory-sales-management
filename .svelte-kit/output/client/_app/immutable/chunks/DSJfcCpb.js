import{K as M,L as c,M as S,h as k,u as x,r as g,k as u}from"./DSNROpxJ.js";import{c as m,a as $}from"./B1b8ybsR.js";import{I as h,s as _}from"./Df-ZZJ1P.js";import{l as y,s as b}from"./8spvGl9n.js";function q(e,a,n=a){var o=new WeakSet;M(e,"input",async l=>{var r=l?e.defaultValue:e.value;if(r=v(e)?f(r):r,n(r),c!==null&&o.add(c),await S(),r!==(r=a())){var s=e.selectionStart,t=e.selectionEnd,i=e.value.length;if(e.value=r??"",t!==null){var d=e.value.length;s===t&&t===i&&d>i?(e.selectionStart=d,e.selectionEnd=d):(e.selectionStart=s,e.selectionEnd=Math.min(t,d))}}}),(k&&e.defaultValue!==e.value||x(a)==null&&e.value)&&(n(v(e)?f(e.value):e.value),c!==null&&o.add(c)),g(()=>{var l=a();if(e===document.activeElement){var r=c;if(o.has(r))return}v(e)&&l===f(e.value)||e.type==="date"&&!l&&!e.value||l!==e.value&&(e.value=l??"")})}function v(e){var a=e.type;return a==="number"||a==="range"}function f(e){return e===""?null:+e}function H(e,a){const n=y(a,["children","$$slots","$$events","$$legacy"]);/**
 * @license lucide-svelte v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"}]];h(e,b({name:"square-pen"},()=>n,{get iconNode(){return o},children:(l,r)=>{var s=m(),t=u(s);_(t,a,"default",{}),$(l,s)},$$slots:{default:!0}}))}function I(e,a){const n=y(a,["children","$$slots","$$events","$$legacy"]);/**
 * @license lucide-svelte v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=[["path",{d:"M3 6h18"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17"}]];h(e,b({name:"trash-2"},()=>n,{get iconNode(){return o},children:(l,r)=>{var s=m(),t=u(s);_(t,a,"default",{}),$(l,s)},$$slots:{default:!0}}))}export{H as S,I as T,q as b};
