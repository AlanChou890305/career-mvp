// Sunny 的 MVP demo — app shell（onboarding → 底部導覽列首頁），
// 不接資料庫、不接登入伺服器，狀態存在瀏覽器 localStorage。
//
// 產品體驗 vs. 內部驗證，刻意分開：
//   - 一般畫面（onboarding、首頁、履歷、進階問題、投遞、履歷版本）是「假裝這是真產品」
//     的體驗——不會出現「示範 persona」「真實語料 vs 假資料」這類內部用語。
//   - 3 篇真實面試心得語料 + 命中率，是團隊要驗證的東西，不是產品功能，所以收在首頁最
//     下面一個不起眼的連結「🔬 內部驗證資料」裡，一般使用流程不會撞到它。
//   - 「進階問題」用的規則引擎（heuristics.js）讀取的是使用者自己在履歷/JD 打的文字，
//     不是查表。

const STORAGE_KEY = "sunny_mvp_demo_v4";
const TABS = [
  { id: "home", label: "首頁", icon: "🏠" },
  { id: "resume", label: "履歷", icon: "📄" },
  { id: "questions", label: "進階問題", icon: "💬" },
  { id: "apps", label: "投遞", icon: "📮" },
  { id: "versions", label: "履歷版本", icon: "🗂️" },
];

const BASIC_OPTIONS = {
  tenure: ["1年以下", "1–3年", "3–5年", "5–10年", "10年以上"],
  industry: ["科技/軟體", "金融", "零售/電商", "傳產/製造", "服務業", "其他"],
  skills: ["溝通協調", "專案管理", "數據分析", "設計", "程式", "業務", "行銷", "內容"],
  status: ["在職、想轉換", "待業、找工作中", "剛畢業", "只是先看看"],
};

function defaultState() {
  return {
    onboarded: false,
    obStep: 0,
    obReturnTo: null,
    tab: "home",
    basics: { tenure: "", industry: "", skills: [], status: "" },
    resume: "",
    jd: "",
    heuristicResults: [],
    applications: [],
    resumeVersions: [],
    recAdoption: {},
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

function renderOnboardingBasics() {
  const b = state.basics;
  const chipRow = (key, options, multi) => options.map((opt) => {
    const on = multi ? b[key].includes(opt) : b[key] === opt;
    return `<button class="optchip ${on ? "on" : ""}" data-obkey="${key}" data-obval="${opt}" data-multi="${multi ? 1 : 0}">${opt}</button>`;
  }).join("");

  return `
    <div class="view">
      <div class="ob-dots"><span class="dot on"></span><span class="dot"></span></div>
      <div class="h1">先簡單認識你一下</div>
      <p class="sub">3-4 個小問題，之後也可以在「履歷」分頁改。</p>
      <div class="card">
        <h3>目前年資？</h3>
        <div class="optwrap">${chipRow("tenure", BASIC_OPTIONS.tenure, false)}</div>
      </div>
      <div class="card">
        <h3>目前／最近的產業？</h3>
        <div class="optwrap">${chipRow("industry", BASIC_OPTIONS.industry, false)}</div>
      </div>
      <div class="card">
        <h3>擅長的技能（可多選）</h3>
        <div class="optwrap">${chipRow("skills", BASIC_OPTIONS.skills, true)}</div>
      </div>
      <div class="card">
        <h3>你現在的狀態比較像？</h3>
        <div class="optwrap">${chipRow("status", BASIC_OPTIONS.status, false)}</div>
      </div>
      <button class="btn block" id="obNextBtn">${state.obReturnTo ? "儲存" : "下一步 →"}</button>
    </div>
  `;
}

function renderOnboardingResume() {
  return `
    <div class="view">
      <div class="ob-dots"><span class="dot"></span><span class="dot on"></span></div>
      <div class="h1">貼上你的背景／履歷</div>
      <p class="sub">正式版這裡會是履歷上傳＋自動解析，這個 demo 讓你直接貼文字。</p>
      <div class="card">
        <h3>背景／經歷</h3>
        <textarea id="obResume" placeholder="貼上或打字輸入你的背景、經歷…">${state.resume}</textarea>
        <h3 style="margin-top:12px">有沒有想投的職缺 JD？（選填）</h3>
        <textarea id="obJd" placeholder="貼上職缺描述…（沒有也可以先跳過，之後在「進階問題」補）">${state.jd}</textarea>
        <button class="linklike" id="useSampleBtn" type="button">沒有履歷？用範例履歷體驗 →</button>
      </div>
      <button class="btn block" id="obFinishBtn">完成，進入我的職涯夥伴</button>
    </div>
  `;
}

function wireOnboarding() {
  const screen = document.getElementById("screen");

  if (state.obStep === 0) {
    screen.querySelectorAll("[data-obkey]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.obkey, val = btn.dataset.obval, multi = btn.dataset.multi === "1";
        if (multi) toggleInArray(state.basics.skills, val);
        else state.basics[key] = state.basics[key] === val ? "" : val;
        saveState();
        render();
      });
    });
    document.getElementById("obNextBtn").addEventListener("click", () => {
      saveState();
      if (state.obReturnTo) {
        const back = state.obReturnTo;
        state.obReturnTo = null;
        state.tab = back;
        render();
      } else {
        state.obStep = 1;
        render();
      }
    });
  }

  if (state.obStep === 1) {
    document.getElementById("obResume").addEventListener("input", (e) => { state.resume = e.target.value; saveState(); });
    document.getElementById("obJd").addEventListener("input", (e) => { state.jd = e.target.value; saveState(); });
    document.getElementById("useSampleBtn").addEventListener("click", () => {
      const pool = realPersonas();
      const pick = pool[Math.floor(Math.random() * pool.length)];
      state.resume = pick.background;
      state.jd = pick.jd;
      saveState();
      toast("已帶入一份範例履歷");
      render();
    });
    document.getElementById("obFinishBtn").addEventListener("click", () => {
      state.onboarded = true;
      state.tab = "home";
      saveState();
      render();
    });
  }
}

// ================= 主要 App（onboarding 完成後） =================

function computeStats() {
  const recEntries = Object.values(state.recAdoption);
  const triedCount = recEntries.filter((r) => r.tried).length;
  const usefulCount = recEntries.filter((r) => r.tried && r.useful).length;
  const filled = [
    state.resume.trim().length > 30,
    state.jd.trim().length > 10,
    state.applications.length > 0,
    state.resumeVersions.length > 0,
    state.heuristicResults.length > 0,
  ];
  const completeness = Math.round((filled.filter(Boolean).length / filled.length) * 100);
  const freq = {};
  state.applications.forEach((a) => { freq[a.position] = (freq[a.position] || 0) + 1; });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return { triedCount, usefulCount, completeness, topRole: sorted[0], apps: state.applications.length, versions: state.resumeVersions.length, qCount: state.heuristicResults.length };
}

function renderHome() {
  const s = computeStats();
  const untried = state.heuristicResults.find((q) => !((state.recAdoption[q.id] || {}).tried));

  return `
    <div class="view">
      <div class="card hero">
        <div class="row between">
          <div>
            <div class="h1" style="color:#fff">嗨 👋</div>
            <div class="sub">${state.basics.industry || "還沒填產業"} · ${state.basics.status || "還沒填狀態"}</div>
          </div>
          <div class="ring" style="--pct:${s.completeness}"><div class="hole">${s.completeness}<small>%</small></div></div>
        </div>
        <div class="sub" style="margin-top:10px">資料完整度——履歷、JD、投遞紀錄、履歷版本都填了才會滿。</div>
      </div>

      <div class="statgrid">
        <div class="stat"><div class="ic">📮</div><div class="n">${s.apps}</div><div class="l">投遞紀錄</div></div>
        <div class="stat"><div class="ic">🗂️</div><div class="n">${s.versions}</div><div class="l">履歷版本</div></div>
        <div class="stat"><div class="ic">💬</div><div class="n">${s.qCount}</div><div class="l">已產生進階問題</div></div>
        <div class="stat"><div class="ic">✅</div><div class="n">${s.triedCount}</div><div class="l">已完成的準備建議</div></div>
      </div>

      <div class="card">
        <h3>⚡ 快速前往</h3>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <button class="btn subtle small" data-goto="resume">📄 編輯履歷</button>
          <button class="btn subtle small" data-goto="questions">💬 產生進階問題</button>
          <button class="btn subtle small" data-goto="apps">📮 新增投遞</button>
          <button class="btn subtle small" data-goto="versions">🗂️ 履歷版本</button>
        </div>
      </div>

      ${
        untried
          ? `<div class="card">
              <h3>💡 今天建議做的事</h3>
              <div class="sub">來自你在「進階問題」產生的準備建議</div>
              <div class="pn" style="background:var(--teal-bg);border:1px solid var(--teal-line);border-radius:12px;padding:11px 13px;font-size:12.5px">${untried.prep_note}</div>
              <button class="btn small" style="margin-top:10px" data-quicktried="${untried.id}">標記已完成</button>
            </div>`
          : `<div class="card"><h3>💡 今天建議做的事</h3><div class="mock-note">去「進階問題」分頁貼上職缺，產生你的第一批準備建議。</div></div>`
      }

      <button class="linklike" id="gotoValidation">🔬 內部驗證資料（給組員看）</button>
    </div>
  `;
}

function renderResume() {
  const b = state.basics;
  return `
    <div class="view">
      <div class="h1">履歷</div>
      <p class="sub">下面「進階問題」分頁會讀這裡目前的文字去分析。</p>
      <div class="card">
        <div class="row between">
          <h3 style="margin:0">基本資訊</h3>
          <button class="iconbtn" id="editBasicsBtn">✏️ 編輯</button>
        </div>
        <div class="sub" style="margin-top:6px">${b.tenure || "—"} · ${b.industry || "—"} · ${b.status || "—"}${b.skills.length ? " · " + b.skills.join("、") : ""}</div>
      </div>
      <div class="card">
        <h3>你的背景／履歷內容</h3>
        <textarea id="resumeInput" placeholder="貼上或打字輸入你的背景、經歷…">${state.resume}</textarea>
      </div>
    </div>
  `;
}

function renderQuestions() {
  const cards = state.heuristicResults.map((pr) => {
    const st = state.recAdoption[pr.id] || {};
    return `
    <div class="pred">
      <span class="cat">${pr.category}</span>
      <div class="q">${pr.question}</div>
      <div class="sp">依據：「${pr.source_phrase}」</div>
      <div class="pn">${pr.prep_note}</div>
      <div class="rec-row" style="border:0;padding-top:8px">
        <label><input type="checkbox" data-reckey="${pr.id}" data-field="tried" ${st.tried ? "checked" : ""}> 已準備</label>
        <label><input type="checkbox" data-reckey="${pr.id}" data-field="useful" ${st.useful ? "checked" : ""}> 有幫助</label>
      </div>
    </div>`;
  }).join("");

  return `
    <div class="view">
      <div class="h1">進階問題</div>
      <p class="sub">JD 欄位可以自己改，按按鈕會分析「履歷」分頁目前的內容，猜面試官最可能追問的問題。</p>
      <div class="card">
        <h3>應徵職位 / JD</h3>
        <textarea id="jdInput">${state.jd}</textarea>
        <button class="btn block" id="genBtn" style="margin-top:10px">✨ 產生進階問題</button>
      </div>
      ${state.heuristicResults.length
        ? `<div class="card"><h3>🧩 AI 幫你想到的追問（${state.heuristicResults.length} 題）</h3>${cards}</div>`
        : `<div class="mock-note">還沒產生——按上面的按鈕分析目前的履歷跟 JD。</div>`}
    </div>
  `;
}

function renderApps() {
  const s = computeStats();
  const rvOptions = state.resumeVersions.map((r) => `<option value="${r.label}">${r.label}</option>`).join("") || "<option>v1</option>";
  const rows = state.applications.map((a) => `
    <div class="approw" style="flex-direction:column;align-items:stretch;gap:8px">
      <div class="row between">
        <span class="co"><span class="status-dot ${statusDotClass(a.status)}"></span>${a.company} · ${a.position}</span>
        <button class="iconbtn" data-delapp="${a.id}">🗑️</button>
      </div>
      <div class="row between">
        <span class="st">${a.resumeVersion} · ${a.status}${a.jd ? " · 已附 JD" : " · 未附 JD"}</span>
        ${a.jd ? `<button class="btn small subtle" data-useappjd="${a.id}">💬 用這份 JD 分析</button>` : ""}
      </div>
    </div>`).join("");

  return `
    <div class="view">
      <div class="h1">投遞紀錄</div>
      <p class="sub">新增一筆，首頁跟目標職能統計會馬上跟著變。附上 JD 之後可以直接一鍵去「進階問題」分析。</p>
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

const RENDERERS = { home: renderHome, resume: renderResume, questions: renderQuestions, apps: renderApps, versions: renderVersions, validation: renderValidation };

function renderTabbar() {
  const bar = document.getElementById("tabbar");
  if (!state.onboarded || state.tab === "validation") { bar.style.display = "none"; return; }
  bar.style.display = "flex";
  bar.innerHTML = "";
  TABS.forEach((t) => {
    const node = el(`<button class="tab ${t.id === state.tab ? "on" : ""}"><span class="ic">${t.icon}</span><span>${t.label}</span></button>`);
    node.addEventListener("click", () => { state.tab = t.id; render(); });
    bar.appendChild(node);
  });
}

let lastViewKey = null;
function render() {
  renderTabbar();
  const pill = document.getElementById("personaPill");
  pill.textContent = state.onboarded ? "你好" + (state.basics.status ? "，" + state.basics.status : "") : "先認識你一下";
  const screen = document.getElementById("screen");
  const viewKey = state.onboarded ? state.tab : "ob" + state.obStep;
  const changedView = viewKey !== lastViewKey;
  const prevScroll = screen.scrollTop;
  lastViewKey = viewKey;

  if (!state.onboarded) {
    screen.innerHTML = state.obStep === 0 ? renderOnboardingBasics() : renderOnboardingResume();
    screen.scrollTop = changedView ? 0 : prevScroll;
    wireOnboarding();
    return;
  }

  screen.innerHTML = RENDERERS[state.tab]();
  screen.scrollTop = changedView ? 0 : prevScroll;
  wireTab();
}

function wireTab() {
  const screen = document.getElementById("screen");

  screen.querySelectorAll("[data-goto]").forEach((btn) => btn.addEventListener("click", () => { state.tab = btn.dataset.goto; render(); }));

  if (state.tab === "home") {
    const g = document.getElementById("gotoValidation");
    if (g) g.addEventListener("click", () => { state.tab = "validation"; render(); });
    const qb = screen.querySelector("[data-quicktried]");
    if (qb) qb.addEventListener("click", () => {
      const id = qb.dataset.quicktried;
      state.recAdoption[id] = Object.assign({}, state.recAdoption[id], { tried: true });
      saveState();
      toast("✅ 已標記完成");
      render();
    });
  }

  if (state.tab === "validation") {
    document.getElementById("backFromValidation").addEventListener("click", () => { state.tab = "home"; render(); });
    screen.querySelectorAll("[data-valpersona]").forEach((btn) => {
      btn.addEventListener("click", () => { state.validationPersonaId = btn.dataset.valpersona; state.validationRevealed = false; render(); });
    });
    const rb = document.getElementById("revealValBtn");
    if (rb) rb.addEventListener("click", () => { state.validationRevealed = true; render(); });
  }

  if (state.tab === "resume") {
    document.getElementById("editBasicsBtn").addEventListener("click", () => {
      state.obReturnTo = "resume";
      state.obStep = 0;
      render();
    });
    const ta = document.getElementById("resumeInput");
    ta.addEventListener("input", () => { state.resume = ta.value; saveState(); });
  }

  if (state.tab === "questions") {
    const jdTa = document.getElementById("jdInput");
    jdTa.addEventListener("input", () => { state.jd = jdTa.value; saveState(); });

    document.getElementById("genBtn").addEventListener("click", () => {
      const raw = runHeuristics(state.resume, state.jd);
      state.heuristicResults = raw.map((r, i) => Object.assign({ id: "q-" + Date.now() + "-" + i }, r));
      saveState();
      toast(state.heuristicResults.length ? `✨ 產生了 ${state.heuristicResults.length} 題` : "內容太短，先多寫一點背景或 JD");
      render();
    });

    screen.querySelectorAll("input[data-reckey]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const key = cb.dataset.reckey, field = cb.dataset.field;
        state.recAdoption[key] = state.recAdoption[key] || {};
        state.recAdoption[key][field] = cb.checked;
        saveState();
      });
    });
  }

  if (state.tab === "apps") {
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

render();
