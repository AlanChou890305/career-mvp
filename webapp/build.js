#!/usr/bin/env node
// 打包 alan/webapp 成單檔 dist/index.html。
//
// 不引入相依套件，只用 Node 內建模組。做三件事：
//   1. 把 demo-data.json 的資料本身跑過 mask.js 的規則，遮蔽發生在這裡，
//      不是在瀏覽器渲染時——發布檔裡不能有任何原文。
//   2. 把 app.js 裡靠 framework7-icons CDN 的 ICONS/ICONS_OFF 換成內嵌 SVG，
//      並拿掉 index.html 那顆 CDN <link>，Artifact 的 CSP 只放行 Google Fonts。
//   3. inline styles.css、mask.js、data.js、app.js（已替換圖示）、遮蔽後的資料，
//      寫成一份 dist/index.html。
//
// 開發模式（serve.sh）完全不受影響：index.html、app.js 在開發時的載入方式不變。

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname;
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

// ---------- 1. 遮蔽資料 ----------

function loadMaskFns() {
  // mask.js 用 `const MASKS = [...]` 宣告——vm 的 top-level const/let 不會變成
  // sandbox 物件的屬性（只有 var 與 function 宣告會），所以額外把它指派到 this 上取出。
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(read("mask.js") + "\nthis.__maskCount__ = MASKS.length;", sandbox, { filename: "mask.js" });
  return { maskCount: sandbox.__maskCount__, maskText: sandbox.maskText };
}

// mask.js 原始碼裡的規則本身就是原文字面（"Hububble"、"inline 樂排" 等），
// 逐字 inline 進 dist 會讓真名以另一種形式躺在檔案裡。既然遮蔽在打包階段
// 已經對資料做過一次，dist 版的 mask.js 換成不含任何原文的無操作版本——
// 只保留 MASKS.length（app.js 設定頁會顯示這個數字）與 maskText() 的介面。
function redactedMaskJsSource(ruleCount) {
  return `// dist 版：遮蔽已在打包階段套用在資料本身，這裡不需要也不能再帶原文規則。
const MASKS = new Array(${ruleCount}).fill(null);
function maskText(s) { return s; }
`;
}

function deepMask(value, maskText) {
  if (typeof value === "string") return maskText(value);
  if (Array.isArray(value)) return value.map((v) => deepMask(v, maskText));
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = deepMask(value[k], maskText);
    return out;
  }
  return value;
}

// ---------- 2. 圖示：framework7-icons → 內嵌 SVG ----------
// 手繪的簡化線稿／填色圖示，對應 app.js 用到的 f7-icons 名稱（app.js:53、app.js:61）。
// 只覆蓋這 11 個名稱，其他 f7 icon 名稱不在這個 demo 的使用範圍內。

const SVG = {
  house_fill: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 2 2 10.5V21a1 1 0 0 0 1 1h5.5a1 1 0 0 0 1-1v-6h5v6a1 1 0 0 0 1 1H21a1 1 0 0 0 1-1V10.5z"/></svg>`,
  house: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5.5v-7h-5v7H4a1 1 0 0 1-1-1z"/></svg>`,
  doc_text_fill: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M6 2h9l5 5v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path fill="var(--surface,#fff)" d="M8 11h8v1.4H8zm0 3.4h8v1.4H8zm0 3.4h6v1.4H8z"/></svg>`,
  doc_text: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M6 2h9l5 5v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path stroke="currentColor" stroke-width="1.4" d="M8 11h8M8 14.4h8M8 17.8h6"/></svg>`,
  briefcase_fill: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M9 3h6a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v5H2V9a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2zm0 4h6V5H9zM2 15h20v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/></svg>`,
  briefcase: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M9 3h6a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2z"/><path stroke="currentColor" stroke-width="1.6" d="M2 14h20"/></svg>`,
  chart_bar_fill: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M3 12h4v9H3zm7-6h4v15h-4zm7 3h4v12h-4z"/></svg>`,
  chart_bar: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M4 13h3v7H4zm6.5-6h3v13h-3zm6.5 3h3v10h-3z"/></svg>`,
  arrow_counterclockwise: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M4 9a8 8 0 1 1 1.5 7.5M4 9V4M4 9h5"/></svg>`,
  gear_alt_fill: `<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm9.4 2.6-1.9-.3a7.6 7.6 0 0 0-.6-1.5l1.1-1.6a1 1 0 0 0-.1-1.3l-1.3-1.3a1 1 0 0 0-1.3-.1l-1.6 1.1a7.6 7.6 0 0 0-1.5-.6l-.3-1.9A1 1 0 0 0 13 2h-2a1 1 0 0 0-1 .9l-.3 1.9a7.6 7.6 0 0 0-1.5.6L6.6 4.3a1 1 0 0 0-1.3.1L4 5.7a1 1 0 0 0-.1 1.3l1.1 1.6a7.6 7.6 0 0 0-.6 1.5l-1.9.3a1 1 0 0 0-.9 1v2a1 1 0 0 0 .9 1l1.9.3a7.6 7.6 0 0 0 .6 1.5l-1.1 1.6a1 1 0 0 0 .1 1.3l1.3 1.3a1 1 0 0 0 1.3.1l1.6-1.1a7.6 7.6 0 0 0 1.5.6l.3 1.9a1 1 0 0 0 1 .9h2a1 1 0 0 0 1-.9l.3-1.9a7.6 7.6 0 0 0 1.5-.6l1.6 1.1a1 1 0 0 0 1.3-.1l1.3-1.3a1 1 0 0 0 .1-1.3l-1.1-1.6a7.6 7.6 0 0 0 .6-1.5l1.9-.3a1 1 0 0 0 .9-1v-2a1 1 0 0 0-.9-1z"/></svg>`,
  gear_alt: `<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path fill="none" stroke="currentColor" stroke-width="1.6" d="M12 3.5v2.3M12 18.2v2.3M4.4 7l2 1.2M17.6 15.8l2 1.2M4.4 17l2-1.2M17.6 8.2l2-1.2M3.5 12h2.3M18.2 12h2.3"/></svg>`,
};

function iconOf(name) { return SVG[name] || `<span></span>`; }

function replaceIconsInAppJs(appJs) {
  const start = appJs.indexOf("const f7 =");
  const endMarker = "const ICONS_OFF = {";
  const endIdx = appJs.indexOf(endMarker);
  const closeIdx = appJs.indexOf("};", endIdx) + 2;
  if (start === -1 || endIdx === -1 || closeIdx === -1) {
    throw new Error("找不到 app.js 裡的 ICONS/ICONS_OFF 區塊，圖示替換失敗");
  }
  const replacement = `const ICONS = {
  home: ${JSON.stringify(iconOf("house_fill"))},
  resume: ${JSON.stringify(iconOf("doc_text_fill"))},
  job: ${JSON.stringify(iconOf("briefcase_fill"))},
  apps: ${JSON.stringify(iconOf("chart_bar_fill"))},
  after: ${JSON.stringify(iconOf("arrow_counterclockwise"))},
  settings: ${JSON.stringify(iconOf("gear_alt_fill"))},
};
const ICONS_OFF = {
  home: ${JSON.stringify(iconOf("house"))},
  settings: ${JSON.stringify(iconOf("gear_alt"))},
  resume: ${JSON.stringify(iconOf("doc_text"))},
  job: ${JSON.stringify(iconOf("briefcase"))},
  apps: ${JSON.stringify(iconOf("chart_bar"))},
};`;
  return appJs.slice(0, start) + replacement + appJs.slice(closeIdx);
}

// ---------- 3. 組裝 dist/index.html ----------

function main() {
  const { maskCount, maskText } = loadMaskFns();
  const rawData = JSON.parse(read("demo-data.json"));
  const maskedData = deepMask(rawData, maskText);

  let appJs = read("app.js");
  appJs = replaceIconsInAppJs(appJs);
  // app.js 的 DEMO_APPS 種子投遞紀錄裡硬寫了兩個 mask.js 規則表上的真實名稱
  // （目標公司、一個合作夥伴），逐字置換掉——不對整支檔案跑 maskText()，
  // 因為 mask.js 有 /\binline\b/gi 這種規則，會連 CSS/JS 裡的「inline-block」
  // 之類的字都吃掉。
  appJs = appJs
    .replace(/"inline 樂排"/g, '"T 公司"')
    .replace(/company: "Appier"/g, 'company: "A 夥伴"');

  const styles = read("styles.css");
  const maskJs = redactedMaskJsSource(maskCount);
  const dataJs = read("data.js");
  let html = read("index.html");

  // 拿掉 CDN 圖示字型；圖示已經改成內嵌 SVG。
  html = html.replace(/\s*<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/framework7-icons[^>]*>\n?/, "\n");

  // 拿掉 PDF 文字抽取用的 pdf.js CDN script：dist 單檔的 CSP 只放行 Google Fonts，
  // 擋掉這顆外部 script，正式站上傳 PDF 維持原本的示範行為（app.js 會偵測
  // window.pdfjsLib 不存在自動退回）。
  html = html.replace(/\s*<!-- PDF 履歷上傳用來抽文字[^>]*-->\s*<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/pdfjs-dist[^>]*><\/script>\n?/, "\n");

  // 把外部 styles.css 換成 inline <style>。
  html = html.replace(/<link rel="stylesheet" href="styles\.css">/, `<style>\n${styles}\n</style>`);

  // 把三支 <script src=...> 換成 inline，並在 app.js 之前塞入遮蔽後的資料。
  const inlineScripts = `<script>${maskJs}</script>
<script>${dataJs}</script>
<script>window.__DEMO_DATA__ = ${JSON.stringify(maskedData)};</script>
<script>${appJs}</script>`;
  html = html.replace(/<script src="mask\.js"><\/script>\s*<script src="data\.js"><\/script>\s*<script src="app\.js"><\/script>/, inlineScripts);

  if (/<script src=/.test(html)) {
    throw new Error("index.html 裡還留著外部 <script src>，inline 沒有完全套用");
  }

  const outDir = path.join(ROOT, "dist");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html);

  const stillHasRaw = JSON.stringify(rawData) !== JSON.stringify(maskedData);
  console.log(`已寫出 dist/index.html（${(html.length / 1024).toFixed(0)} KB）`);
  console.log(stillHasRaw ? "遮蔽規則有實際改動內容（原文與遮蔽後不同）。" : "警告：遮蔽規則沒有改動任何內容，請人工核對 demo-data.json 是否含原文。");
}

main();
