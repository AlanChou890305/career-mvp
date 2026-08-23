// Sunny 的 MVP demo — app shell（onboarding → 底部導覽列首頁），
// 不接資料庫、不接登入伺服器，狀態存在瀏覽器 localStorage。
//
// 產品體驗 vs. 內部驗證，刻意分開：
//   - 一般畫面（onboarding、首頁、履歷、追問、職缺、投遞、履歷版本）是「假裝這是真產品」
//     的體驗——不會出現「示範 persona」「真實語料 vs 假資料」這類內部用語。
//   - 3 篇真實面試心得語料 + 命中率，是團隊要驗證的東西，不是產品功能，一般使用流程
//     不會撞到它，入口是網址後面加 #validation。
//
// 內容資料（履歷、職缺、追問、面試回饋）不寫死在這支檔案裡，從 demo-data.json 載入，
// 見 loadData()。打包成單檔時，build 腳本會把這份 JSON 連同遮蔽規則一起 inline 進去，
// 屆時走 window.__DEMO_DATA__ 這條路徑，不再 fetch。

const STORAGE_KEY = "alan_mvp_demo_v1";
const TABS = [
  { id: "home", label: "主頁" },
  { id: "resume", label: "履歷" },
  { id: "job", label: "職缺" },
  { id: "apps", label: "投遞" },
  { id: "settings", label: "設定" },
];

const BASIC_OPTIONS = {
  openness: [
    { v: "積極找工作", d: "正在投遞，希望儘快有進展" },
    { v: "被動考慮機會", d: "有好機會會看，但不急" },
    { v: "暫不找工作", d: "先了解自己，還沒要動" },
  ],
  skillGroups: [
    { g: "產品與策略", items: ["產品規劃", "需求訪談", "PRD 撰寫", "Roadmap 規劃", "MVP 範疇定義", "競品分析", "商業模式"] },
    { g: "專案與流程", items: ["專案管理", "Scrum／敏捷", "Backlog 管理", "Release 規劃", "跨部門協作", "供應商管理"] },
    { g: "數據", items: ["數據分析", "A/B 測試", "事件追蹤規劃", "SQL", "指標定義", "漏斗與留存分析", "BI 儀表板"] },
    { g: "設計", items: ["使用者研究", "UI/UX 設計", "資訊架構", "原型製作", "設計系統", "Figma"] },
    { g: "技術", items: ["程式開發", "API 整合", "資料庫設計", "AI／LLM 應用", "自動化流程", "雲端部署", "資安設計"] },
    { g: "商業與溝通", items: ["行銷成長", "SEO／內容", "業務開發", "顧問交付", "客戶成功", "簡報提案", "英文工作能力"] },
  ],
  industries: [
    "軟體／SaaS", "電商／零售", "金融科技", "餐飲科技", "旅遊科技", "遊戲",
    "社群／內容", "教育科技", "醫療健康", "生技製藥", "硬體／製造", "半導體",
    "電信", "物流／供應鏈", "房地產科技", "能源／永續", "廣告行銷", "顧問服務",
    "媒體出版", "非營利／社會企業", "公部門", "還在探索",
  ],
  jobCats: ["軟體規劃／產品管理", "專案／程式管理", "軟體開發", "資料科學／分析", "UI/UX 設計",
            "行銷企劃", "業務／BD", "營運管理", "客戶成功", "顧問", "財務", "人資", "其他"],
  goalExamples: [
    "想找一個能同時定義產品規格、又能自己判斷技術可行性的位置。不想只寫文件。",
    "希望三年內能對一條產品線的商業結果負責，而不只是負責交付。",
    "現在的產業成長有限，想換到節奏快一點、能學到新東西的地方。",
  ],
};

// Framework7 Icons（MIT）· SF Symbols 風格。ICONS 是填充變體（選中態），
// ICONS_OFF 是線性變體（未選中態），tabbar 依狀態取用。
const f7 = (n) => `<i class="f7-icons">${n}</i>`;
const ICONS = {
  home: f7("house_fill"),
  resume: f7("doc_text_fill"),
  job: f7("briefcase_fill"),
  apps: f7("chart_bar_fill"),
  after: f7("arrow_counterclockwise"),
  settings: f7("gear_alt_fill"),
};
const ICONS_OFF = {
  home: f7("house"),
  settings: f7("gear_alt"),
  resume: f7("doc_text"),
  job: f7("briefcase"),
  apps: f7("chart_bar"),
};

const OB_STEPS = ["積極程度", "職涯目標", "技能", "職稱", "產業"];

const LOCKS = [
  { id: "fitAdvice", name: "適配職缺方向建議", need: "上傳履歷", tab: "resume",
    why: "要讀得到你的實際經歷，才給得出方向，不然只能照職稱猜。" },
  { id: "jdMatch", name: "JD 匹配分數", need: "貼一份 JD並回答追問", tab: "job",
    why: "分數是「你 × 這份 JD」算出來的，而且要先回答過 AI 的追問——匹配分數是被延後的，不是貼上 JD 就立刻給。" },
  { id: "appTable", name: "投遞結果、進度數據表", need: "新增一筆投遞紀錄", tab: "apps",
    why: "這一塊要你回來更新才會長出東西——它量的是累積，不是單次。" },
];

function defaultState() {
  return {
    onboarded: false,
    obStep: 0,
    obReturnTo: null,
    tab: "home",
    basics: { openness: "", goal: "", skills: [], curTitle: "", curCat: "", tgtTitle: "", tgtCat: "", industries: [] },
    resume: "",
    resumes: [],          // 最多 3 份，選填
    openResume: null,
    demoMask: true,
    afterAppId: null,      // 示範模式：畫面上遮蔽個資與公司名
    draftLabel: "",
    draftText: "",
    jd: "",
    followupAnswers: {},   // AI 追問的回答：{f1:"..."}
    applications: [],
    resumeVersions: [],
    recAdoption: {},
    planAdopt: {},     // 方向型建議：{p1:{done:true}}
    prepAdopt: {},     // 面試準備：{j1:{planned, didIt, note, usedIt, usefulness}}
    gapHitAnswers: {}, // 缺口診斷命中：{g1:"沒被碰到"}
    actualRaw: "",     // 面試官實際問的問題（一行一題）
    actualLocked: false,
    actualLockedAt: null,
    // 內部驗證畫面用，跟一般使用者體驗無關
    validationPersonaId: realPersonas()[0].id,
    validationRevealed: false,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return Object.assign(defaultState(), JSON.parse(raw));
  } catch (e) {
    return defaultState();
  }
}

let state = loadState();
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

// ================= 資料層 =================
// 開發模式：同源 fetch demo-data.json（見 serve.sh）。
// 打包成單檔後：build 腳本會在這支檔案載入前寫入 window.__DEMO_DATA__，
// 這裡改讀那個全域變數，不再發 fetch（file:// 開啟時 fetch 本機檔案會被瀏覽器擋）。
let ALAN = null, ALAN_JOB = null, INTERVIEW_DEMO = null;

function applyData(data) {
  ALAN = data.profile;
  ALAN_JOB = data.job;
  INTERVIEW_DEMO = data.interviewDemo;
}

async function loadData() {
  if (window.__DEMO_DATA__) { applyData(window.__DEMO_DATA__); return; }
  const res = await fetch("demo-data.json");
  if (!res.ok) throw new Error("demo-data.json 讀不到，本機請用 serve.sh 開伺服器，不要直接開檔案");
  applyData(await res.json());
}
function el(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }

function toast(msg) {
  const host = document.getElementById("toastHost");
  const node = el(`<div class="toast">${msg}</div>`);
  host.appendChild(node);
  setTimeout(() => node.remove(), 1650);
}

function hitBadge(hit) {
  if (hit === "strong") return `<span class="hit hit-strong">強命中</span>`;
  if (hit === "weak") return `<span class="hit hit-weak">弱命中</span>`;
  return `<span class="hit hit-miss">未命中</span>`;
}
function statusDotClass(status) {
  if (status === "被查看") return "sd-view";
  if (status === "進面試") return "sd-intv";
  if (status === "收到 offer") return "sd-offer";
  if (status === "已婉拒/未錄取") return "sd-no";
  return "sd-none";
}
function toggleInArray(arr, v) {
  const i = arr.indexOf(v);
  if (i === -1) arr.push(v); else arr.splice(i, 1);
  return arr;
}

// ================= Onboarding =================

function basicsDone() {
  const b = state.basics;
  return !!(b.openness && b.goal.trim().length > 5 && b.skills.length && b.tgtTitle.trim() && b.industries.length);
}
function stepOk(n) {
  const b = state.basics;
  return [!!b.openness, b.goal.trim().length > 5, b.skills.length > 0, !!b.tgtTitle.trim(), b.industries.length > 0][n];
}

function obShell(n, title, hint, body, wide) {
  const last = n === 4;
  return `
    <div class="view obwrap">
      <div class="prog">${OB_STEPS.map((_, i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</div>
      <div class="stepno">第 ${n + 1} 題 · 共 5 題</div>
      <div class="qtitle">${title}</div>
      <div class="qhint">${hint}</div>
      ${body}
      <div class="obfoot">
        ${n > 0 ? `<button class="btn back" id="obBack">← 上一步</button>` : ""}
        <button class="btn" id="obNextBtn">${last ? "產生我的 Dashboard" : "下一步 →"}</button>
      </div>
      ${n === 0 ? `<button class="linklike" id="useSampleBtn" type="button">用示範資料快速體驗 →</button>` : ""}
    </div>`;
}

function renderOnboardingBasics() {
  const b = state.basics, n = state.obStep;

  if (n === 0) {
    return obShell(0, "你現在找工作的積極程度？",
      "這一題決定我們多常提醒你、以及行動建議要排得多密——比「在職／求職中」更能反映真實情況。",
      `<div>${BASIC_OPTIONS.openness.map(o => `
        <button class="tcard ${b.openness === o.v ? "tgt" : ""}" data-obkey="openness" data-obval="${o.v}" data-multi="0"
          style="width:100%;text-align:left;cursor:pointer;font-family:inherit;display:block">
          <div class="th" style="margin:0 0 3px;font-size:var(--fs-body);color:${b.openness === o.v ? "var(--teal-d)" : "var(--ink)"}">
            ${b.openness === o.v ? "◉" : "○"} ${o.v}</div>
          <div class="sub" style="margin:0 0 0 20px">${o.d}</div>
        </button>`).join("")}</div>`);
  }

  if (n === 1) {
    return obShell(1, "你的職涯目標是什麼？",
      "用自己的話寫，不用工整、也不用完整。封閉式選項問不出真實情境，AI 會把這段話解析成 3 年／5 年的結構化目標。",
      `<textarea class="bigta" id="obGoal" placeholder="想到什麼寫什麼…">${b.goal}</textarea>
       <div class="exlabel">不知道怎麼寫？點一個當起點</div>
       ${BASIC_OPTIONS.goalExamples.map(x => `<div class="ex" data-ex="${x.replace(/"/g, "&quot;")}">${x}</div>`).join("")}`);
  }

  if (n === 2) {
    const on = b.skills;
    return obShell(2, "你擅長的技能與工具",
      "可以多選，選得越完整，之後的職缺匹配越準。沒把握的也可以選——這是技能庫，不是考試。",
      `${BASIC_OPTIONS.skillGroups.map(gr => `
        <div class="grp">${gr.g}</div>
        <div class="bigchips">${gr.items.map(it => `
          <button class="bigchip ${on.includes(it) ? "on" : ""}" data-obkey="skills" data-obval="${it}" data-multi="1">${it}</button>`).join("")}</div>`).join("")}
       <div class="selcount">已選 ${on.length} 項${on.length ? "" : "　至少選 1 項"}</div>`);
  }

  if (n === 3) {
    const cats = (id, val) => `<select id="${id}">
      <option value="">選擇職類…</option>
      ${BASIC_OPTIONS.jobCats.map(c => `<option ${val === c ? "selected" : ""}>${c}</option>`).join("")}</select>`;
    return obShell(3, "你現在的位置，和想去的位置",
      "104 明確指出「希望職稱＋希望職類」是企業搜尋比對最關鍵的兩個欄位，所以分開問。目標那張是必填。",
      `<div class="tcard now">
         <div class="th">◦ 現在</div>
         <label class="fl">職稱</label><input id="obCurTitle" placeholder="例：產品經理" value="${b.curTitle}">
         <label class="fl">職類</label>${cats("obCurCat", b.curCat)}
       </div>
       <div class="arrowmid">↓</div>
       <div class="tcard tgt">
         <div class="th">◎ 想去</div>
         <label class="fl">目標職稱　<span style="color:var(--red)">必填</span></label>
         <input id="obTgtTitle" placeholder="例：Technical Program Manager" value="${b.tgtTitle}">
         <label class="fl">目標職類</label>${cats("obTgtCat", b.tgtCat)}
       </div>`);
  }

  const on = b.industries;
  return obShell(4, "你想待的產業領域",
    "可以多選。這一題是用來縮小匹配池的——選太多等於沒選，但不確定也沒關係，最後一個選項是「還在探索」。",
    `<div class="bigchips">${BASIC_OPTIONS.industries.map(it => `
       <button class="bigchip ${on.includes(it) ? "on" : ""}" data-obkey="industries" data-obval="${it}" data-multi="1">${it}</button>`).join("")}</div>
     <div class="selcount">已選 ${on.length} 項${on.length ? "" : "　至少選 1 項"}</div>`);
}

function wireOnboarding() {
  const screen = document.getElementById("screen");
  const n = state.obStep;

  screen.querySelectorAll("[data-obkey]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.obkey, val = btn.dataset.obval, multi = btn.dataset.multi === "1";
      if (multi) toggleInArray(state.basics[key], val);
      else state.basics[key] = state.basics[key] === val ? "" : val;
      saveState();
      render();
    });
  });

  const bindIn = (id, key) => {
    const el2 = document.getElementById(id);
    if (el2) el2.addEventListener("input", () => { state.basics[key] = el2.value; saveState(); });
  };
  bindIn("obGoal", "goal"); bindIn("obCurTitle", "curTitle"); bindIn("obCurCat", "curCat");
  bindIn("obTgtTitle", "tgtTitle"); bindIn("obTgtCat", "tgtCat");

  screen.querySelectorAll("[data-ex]").forEach((d) => d.addEventListener("click", () => {
    state.basics.goal = d.dataset.ex; saveState(); render();
  }));

  const back = document.getElementById("obBack");
  if (back) back.addEventListener("click", () => { state.obStep = Math.max(0, n - 1); render(); });

  const us = document.getElementById("useSampleBtn");
  if (us) us.addEventListener("click", () => {
    state.basics = {
      openness: "積極找工作",
      goal: "想找一個能同時定義產品規格、又能自己判斷技術可行性的位置。不想只寫文件，也不想只做交付——想累積一段「上線之後把數字帶起來」的完整故事。",
      skills: ["產品規劃", "PRD 撰寫", "MVP 範疇定義", "跨部門協作", "事件追蹤規劃", "API 整合", "資料庫設計", "AI／LLM 應用", "顧問交付", "英文工作能力"],
      curTitle: "產品經理", curCat: "軟體規劃／產品管理",
      tgtTitle: "Technical Program Manager", tgtCat: "專案／程式管理",
      industries: ["軟體／SaaS", "餐飲科技", "金融科技"],
    };
    state.onboarded = true; state.tab = "home";
    saveState(); toast("已帶入示範資料"); render();
  });

  document.getElementById("obNextBtn").addEventListener("click", () => {
    const msgs = ["先選一個積極程度", "多寫幾個字，AI 才解析得出來", "至少選 1 項技能", "目標職稱是必填", "至少選 1 個產業"];
    if (!stepOk(n)) { toast(msgs[n]); return; }
    saveState();
    if (n < 4) { state.obStep = n + 1; render(); return; }
    if (state.obReturnTo) { const bk = state.obReturnTo; state.obReturnTo = null; state.tab = bk; }
    else { state.onboarded = true; state.tab = "home"; }
    render();
  });
}

// ================= 主要 App（onboarding 完成後） =================

function answeredFollowupIds() {
  return Object.keys(state.followupAnswers).filter((id) => (state.followupAnswers[id] || "").trim().length > 0);
}

function computeStats() {
  const recEntries = Object.values(state.recAdoption);
  const triedCount = recEntries.filter((r) => r.tried).length;
  const usefulCount = recEntries.filter((r) => r.tried && r.useful).length;
  const qCount = answeredFollowupIds().length;
  const filled = [
    state.resume.trim().length > 30,
    state.jd.trim().length > 10,
    state.applications.length > 0,
    state.resumeVersions.length > 0,
    qCount > 0,
  ];
  const completeness = Math.round((filled.filter(Boolean).length / filled.length) * 100);
  const freq = {};
  state.applications.forEach((a) => { freq[a.position] = (freq[a.position] || 0) + 1; });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return { triedCount, usefulCount, completeness, topRole: sorted[0], apps: state.applications.length, versions: state.resumeVersions.length, qCount };
}

function lv(x){ return x==="強"?100:x==="中"?60:30 }
function planDone(id){ return !!(state.planAdopt[id]||{}).done }
function unlocked(id){
  if (id==="fitAdvice") return state.resumes.length > 0;
  if (id==="jdHasFollowups") return state.jd.trim().length > 10;
  if (id==="jdMatch")   return state.jd.trim().length > 10 && answeredFollowupIds().length > 0;
  if (id==="appTable")  return state.applications.length > 0;
  return false;
}

function radar(items){
  const R=74, C=96, n=items.length;
  const pt=(i,r)=>{const a=-Math.PI/2 + i*2*Math.PI/n; return [C+r*Math.cos(a), C+r*Math.sin(a)]};
  const ring=(f)=>items.map((_,i)=>pt(i,R*f).map(v=>v.toFixed(1)).join(",")).join(" ");
  const poly=items.map((it,i)=>pt(i,R*it.v/100).map(v=>v.toFixed(1)).join(",")).join(" ");
  const labels=items.map((it,i)=>{
    const [x,y]=pt(i,R+17);
    const anch = x<C-6?"end":x>C+6?"start":"middle";
    return `<text x="${x.toFixed(1)}" y="${(y+3).toFixed(1)}" text-anchor="${anch}">${it.k}</text>`;
  }).join("");
  return `<svg class="radar" viewBox="0 0 192 200">
    ${[.25,.5,.75,1].map(f=>`<polygon points="${ring(f)}" class="grid"/>`).join("")}
    ${items.map((_,i)=>{const[x,y]=pt(i,R);return `<line x1="${C}" y1="${C}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="grid"/>`}).join("")}
    <polygon points="${poly}" class="area"/>
    ${items.map((it,i)=>{const[x,y]=pt(i,R*it.v/100);return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" class="dot"/>`}).join("")}
    <g class="rlab">${labels}</g>
  </svg>`;
}

function lockCard(L){
  return `<div class="card lock">
    <div class="row between"><h3 style="margin:0">🔒 ${L.name}</h3><span class="chip chip-mock">未解鎖</span></div>
    <div class="blurbox"><div class="fake"></div><div class="fake w70"></div><div class="fake w85"></div></div>
    <div class="sub" style="margin-top:10px">${L.why}</div>
    <button class="btn block subtle" data-goto="${L.tab}">${L.need} → 解鎖</button>
  </div>`;
}

function renderHome() {
  const b = state.basics, D = ALAN.dash;
  const need = LOCKS.filter(L=>!unlocked(L.id));
  const pct = Math.round((3 - need.length) / 3 * 100);

  return `
    <div class="view">
      <div class="maskchip"><span class="chip ${state.demoMask ? "chip-live" : "chip-mock"}">${state.demoMask ? "● 示範模式 · 個資與公司名已遮蔽" : "○ 顯示真實資訊"}</span></div>
      <div class="card hero">
        <div class="row between">
          <div>
            <div class="sub" style="margin:0">目前狀態</div>
            <div class="h1" style="margin:2px 0 0">${b.openness || "—"}</div>
            <div class="sub" style="margin:4px 0 0">${b.curTitle || "—"} → <b>${b.tgtTitle || "—"}</b></div>
          </div>
          <div class="ring" style="--pct:${pct}"><div class="hole">${pct}<small>%</small></div></div>
        </div>
        <div class="sub" style="margin:12px 0 0">進階模組解鎖進度：${3-need.length}/3</div>
      </div>

      <div class="card">
        <h3>職涯目標</h3>
        <div class="sub">AI 從你第 2 題的自然語言回答解析出來的</div>
        <div class="goal"><span class="gy">3 年</span><div>${D.goal3}</div></div>
        <div class="goal"><span class="gy gy5">5 年</span><div>${D.goal5}</div></div>
      </div>

      ${answeredFollowupIds().length ? `
      <div class="card">
        <h3>你補充的背景資訊</h3>
        <div class="sub">回答「AI 追問」之後回填在這裡，會一起用來調整方向建議與匹配分數</div>
        ${answeredFollowupIds().map(id => {
          const f = ALAN_JOB.diagnosis.followups.find(x => x.id === id);
          return f ? `<div class="ast"><div class="cn">${f.q}</div><div class="sub">${state.followupAnswers[id]}</div></div>` : "";
        }).join("")}
      </div>` : ""}

      <div class="card">
        <h3>工作類型</h3>
        <div class="tri"><span class="tl2">理想</span><div>${D.ideal.map(x=>`<span class="pill ok">${x}</span>`).join("")}</div></div>
        <div class="tri"><span class="tl2">目標</span><div>${D.target.map(x=>`<span class="pill mid">${x}</span>`).join("")}</div></div>
        <div class="tri"><span class="tl2">可接受</span><div>${D.accept.map(x=>`<span class="pill">${x}</span>`).join("")}</div></div>
      </div>

      <div class="card">
        <h3>技能能力方向</h3>
        <div class="sub">面積來自你的實際成果證據強度，不是自評</div>
        ${radar(D.radar)}
        ${ALAN.capabilities.map(c=>`
          <div class="cap">
            <div class="row between"><span class="cn">${c.name}</span><span class="tg tg-${c.level}">${c.level}</span></div>
            <div class="bar"><i style="width:${lv(c.level)}%" class="b-${c.level}"></i></div>
          </div>`).join("")}
      </div>

      ${unlocked("fitAdvice") ? `
      <div class="card">
        <div class="row between"><h3 style="margin:0">適配職缺方向建議</h3><span class="chip chip-real">已解鎖</span></div>
        ${ALAN.directions.map((d,i)=>`<div class="dir">
          <div class="dn"><span class="idx">${i+1}</span>${d.t}</div>
          <div class="dsub">${d.sub}</div>
          <div class="kw">${d.kw}</div>
          <div class="sub"><b>為什麼是你</b>　${d.why}</div>
          <div class="sub"><b>最缺的一塊</b>　${d.miss}</div>
        </div>`).join("")}
        <h3 style="margin-top:14px">你可能沒發現的資產</h3>
        ${ALAN.assets.map(a=>`<div class="ast"><div class="cn">${a.t}</div><div class="sub">${a.d}</div></div>`).join("")}
        <h3 style="margin-top:14px">短板</h3>
        ${ALAN.gaps.map(g=>`<div class="ast">
          <div class="row between"><span class="cn">${g.t}</span><span class="tg ${g.fix==="補得起來"?"tg-fix":"tg-avoid"}">${g.fix}</span></div>
          <div class="sub">${g.d}</div></div>`).join("")}
      </div>

      <div class="card">
        <div class="row between"><h3 style="margin:0">履歷調整方向</h3><span class="chip chip-live">週～月</span></div>
        <div class="sub">結果要下一次投遞才看得到——這是需要一直回來更新的那一種。</div>
        ${ALAN.plan.map(p=>{const on=planDone(p.id);return `
          <div class="rec ${on?"on":""}">
            <label class="rh"><input type="checkbox" data-plan="${p.id}" ${on?"checked":""}>
              <span class="rt">${p.t}</span></label>
            <div class="rm"><span class="chip">⏱ ${p.time}</span></div>
            <div class="sub"><b>完成條件</b>　${p.done}</div>
            <div class="sub"><b>補的是</b>　${p.fix}</div>
            <div class="sub warnl"><b>不做的話</b>　${p.skip}</div>
          </div>`}).join("")}
        <h3 style="margin-top:14px">這些建議沒有涵蓋的</h3>
        ${ALAN.planUncovered.map(x=>`<div class="sub" style="margin-bottom:8px">${x}</div>`).join("")}
      </div>` : lockCard(LOCKS[0])}

      ${unlocked("jdMatch") ? `
      <div class="card">
        <div class="row between"><h3 style="margin:0">JD 匹配分數</h3><span class="chip chip-real">已解鎖</span></div>
        <div class="scorewrap"><div class="score">${ALAN_JOB.match.score}<small>/100</small></div>
          <div class="sub" style="margin:0">${ALAN_JOB.company} · ${ALAN_JOB.position}</div></div>
        ${ALAN_JOB.match.parts.map(p=>`
          <div class="mrow"><span class="mk">${p.k}</span>
            <div class="bar"><i style="width:${p.v}%" class="${p.v>=70?'b-強':p.v>=40?'b-中':'b-弱'}"></i></div>
            <span class="mv">${p.v}</span></div>`).join("")}
        <button class="btn block subtle" data-goto="job" style="margin-top:10px">看完整分析 →</button>
      </div>` : lockCard(LOCKS[1])}

      ${unlocked("appTable")
        ? `<button class="linklike" data-goto="apps">投遞結果、進度已解鎖 → 看完整紀錄</button>`
        : lockCard(LOCKS[2])}
    </div>`;
}

const MAX_RESUMES = 3;

function renderResume() {
  const b = state.basics, rs = state.resumes, full = rs.length >= MAX_RESUMES;
  const cards = rs.map((r, i) => `
    <div class="rcard ${r.primary ? "pri" : ""}">
      <div class="row between">
        <div class="rttl">${r.primary ? `<span class="pritag">主要</span>` : ""}${r.label}</div>
        <div style="display:flex;gap:4px">
          ${r.primary ? "" : `<button class="iconbtn" data-setpri="${r.id}" title="設為主要">☆</button>`}
          <button class="iconbtn" data-delres="${r.id}">🗑️</button>
        </div>
      </div>
      <div class="rmeta">${r.text.length.toLocaleString()} 字 · 加入於 ${r.addedAt}</div>
      <div class="rprev">${r.text.slice(0, 90).replace(/\n/g, " ")}…</div>
      <button class="linklike" data-viewres="${r.id}" style="margin:6px 0 0">${state.openResume === r.id ? "收合" : "展開全文"}</button>
      ${state.openResume === r.id ? `<textarea data-editres="${r.id}" style="margin-top:8px">${r.text}</textarea>` : ""}
    </div>`).join("");

  return `
    <div class="view">
      <div class="h1">履歷</div>
      <p class="sub">選填，最多 ${MAX_RESUMES} 份。放不同版本可以在投遞時分開記錄，之後就看得出哪一版比較有回應。</p>

      <div class="card">
        <div class="row between"><h3 style="margin:0">Basic 5 題</h3>
          <button class="iconbtn" id="editBasicsBtn">✏️ 編輯</button></div>
        <div class="brow"><span>積極程度</span><b>${b.openness || "—"}</b></div>
        <div class="brow"><span>目前</span><b>${b.curTitle || "—"}${b.curCat ? " · " + b.curCat : ""}</b></div>
        <div class="brow"><span>目標</span><b>${b.tgtTitle || "—"}${b.tgtCat ? " · " + b.tgtCat : ""}</b></div>
        <div class="brow"><span>技能</span><b>${b.skills.join("、") || "—"}</b></div>
        <div class="brow"><span>產業</span><b>${b.industries.join("、") || "—"}</b></div>
        <div class="brow"><span>職涯目標</span><b style="font-weight:500">${b.goal || "—"}</b></div>
      </div>

      <div class="card">
        <div class="row between">
          <h3 style="margin:0">我的履歷</h3>
          <span class="chip ${rs.length ? "chip-real" : "chip-mock"}">${rs.length}/${MAX_RESUMES}</span>
        </div>
        ${rs.length
          ? cards
          : `<div class="emptybox">
               <div class="ei">📄</div>
               <div class="et">還沒有履歷</div>
               <div class="sub" style="margin:4px 0 0">沒有履歷也能用，但上傳之後才會出現
                 <b>適配職缺方向建議</b>與<b>履歷調整方向</b>。</div>
             </div>`}
      </div>

      ${full ? `<div class="mock-note">已達 ${MAX_RESUMES} 份上限，要新增請先刪掉一份。</div>` : `
      <div class="card">
        <h3>新增一份</h3>
        <div class="upl" id="uplBox">
          <input type="file" id="resFile" accept=".pdf,.txt,.md" hidden>
          <div class="ui2">📎</div>
          <div class="ut">上傳 PDF 履歷</div>
          <div class="us">或直接貼上文字</div>
        </div>
        <input class="field" id="resLabel" placeholder="版本名稱（例：主力版、產品經理版）" value="${state.draftLabel || ""}">
        <textarea class="field" id="resText" placeholder="貼上履歷全文，或先上傳 PDF">${state.draftText || ""}</textarea>
        <button class="btn block" id="addResBtn" style="margin-top:10px">＋ 新增履歷</button>
        <button class="linklike" id="useMyResume" type="button">帶入示範履歷 →</button>
      </div>`}
    </div>`;
}

function prepSt(id){ return state.prepAdopt[id]||{} }

function renderJob() {
  const J = ALAN_JOB;

  if (!unlocked("jdHasFollowups")) {
    return `
    <div class="view">
      <div class="h1">這份職缺</div>
      <p class="sub">貼上一份 JD，AI 會先指出落差、追問幾個問題，回答之後才會給匹配分數與面試前準備。</p>
      <div class="card">
        <h3>職缺 JD</h3>
        <textarea id="jdInput" placeholder="貼上職缺描述…">${state.jd}</textarea>
        <button class="linklike" id="useMyJd" type="button">帶入示範資料 →</button>
      </div>
    </div>`;
  }

  if (!unlocked("jdMatch")) {
    return `
    <div class="view">
      <div class="h1">這份職缺</div>
      <div class="card">
        <div class="row between"><h3 style="margin:0">JD 已收到</h3><span class="chip chip-live">${J.company} · ${J.position}</span></div>
        <div class="sub">在給你匹配分數之前，AI 先指出幾個落差、想追問幾個問題——回答至少 1 題之後才會顯示匹配分數與面試前準備。</div>
        <button class="btn block" data-goto="questions" style="margin-top:10px">看 AI 的追問 →</button>
      </div>
      ${lockCard(LOCKS[1])}
    </div>`;
  }
  const planned = J.prep.filter(p=>prepSt(p.id).planned).length;
  return `
    <div class="view">
      <div class="card jobhead">
        <div class="jc">${J.company}</div>
        <div class="jp">${J.position}</div>
        <div class="sub">${J.industry}</div>
        <div class="fmt">${J.format}</div>
      </div>

      <div class="card">
        <h3>你跟這份 JD 的落差</h3>
        <div class="fitrow"><span class="tg tg-強">符合</span><div>${J.fitStrong.map(x=>`<span class="pill ok">${x}</span>`).join("")}</div></div>
        <div class="fitrow"><span class="tg tg-中">證據薄</span><div>${J.fitWeak.map(x=>`<span class="pill mid">${x}</span>`).join("")}</div></div>
        <div class="fitrow"><span class="tg tg-弱">缺口</span><div>${J.fitMiss.map(x=>`<span class="pill bad">${x}</span>`).join("")}</div></div>
      </div>

      <div class="card">
        <div class="row between"><h3 style="margin:0">面試前準備</h3><span class="chip chip-live">${planned}/${J.prep.length} 打算做</span></div>
        <div class="sub">時間尺度是小時。勾「我打算做」之後，面試完到「面試後」分頁結算。</div>
        ${J.prep.map(p=>{const st=prepSt(p.id);return `
          <div class="rec ${st.planned?"on":""}">
            <label class="rh"><input type="checkbox" data-prep="${p.id}" ${st.planned?"checked":""}>
              <span class="rt">${p.t}</span></label>
            <div class="rm"><span class="chip">⏱ ${p.time}</span></div>
            <div class="sub"><b>完成條件</b>　${p.done}</div>
            <div class="sub"><b>對應缺口</b>　${p.gap}</div>
            <div class="sub warnl"><b>會用上的時刻</b>　${p.when}</div>
          </div>`}).join("")}
      </div>

      <div class="card">
        <h3>最可能被問倒的一題</h3>
        <div class="hardq">${J.hardest.q}</div>
        <div class="sub" style="margin:8px 0"><b>為什麼</b>　${J.hardest.why}</div>
        ${J.hardest.how.map(h=>`<div class="sub" style="margin-bottom:6px">${h}</div>`).join("")}
      </div>

      <div class="card">
        <h3>AI 猜這場會問的 8 題</h3>
        <div class="sub">面試後請先到「面試後」分頁填實際被問的題，再回來比對。</div>
        ${J.questions.map((q,i)=>`<div class="qq"><span class="n">${i+1}</span><div>${q}</div></div>`).join("")}
      </div>

      <div class="card">
        <h3>履歷上講不清楚的地方</h3>
        ${J.resumeGaps.map(g=>`<div class="ast"><div class="cn">${g.t}</div><div class="sub">${g.d}</div></div>`).join("")}
      </div>
    </div>`;
}

function renderQuestions() {
  const J = ALAN_JOB, D = J.diagnosis;
  const answered = answeredFollowupIds();
  return `
    <div class="view">
      <button class="linklike" id="backFromQuestions">← 回到職缺</button>
      <div class="h1">AI 先搞懂你，再給建議</div>
      <p class="sub">這是整段體驗裡唯一在回答「跟把履歷貼給一般 AI 聊天工具差在哪」的畫面——它先指出資訊哪裡不夠、跟這份 JD 差在哪，再問你幾個問題。匹配分數與面試前準備要等你回答之後才會出現。</p>

      <div class="card">
        <h3>資訊完整度：這幾塊還看不清楚</h3>
        ${D.completenessGaps.map(g => `<div class="ast"><div class="cn">${g.t}</div><div class="sub">${g.d}</div></div>`).join("")}
      </div>

      <div class="card">
        <div class="row between"><h3 style="margin:0">AI 想追問你的問題</h3><span class="chip chip-live">已答 ${answered.length}/${D.followups.length}</span></div>
        ${D.followups.map(f => `
          <div class="rec ${state.followupAnswers[f.id] && state.followupAnswers[f.id].trim() ? "on" : ""}">
            <div class="rt">${f.q}</div>
            <div class="sub"><b>為什麼問這題</b>　${f.why}</div>
            <textarea class="full" data-followup="${f.id}" placeholder="在這裡回答…" style="margin-top:8px">${state.followupAnswers[f.id] || ""}</textarea>
          </div>`).join("")}
      </div>

      ${answered.length > 0
        ? `<button class="btn block" data-goto="job" style="margin-top:4px">回答完了，看匹配分數與面試前準備 →</button>`
        : `<div class="mock-note">先回答至少 1 題，才會解鎖匹配分數與面試前準備。</div>`}
    </div>`;
}

function renderAfter() {
  const J = ALAN_JOB, ID = INTERVIEW_DEMO;
  const app = state.applications.find(a => a.id === state.afterAppId);
  const L = state.actualLocked;
  const acts = state.actualRaw.split("\n").map(x => x.trim()).filter(Boolean);
  const didUsed = J.prep.filter(p => prepSt(p.id).didIt && prepSt(p.id).usedIt).length;
  const did = J.prep.filter(p => prepSt(p.id).didIt).length;
  const planned = J.prep.filter(p => prepSt(p.id).planned).length;
  const gapHitLabels = ["沒被碰到", "被碰到但沒追問", "被追問", "答不好"];

  return `
    <div class="view">
      <button class="linklike" id="backFromAfter">← 回到投遞紀錄</button>
      <div class="h1">面試後回饋</div>
      <div class="sub">${app ? `${app.company} · ${app.position}　<span class="chip chip-live">${app.date || ""}</span>` : ""}</div>
      <p class="sub">順序不能顛倒：先憑記憶寫下實際被問的題並鎖定，才回「職缺」比對 AI 猜的 8 題。鎖定的時間會存下來，這樣才知道自己是真的記得，不是看了答案之後才想起來的。</p>
      ${ID.isMock ? `<div class="mock-note">${ID.note}（面試窗口：${ID.window}）</div>` : ""}

      <div class="card">
        <div class="row between"><h3 style="margin:0">① 面試官實際問了什麼</h3>
          ${L ? `<span class="chip chip-real">已鎖定</span>` : ``}</div>
        ${L
          ? `<ol class="acts">${acts.map(a => `<li>${a}</li>`).join("")}</ol>
             <div class="sub">鎖定於 ${state.actualLockedAt}　共 ${acts.length} 題</div>`
          : `<textarea id="actualIn" placeholder="一行一題，憑記憶寫，不要先去看 AI 猜的">${state.actualRaw}</textarea>
             <button class="btn block" id="lockBtn" style="margin-top:10px">🔒 鎖定（之後不能改）</button>
             <button class="linklike" id="useMockActual" type="button">面試還沒發生？先帶入示意資料看畫面 →</button>`}
      </div>

      <div class="card">
        <h3>② AI 事前指出的落差，面試中真的碰到了嗎</h3>
        <div class="sub">這是行動推薦的上游：AI 說「這裡講不清楚」，準不準要在這裡對答案。</div>
        ${J.resumeGaps.map((g, i) => {
          const id = "g" + (i + 1);
          const cur = state.gapHitAnswers[id] || "";
          return `<div class="rec">
            <div class="rt">${g.t}</div>
            <div class="sub">${g.d}</div>
            <select data-gaphit="${id}" style="margin-top:6px">
              <option value="">面試後再填…</option>
              ${gapHitLabels.map(l => `<option value="${l}" ${cur === l ? "selected" : ""}>${l}</option>`).join("")}
            </select>
          </div>`;
        }).join("")}
        ${ID.isMock ? `<button class="linklike" id="useMockGapHits" type="button">帶入示意資料 →</button>` : ""}
      </div>

      <div class="card">
        <h3>③ 面試前一天：做了嗎？</h3>
        <div class="sub">這一格要在面試前一天填，不是面試後回想——「做了沒」是面試前就該是的事實。純展示模式下這裡示範這個時點該長什麼樣。</div>
        ${planned === 0 ? `<div class="mock-note">還沒在「職缺」分頁勾任何一條「我打算做」。</div>`
        : J.prep.filter(p => prepSt(p.id).planned).map(p => { const st = prepSt(p.id); return `
          <div class="rec">
            <div class="rt">${p.t}</div>
            <div class="rec-row">
              <label><input type="checkbox" data-pf="${p.id}" data-f="didIt" ${st.didIt ? "checked" : ""}> 做了</label>
            </div>
            ${st.didIt ? "" : `<input class="full" data-note="${p.id}" placeholder="沒做的原因（這格的回答最有價值）" value="${(st.note || "").replace(/"/g, "&quot;")}">`}
          </div>`; }).join("")}
      </div>

      <div class="card">
        <h3>④ 面試後：用上了嗎？有沒有幫助？</h3>
        <div class="sub">跟③分開填，避免「已經知道哪條有用」污染「當初做了沒」的記憶。</div>
        ${planned === 0 ? `<div class="mock-note">還沒有勾任何一條準備。</div>`
        : J.prep.filter(p => prepSt(p.id).planned && prepSt(p.id).didIt).map(p => { const st = prepSt(p.id); return `
          <div class="rec">
            <div class="rt">${p.t}</div>
            <div class="rec-row">
              <label><input type="checkbox" data-pf="${p.id}" data-f="usedIt" ${st.usedIt ? "checked" : ""}> 面試中用上了</label>
            </div>
            <select data-usefulness="${p.id}" style="margin-top:6px">
              <option value="">主觀有沒有幫助？（附記，不是主判準）</option>
              ${["很有用","有點用","沒感覺","反而誤導"].map(l => `<option value="${l}" ${st.usefulness === l ? "selected" : ""}>${l}</option>`).join("")}
            </select>
          </div>`; }).join("")}
        ${J.prep.filter(p => prepSt(p.id).planned && !prepSt(p.id).didIt).length ? `<div class="mock-note">有勾但③還沒填「做了」的，這裡不會出現——先回③填。</div>` : ""}
      </div>

      <div class="card">
        <h3>⑤ 這批建議與追問，準不準</h3>
        <div class="thr">
          <div class="tl">建議做了且用上</div>
          <div class="tv">${didUsed} 條　${didUsed >= 2 ? `<span class="tg tg-強">看起來抓對方向</span>` : didUsed === 1 ? `<span class="tg tg-中">有一點效果，樣本太小不敢說</span>` : `<span class="tg tg-弱">目前沒有證據</span>`}</div>
        </div>
        <div class="thr">
          <div class="tl">追問命中率</div>
          <div class="tv">${L ? `待逐題比對（實際 ${acts.length} 題）` : `<span class="sub">等 ① 鎖定</span>`}</div>
        </div>
        <div class="thr">
          <div class="tl">採用率　打算做 → 真的做了</div>
          <div class="tv">${planned ? `${did}/${planned}` : `—`}</div>
        </div>
        ${L && acts.length < 4 ? `<div class="pend">面試官實際問的題數不到 4 題，樣本太少，這次的命中率參考價值有限。</div>` : ``}
      </div>
    </div>`;
}

// ================= 設定 =================

function renderSettings() {
  const n = state.applications.length, r = state.resumes.length;
  return `
    <div class="view">
      <div class="h1">設定</div>

      <div class="card">
        <h3>示範模式</h3>
        <div class="swrow">
          <div><div class="sn">遮蔽個資與公司名</div>
            <div class="sub" style="margin:2px 0 0">畫面上把姓名、電話、Email、雇主與合作夥伴換成代號。只影響顯示，存下來的資料還是原文。</div></div>
          <button class="sw ${state.demoMask ? "on" : ""}" id="maskSw"><i></i></button>
        </div>
        ${state.demoMask ? `<div class="sub" style="margin-top:8px">目前遮蔽 ${MASKS.length} 組詞。規則在 <code>mask.js</code>。</div>` : ""}
      </div>

      <div class="card">
        <h3>我的資料</h3>
        <div class="brow"><span>履歷</span><b>${r} / ${MAX_RESUMES} 份</b></div>
        <div class="brow"><span>投遞紀錄</span><b>${n} 筆</b></div>
        <div class="brow"><span>面試回饋</span><b>${state.actualLocked ? "已鎖定 " + state.actualLockedAt : "尚未填寫"}</b></div>
        <div class="brow"><span>儲存位置</span><b>這台裝置的瀏覽器</b></div>
        <button class="btn block subtle" id="exportBtn" style="margin-top:10px">匯出 JSON</button>
      </div>

      <div class="card">
        <h3>重置</h3>
        <div class="sub">清掉之後要重新回答 Basic 5 題。這台裝置以外的地方沒有備份。</div>
        <button class="btn block danger" id="resetBtn">清除全部資料</button>
      </div>

      <div class="card">
        <h3>關於</h3>
        <div class="sub">介面架構沿用 <b>Sunny</b> 在 <code>main</code> 分支上的 <code>sunny/webapp/</code>，
          內容與資料換成 Alan 這一輪的真實閉環。詳見 <code>webapp/ORIGIN.md</code>。</div>
        <div class="sub">AI 輸出由 <code>prompts/</code> 底下的 prompt 在本機跑出來後寫進資料檔，
          這個 demo 不即時呼叫 API。</div>
      </div>
    </div>`;
}

const DEMO_APPS = [
  { company: "inline 樂排", position: "Senior Technical Program Manager", resumeVersion: "v2 整合經驗版", status: "進面試", date: "08/19" },
  { company: "Appier", position: "Technical Product Manager", resumeVersion: "v2 整合經驗版", status: "被查看", date: "08/17" },
  { company: "Pinkoi", position: "Product Manager", resumeVersion: "v2 整合經驗版", status: "被查看", date: "08/15" },
  { company: "iCHEF", position: "Product Manager", resumeVersion: "v1 原版", status: "已婉拒/未錄取", date: "08/11" },
  { company: "Gogolook", position: "Technical PM", resumeVersion: "v1 原版", status: "投遞・無回應", date: "08/08" },
  { company: "KKday", position: "Senior PM", resumeVersion: "v1 原版", status: "投遞・無回應", date: "08/06" },
  { company: "Dcard", position: "Product Manager", resumeVersion: "v1 原版", status: "被查看", date: "08/04" },
  { company: "17LIVE", position: "Technical Program Manager", resumeVersion: "v1 原版", status: "投遞・無回應", date: "08/01" },
];

const FUNNEL = [
  { k: "投遞", of: () => true },
  { k: "被查看", of: (a) => ["被查看", "進面試", "收到 offer"].includes(a.status) },
  { k: "進面試", of: (a) => ["進面試", "收到 offer"].includes(a.status) },
  { k: "收到 offer", of: (a) => a.status === "收到 offer" },
];

function appStats() {
  const A = state.applications;
  const funnel = FUNNEL.map((f) => ({ k: f.k, n: A.filter(f.of).length }));
  const byVer = {};
  A.forEach((a) => {
    const v = a.resumeVersion || "未指定";
    byVer[v] = byVer[v] || { n: 0, seen: 0, itv: 0 };
    byVer[v].n++;
    if (["被查看", "進面試", "收到 offer"].includes(a.status)) byVer[v].seen++;
    if (["進面試", "收到 offer"].includes(a.status)) byVer[v].itv++;
  });
  return { funnel, byVer, total: A.length };
}

function renderAppDash() {
  const s = appStats();
  const max = s.funnel[0].n || 1;
  const vers = Object.entries(s.byVer).sort((a, b) => b[1].n - a[1].n);
  const best = vers.length > 1
    ? vers.slice().sort((a, b) => (b[1].seen / b[1].n) - (a[1].seen / a[1].n))[0]
    : null;

  return `
    <div class="card">
      <div class="row between"><h3 style="margin:0">投遞漏斗</h3>
        <span class="chip chip-real">${s.total} 筆</span></div>
      ${s.funnel.map((f, i) => {
        const prev = i ? s.funnel[i - 1].n : f.n;
        const rate = prev ? Math.round(f.n / prev * 100) : 0;
        return `<div class="fn">
          <div class="fl2"><span>${f.k}</span><b>${f.n}</b></div>
          <div class="fbar"><i style="width:${Math.round(f.n / max * 100)}%;background:${["#0E7C86","#3AA0A8","#5856D6","#34C759"][i]}"></i></div>
          ${i ? `<div class="frate">↳ 轉換 ${rate}%</div>` : ""}
        </div>`;
      }).join("")}
    </div>

    <div class="card">
      <h3>履歷版本 × 成效</h3>
      <div class="sub">同一批職缺、不同履歷版本的被查看率——這是「改履歷有沒有用」唯一看得出來的地方</div>
      ${vers.map(([v, d]) => {
        const seenPct = Math.round(d.seen / d.n * 100);
        return `<div class="vrow">
          <div class="row between"><span class="cn">${v}</span><span class="vn">${d.n} 筆</span></div>
          <div class="bar"><i style="width:${seenPct}%" class="${seenPct >= 60 ? "b-強" : seenPct >= 30 ? "b-中" : "b-弱"}"></i></div>
          <div class="sub">被查看 ${d.seen}／${d.n}（${seenPct}%）　進面試 ${d.itv}</div>
        </div>`;
      }).join("")}
      ${best && vers.length > 1
        ? `<div class="insight">📈 <b>${best[0]}</b> 的被查看率是 ${Math.round(best[1].seen / best[1].n * 100)}%，明顯高於其他版本。下一批投遞建議都用這一版。</div>`
        : `<div class="mock-note">只有一個版本，還比不出差異。到「履歷」分頁多存一版，之後投遞時分開記錄。</div>`}
    </div>
  `;
}

function renderApps() {
  const s = computeStats();
  const rvOptions = state.resumes.map((r) => `<option value="${r.label}">${r.label}</option>`).join("") || "<option value=\"未指定\">未指定履歷</option>";
  const rows = state.applications.map((a) => `
    <div class="approw" style="flex-direction:column;align-items:stretch;gap:8px">
      <div class="row between">
        <span class="co"><span class="status-dot ${statusDotClass(a.status)}"></span>${a.company} · ${a.position}</span>
        <button class="iconbtn" data-delapp="${a.id}">🗑️</button>
      </div>
      <div class="row between">
        <span class="st">${a.resumeVersion} · ${a.status}${a.jd ? "" : " · 未附 JD"}</span>
        ${a.jd ? `<button class="btn small subtle" data-useappjd="${a.id}">已附 JD → 看追問</button>` : ""}
      </div>
      <div class="row between">
        ${["進面試","收到 offer"].includes(a.status)
            ? `<button class="btn small ${state.afterAppId===a.id && state.actualLocked ? "subtle" : ""}" data-after="${a.id}">${state.afterAppId===a.id && state.actualLocked ? "✓ 已填回饋" : "↩ 填面試後回饋"}</button>`
            : `<span class="st">${a.date || ""}</span>`}
      </div>
    </div>`).join("");

  return `
    <div class="view">
      <div class="h1">投遞紀錄</div>
      <p class="sub">這一塊要回來更新才會長出東西——它量的是累積，不是單次。</p>

      ${state.applications.length ? renderAppDash() : `
        <div class="card">
          <div class="emptybox">
            <div class="ei">📮</div>
            <div class="et">還沒有投遞紀錄</div>
            <div class="sub" style="margin:4px 0 0">新增第一筆會解鎖<b>投遞結果、進度數據表</b>。</div>
          </div>
          <button class="btn block subtle" id="seedAppsBtn">帶入 8 筆示範紀錄 →</button>
        </div>`}
      ${s.topRole ? `<div class="card"><h3>🎯 目前浮現的目標</h3><div class="sub">投遞最集中的職能</div><div class="h1" style="margin:0">${s.topRole[0]} <span class="chip chip-live">${s.topRole[1]}/${s.apps} 筆</span></div></div>` : ""}
      <div class="card">
        <h3>新增投遞紀錄</h3>
        <div class="form-grid">
          <input class="full" id="appCompany" placeholder="公司名稱">
          <input class="full" id="appPosition" placeholder="應徵職位">
          <select id="appResumeVersion">${rvOptions}</select>
          <select id="appStatus">
            <option>投遞・無回應</option>
            <option>被查看</option>
            <option>進面試</option>
            <option>收到 offer</option>
            <option>已婉拒/未錄取</option>
          </select>
        </div>
        <textarea class="full" id="appJd" placeholder="貼上這個職缺的 JD（選填，之後可以在這筆紀錄上直接產生進階問題）" style="min-height:70px;margin-bottom:10px"></textarea>
        <button class="btn block" id="addAppBtn">➕ 新增</button>
      </div>
      <div class="card"><h3>目前紀錄（${state.applications.length} 筆）</h3><div class="applist">${rows || "<div class=\"mock-note\">尚無紀錄</div>"}</div></div>
    </div>
  `;
}

function renderVersions() {
  const cards = state.resumeVersions.map((r, i) => `
    <div class="rvi ${i === state.resumeVersions.length - 1 ? "best" : ""}">
      <div class="v">${r.label}</div>
      <div class="m">${r.viewRate}%</div>
      <div class="l">${r.note || "—"}</div>
      <button class="iconbtn" data-delrv="${r.id}" style="position:absolute;top:6px;right:6px">🗑️</button>
    </div>`).join("");
  return `
    <div class="view">
      <div class="h1">履歷版本</div>
      <p class="sub">新增版本與被查看率，投遞紀錄新增時可以選這裡的版本。</p>
      <div class="card">
        <h3>新增履歷版本</h3>
        <div class="form-grid">
          <input id="rvLabel" placeholder="版本名稱（v1）">
          <input id="rvRate" type="number" min="0" max="100" placeholder="被查看率 %">
          <input class="full" id="rvNote" placeholder="這版改了什麼">
        </div>
        <button class="btn block" id="addRvBtn">➕ 新增</button>
      </div>
      <div class="card"><h3>版本 × 成效（${state.resumeVersions.length} 版）</h3><div class="rvgrid">${cards || "尚無版本"}</div></div>
    </div>
  `;
}

// ================= 內部驗證（不是產品功能，給團隊看） =================

function renderValidation() {
  const p = PERSONAS.find((x) => x.id === state.validationPersonaId);
  const chips = realPersonas().map((x) => `<button class="optchip ${x.id === p.id ? "on" : ""}" data-valpersona="${x.id}">${x.label}</button>`).join("");
  return `
    <div class="view">
      <button class="linklike" id="backFromValidation">← 回到 App</button>
      <div class="h1">🔬 內部驗證資料</div>
      <p class="sub">這裡不是產品功能，是給 Alan／Berry 看的：3 篇真實面試心得語料，AI 追問預測 vs. 面試官實際問的問題，對照命中率。細節見 <code>../results/hit-rate-summary.md</code>。</p>
      <div class="optwrap" style="margin-bottom:12px">${chips}</div>
      <div class="card">
        <h3>背景</h3>
        <textarea readonly>${p.background}</textarea>
        <div class="src-link">來源：<a href="${p.source}" target="_blank" rel="noopener">${p.source}</a></div>
      </div>
      <div class="card">
        <h3>JD</h3>
        <textarea readonly>${p.jd}</textarea>
      </div>
      <div class="card">
        <h3>AI 追問預測（${p.predictions.length} 題，另開獨立 agent 生成，當時看不到答案）</h3>
        ${p.predictions.map((pr) => `
          <div class="pred">
            <span class="cat">${pr.category}</span>
            ${state.validationRevealed ? hitBadge(pr.hit) : `<span class="hit hit-hidden">？</span>`}
            <div class="q">${pr.question}</div>
            <div class="sp">觸發句：「${pr.source_phrase}」</div>
            <div class="pn">${pr.prep_note}</div>
          </div>`).join("")}
        ${state.validationRevealed
          ? `<div class="hitnote">${p.hitNote}</div><div class="real-panel"><b>面試官實際問的問題：</b><ol>${p.realQuestions.map((q) => `<li>${q}</li>`).join("")}</ol></div>`
          : `<button class="btn block" id="revealValBtn">🔓 揭曉面試官實際問的問題</button>`}
      </div>
    </div>
  `;
}

// ================= Router =================

const RENDERERS = { home: renderHome, resume: renderResume, job: renderJob, questions: renderQuestions, apps: renderApps, after: renderAfter, settings: renderSettings, versions: renderVersions, validation: renderValidation };

function renderTabbar() {
  const bar = document.getElementById("tabbar");
  if (!state.onboarded || ["validation","after","questions"].includes(state.tab)) { bar.style.display = "none"; return; }
  bar.style.display = "flex";
  bar.innerHTML = "";
  TABS.forEach((t) => {
    const node = el(`<button class="tab ${t.id === state.tab ? "on" : ""}"><span class="ic">${t.id === state.tab ? ICONS[t.id] : (ICONS_OFF[t.id] || ICONS[t.id])}</span><span>${t.label}</span></button>`);
    node.addEventListener("click", () => { state.tab = t.id; render(); });
    bar.appendChild(node);
  });
}

let lastViewKey = null;

function render() {
  renderTabbar();
  const screen = document.getElementById("screen");
  const viewKey = state.onboarded ? state.tab : "ob" + state.obStep;
  const changedView = viewKey !== lastViewKey;
  const prevScroll = screen.scrollTop;
  lastViewKey = viewKey;

  if (!state.onboarded) {
    screen.innerHTML = state.demoMask ? maskText(renderOnboardingBasics()) : renderOnboardingBasics();
    screen.scrollTop = changedView ? 0 : prevScroll;
    wireOnboarding();
    return;
  }

  screen.innerHTML = state.demoMask ? maskText(RENDERERS[state.tab]()) : RENDERERS[state.tab]();
  screen.scrollTop = changedView ? 0 : prevScroll;
  wireTab();
}

function wireTab() {
  const screen = document.getElementById("screen");

  screen.querySelectorAll("[data-goto]").forEach((btn) => btn.addEventListener("click", () => { state.tab = btn.dataset.goto; render(); }));

  if (state.tab === "home") {
    screen.querySelectorAll("input[data-plan]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const id = cb.dataset.plan;
        state.planAdopt[id] = Object.assign({}, state.planAdopt[id], { done: cb.checked });
        saveState();
        cb.closest(".rec").classList.toggle("on", cb.checked);
        if (cb.checked) toast("✅ 已完成");
      });
    });
  }

  if (state.tab === "validation") {
    document.getElementById("backFromValidation").addEventListener("click", () => {
      history.replaceState(null, "", location.pathname + location.search);
      state.tab = "home"; render();
    });
    screen.querySelectorAll("[data-valpersona]").forEach((btn) => {
      btn.addEventListener("click", () => { state.validationPersonaId = btn.dataset.valpersona; state.validationRevealed = false; render(); });
    });
    const rb = document.getElementById("revealValBtn");
    if (rb) rb.addEventListener("click", () => { state.validationRevealed = true; render(); });
  }

  if (state.tab === "resume") {
    document.getElementById("editBasicsBtn").addEventListener("click", () => {
      state.obReturnTo = "resume"; state.obStep = 0; state.onboarded = false; render();
    });

    const lab = document.getElementById("resLabel"), txt = document.getElementById("resText");
    if (lab) lab.addEventListener("input", () => { state.draftLabel = lab.value; saveState(); });
    if (txt) txt.addEventListener("input", () => { state.draftText = txt.value; saveState(); });

    const add = (label, text) => {
      if (state.resumes.length >= MAX_RESUMES) { toast(`最多 ${MAX_RESUMES} 份`); return; }
      if (text.trim().length < 30) { toast("履歷內容太短"); return; }
      const first = state.resumes.length === 0;
      state.resumes.push({
        id: "r-" + Date.now(),
        label: label.trim() || "v" + (state.resumes.length + 1),
        text: text.trim(),
        addedAt: new Date().toLocaleDateString("zh-TW"),
        primary: first,
      });
      state.resume = state.resumes.find(r => r.primary).text;
      state.draftLabel = ""; state.draftText = "";
      saveState();
      toast(first ? "🔓 已解鎖 2 個模組" : "➕ 已新增");
      render();
    };

    const ab = document.getElementById("addResBtn");
    if (ab) ab.addEventListener("click", () => add(lab.value, txt.value));

    const um = document.getElementById("useMyResume");
    if (um) um.addEventListener("click", () => add(lab.value || "示範履歷", ALAN.resumeText));

    const box = document.getElementById("uplBox"), fi = document.getElementById("resFile");
    if (box) {
      box.addEventListener("click", () => fi.click());
      fi.addEventListener("change", () => {
        const f = fi.files[0];
        if (!f) return;
        box.classList.add("busy");
        box.querySelector(".ut").textContent = f.name;
        box.querySelector(".us").innerHTML = "解析中…";
        const done = (text) => setTimeout(() => {
          box.classList.remove("busy");
          add(f.name.replace(/\.[^.]+$/, ""), text);
        }, 900);
        if (/\.(txt|md)$/i.test(f.name)) {
          const rd = new FileReader();
          rd.onload = () => done(String(rd.result));
          rd.readAsText(f);
        } else {
          // Demo：PDF 不做真的文字抽取，直接帶入示範內容
          done(ALAN.resumeText);
        }
      });
    }

    screen.querySelectorAll("[data-delres]").forEach((btn) => btn.addEventListener("click", () => {
      const id = btn.dataset.delres;
      const wasPri = (state.resumes.find(r => r.id === id) || {}).primary;
      state.resumes = state.resumes.filter(r => r.id !== id);
      if (wasPri && state.resumes.length) state.resumes[0].primary = true;
      state.resume = state.resumes.length ? state.resumes.find(r => r.primary).text : "";
      if (state.openResume === id) state.openResume = null;
      saveState(); toast("已刪除"); render();
    }));

    screen.querySelectorAll("[data-setpri]").forEach((btn) => btn.addEventListener("click", () => {
      state.resumes.forEach(r => { r.primary = r.id === btn.dataset.setpri; });
      state.resume = state.resumes.find(r => r.primary).text;
      saveState(); toast("已設為主要"); render();
    }));

    screen.querySelectorAll("[data-viewres]").forEach((btn) => btn.addEventListener("click", () => {
      state.openResume = state.openResume === btn.dataset.viewres ? null : btn.dataset.viewres;
      saveState(); render();
    }));

    screen.querySelectorAll("[data-editres]").forEach((ta) => ta.addEventListener("input", () => {
      const r = state.resumes.find(x => x.id === ta.dataset.editres);
      if (r) { r.text = ta.value; if (r.primary) state.resume = ta.value; saveState(); }
    }));
  }

  if (state.tab === "job") {
    const jt = document.getElementById("jdInput");
    if (jt) { jt.addEventListener("input", () => { state.jd = jt.value; saveState(); });
              jt.addEventListener("blur", () => render()); }
    const uj = document.getElementById("useMyJd");
    if (uj) uj.addEventListener("click", () => {
      state.jd = ALAN_JOB.jdText; saveState(); toast("🔓 已解鎖追問"); render();
    });
    screen.querySelectorAll("input[data-prep]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const id = cb.dataset.prep;
        state.prepAdopt[id] = Object.assign({}, state.prepAdopt[id], { planned: cb.checked });
        saveState();
        render();
      });
    });
  }

  if (state.tab === "questions") {
    document.getElementById("backFromQuestions").addEventListener("click", () => { state.tab = "job"; render(); });
    screen.querySelectorAll("[data-followup]").forEach((ta) => {
      ta.addEventListener("input", () => {
        state.followupAnswers[ta.dataset.followup] = ta.value;
        saveState();
      });
      ta.addEventListener("blur", () => render());
    });
  }

  if (state.tab === "settings") {
    document.getElementById("maskSw").addEventListener("click", () => {
      state.demoMask = !state.demoMask; saveState();
      toast(state.demoMask ? "已遮蔽個資與公司名" : "已顯示真實資訊");
      render();
    });
    document.getElementById("exportBtn").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "careerforge-state.json"; a.click();
      toast("已匯出");
    });
    document.getElementById("resetBtn").addEventListener("click", () => {
      if (!confirm("清除全部資料？Basic 5 題要重新回答，沒有備份。")) return;
      localStorage.removeItem(STORAGE_KEY);
      state = defaultState();
      render();
    });
  }

  if (state.tab === "after") {
    document.getElementById("backFromAfter").addEventListener("click", () => { state.tab = "apps"; render(); });
    const ta = document.getElementById("actualIn");
    if (ta) ta.addEventListener("input", () => { state.actualRaw = ta.value; saveState(); });
    const lb = document.getElementById("lockBtn");
    if (lb) lb.addEventListener("click", () => {
      const n = state.actualRaw.split("\n").map(x=>x.trim()).filter(Boolean).length;
      if (!n) { toast("先寫下實際被問的問題"); return; }
      if (!confirm(`鎖定 ${n} 題？鎖定後不能再改，這樣才知道自己是真的記得，不是看了答案之後才想起來的。`)) return;
      state.actualLocked = true;
      state.actualLockedAt = new Date().toLocaleString("zh-TW", { hour12: false });
      saveState();
      toast("🔒 已鎖定");
      render();
    });
    const uma = document.getElementById("useMockActual");
    if (uma) uma.addEventListener("click", () => {
      state.actualRaw = INTERVIEW_DEMO.actualQuestions.join("\n");
      saveState();
      toast("已帶入示意資料");
      render();
    });
    const umg = document.getElementById("useMockGapHits");
    if (umg) umg.addEventListener("click", () => {
      INTERVIEW_DEMO.gapHits.forEach((g, i) => { state.gapHitAnswers["g" + (i + 1)] = g.status; });
      saveState();
      toast("已帶入示意資料");
      render();
    });
    screen.querySelectorAll("select[data-gaphit]").forEach((sel) => {
      sel.addEventListener("change", () => {
        state.gapHitAnswers[sel.dataset.gaphit] = sel.value;
        saveState();
      });
    });
    screen.querySelectorAll("input[data-pf]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const id = cb.dataset.pf;
        state.prepAdopt[id] = Object.assign({}, state.prepAdopt[id], { [cb.dataset.f]: cb.checked });
        saveState();
        render();
      });
    });
    screen.querySelectorAll("input[data-note]").forEach((inp) => {
      inp.addEventListener("input", () => {
        const id = inp.dataset.note;
        state.prepAdopt[id] = Object.assign({}, state.prepAdopt[id], { note: inp.value });
        saveState();
      });
    });
    screen.querySelectorAll("select[data-usefulness]").forEach((sel) => {
      sel.addEventListener("change", () => {
        const id = sel.dataset.usefulness;
        state.prepAdopt[id] = Object.assign({}, state.prepAdopt[id], { usefulness: sel.value });
        saveState();
      });
    });
  }

  if (state.tab === "apps") {
    const sb = document.getElementById("seedAppsBtn");
    if (sb) sb.addEventListener("click", () => {
      state.applications = DEMO_APPS.map((a, i) => Object.assign({ id: "app-demo-" + i, jd: "" }, a));
      saveState();
      toast("🔓 已解鎖投遞結果、進度數據表");
      render();
    });
    document.getElementById("addAppBtn").addEventListener("click", () => {
      const company = document.getElementById("appCompany").value.trim();
      const position = document.getElementById("appPosition").value.trim();
      const resumeVersion = document.getElementById("appResumeVersion").value;
      const status = document.getElementById("appStatus").value;
      const jd = document.getElementById("appJd").value.trim();
      if (!company || !position) { toast("請填公司名稱與職位"); return; }
      state.applications.push({ id: "app-" + Date.now() + "-" + Math.floor(Math.random() * 1000), company, position, resumeVersion, status, jd });
      saveState();
      toast("➕ 已新增投遞紀錄");
      render();
    });
    screen.querySelectorAll("[data-after]").forEach((btn) => btn.addEventListener("click", () => {
      state.afterAppId = btn.dataset.after; state.tab = "after"; saveState(); render();
    }));
    screen.querySelectorAll("[data-delapp]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.applications = state.applications.filter((a) => a.id !== btn.dataset.delapp);
        saveState();
        toast("已刪除");
        render();
      });
    });
    screen.querySelectorAll("[data-useappjd]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const a = state.applications.find((x) => x.id === btn.dataset.useappjd);
        if (!a) return;
        state.jd = a.jd;
        state.tab = "questions";
        saveState();
        toast("已帶入「" + a.company + "」的 JD");
        render();
      });
    });
  }

  if (state.tab === "versions") {
    document.getElementById("addRvBtn").addEventListener("click", () => {
      const label = document.getElementById("rvLabel").value.trim();
      const viewRate = Number(document.getElementById("rvRate").value) || 0;
      const note = document.getElementById("rvNote").value.trim();
      if (!label) { toast("請填版本名稱"); return; }
      state.resumeVersions.push({ id: "rv-" + Date.now() + "-" + Math.floor(Math.random() * 1000), label, viewRate, note });
      saveState();
      toast("➕ 已新增履歷版本");
      render();
    });
    screen.querySelectorAll("[data-delrv]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.resumeVersions = state.resumeVersions.filter((r) => r.id !== btn.dataset.delrv);
        saveState();
        toast("已刪除");
        render();
      });
    });
  }
}

function checkValidationHash() {
  if (location.hash === "#validation" && state.onboarded) {
    state.tab = "validation";
    render();
  }
}
window.addEventListener("hashchange", checkValidationHash);

loadData()
  .then(() => { render(); checkValidationHash(); })
  .catch((e) => {
    document.getElementById("screen").innerHTML =
      `<div class="view"><div class="card"><h3>資料載入失敗</h3><div class="sub">${e.message}</div></div></div>`;
    console.error(e);
  });
