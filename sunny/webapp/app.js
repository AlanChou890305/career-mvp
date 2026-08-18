// Sunny 的 MVP demo — 純前端 app shell（底部導覽列 + 首頁 dashboard），
// 不接資料庫、不接登入伺服器，狀態存在瀏覽器 localStorage（關掉分頁、重新整理都還在）。
//
// 誰是「真的」、誰是「示意」：
//   - 履歷／JD 輸入框、投遞紀錄、履歷版本：真的能輸入/新增/刪除，真的會存。
//   - 「本機規則版」進階問題：真的會跑（heuristics.js），讀取當下輸入的文字。
//   - 「真實 AI 驗證結果」：只有 3 位真實語料 persona 才有，是另開獨立 agent 真的跑過、
//     事後對照命中率的結果（見 ../results/）。
//   - 行動推薦勾選框：量測介面，勾的是你自己，不是真實面試者的回饋。

const STORAGE_KEY = "sunny_mvp_demo_v3";
const TABS = [
  { id: "home", label: "首頁", icon: "🏠" },
  { id: "resume", label: "履歷", icon: "📄" },
  { id: "questions", label: "進階問題", icon: "💬" },
  { id: "apps", label: "投遞", icon: "📮" },
  { id: "versions", label: "履歷版本", icon: "🗂️" },
];

function defaultState() {
  const p = PERSONAS[0];
  return {
    tab: "home",
    personaId: p.id,
    resume: p.background,
    jd: p.jd,
    heuristicResults: [],
    revealedReal: false,
    applications: seedApplications(),
    resumeVersions: seedResumeVersions(),
    recAdoption: {},
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
function currentPersona() { return PERSONAS.find((p) => p.id === state.personaId) || PERSONAS[0]; }
function el(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }
function recKey(idx) { return state.personaId + ":" + idx; }

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

// ---------- 計算用的即時統計 ----------
function computeStats() {
  const realPs = realPersonas();
  const totalReal = realPs.reduce((n, p) => n + p.predictions.length, 0);
  const strongHits = realPs.reduce((n, p) => n + p.predictions.filter((x) => x.hit === "strong").length, 0);
  const recEntries = Object.values(state.recAdoption);
  const triedCount = recEntries.filter((r) => r.tried).length;
  const usefulCount = recEntries.filter((r) => r.tried && r.useful).length;
  const filled = [
    state.resume.trim().length > 30,
    state.jd.trim().length > 10,
    state.applications.length > 0,
    state.resumeVersions.length > 0,
    recEntries.length > 0,
  ];
  const completeness = Math.round((filled.filter(Boolean).length / filled.length) * 100);
  const freq = {};
  state.applications.forEach((a) => { freq[a.position] = (freq[a.position] || 0) + 1; });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return { totalReal, strongHits, triedCount, usefulCount, completeness, topRole: sorted[0], apps: state.applications.length, versions: state.resumeVersions.length };
}

// ---------- 首頁 ----------
function renderHome() {
  const s = computeStats();
  const p = currentPersona();
  const recs = p.actionRecommendations || [];
  const nextRec = recs.map((r, i) => ({ r, i })).find(({ i }) => !((state.recAdoption[recKey(i)] || {}).tried));

  return `
    <div class="view">
      <div class="card hero">
        <div class="row between">
          <div>
            <div class="h1" style="color:#fff">嗨，Sunny 👋</div>
            <div class="sub">目前示範：${p.label}</div>
          </div>
          <div class="ring" style="--pct:${s.completeness}"><div class="hole">${s.completeness}<small>%</small></div></div>
        </div>
        <div class="sub" style="margin-top:10px">資料完整度——履歷、JD、投遞紀錄、履歷版本、行動推薦都填了才會滿。</div>
      </div>

      <div class="statgrid">
        <div class="stat"><div class="ic">📮</div><div class="n">${s.apps}</div><div class="l">投遞紀錄</div></div>
        <div class="stat"><div class="ic">🗂️</div><div class="n">${s.versions}</div><div class="l">履歷版本</div></div>
        <div class="stat"><div class="ic">🎯</div><div class="n">${s.strongHits}/${s.totalReal}</div><div class="l">真實驗證強命中</div></div>
        <div class="stat"><div class="ic">✅</div><div class="n">${s.triedCount}</div><div class="l">行動推薦已照做</div></div>
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
        nextRec
          ? `<div class="card">
              <h3>💡 今天建議做的事</h3>
              <div class="sub" style="margin-bottom:8px">來自「${p.label}」的行動推薦，還沒被勾過</div>
              <div class="pn" style="background:var(--teal-bg);border:1px solid var(--teal-line);border-radius:12px;padding:11px 13px;font-size:12.5px">${nextRec.r}</div>
              <button class="btn small" style="margin-top:10px" data-quicktried="${nextRec.i}">標記已照做</button>
            </div>`
          : `<div class="card"><h3>💡 今天建議做的事</h3><div class="mock-note">這位 persona 目前沒有更多待勾選的行動推薦，去「進階問題」分頁看看，或換一位 persona。</div></div>`
      }

      <div class="card">
        <h3>📌 這次真正驗證的兩件事</h3>
        <div class="sub">3 篇真實語料共 ${s.totalReal} 題預測、${s.strongHits} 題強命中。行動推薦目前 ${s.triedCount} 條已照做、${s.usefulCount} 條標記有幫助（demo 自己勾的，非真人回饋）。細節見 <code>../results/hit-rate-summary.md</code>。</div>
      </div>
    </div>
  `;
}

// ---------- 履歷 ----------
function renderResume() {
  const p = currentPersona();
  const cards = PERSONAS.map((x) => {
    const badge = x.isMock ? `<span class="chip chip-mock">假資料</span>` : `<span class="chip chip-real">真實語料</span>`;
    return `<button class="persona ${x.id === p.id ? "sel" : ""}" data-id="${x.id}">
      <div class="pl">${x.label}</div>
      <div class="pr">${x.role}</div>
      <div style="margin-top:6px">${badge}</div>
    </button>`;
  }).join("");
  return `
    <div class="view">
      <div class="h1">履歷</div>
      <p class="sub">選一位示範 persona 快速帶入內容，或直接刪掉自己打字——下面「進階問題」分頁會讀這裡目前的文字。</p>
      <div class="persona-scroll">${cards}</div>
      <div class="card">
        <h3>你的背景／履歷內容</h3>
        <textarea id="resumeInput" placeholder="貼上或打字輸入你的背景、經歷…">${state.resume}</textarea>
        <div class="src-link">${p.isMock ? "示範假資料，可自由修改" : `語料來源：<a href="${p.source}" target="_blank" rel="noopener">${p.source}</a>（已去識別化），可自由修改`}</div>
      </div>
    </div>
  `;
}

// ---------- 進階問題 ----------
function renderQuestions() {
  const p = currentPersona();
  const heuristicCards = state.heuristicResults.map((pr) => `
    <div class="pred">
      <span class="cat">${pr.category}</span>
      <div class="q">${pr.question}</div>
      <div class="sp">觸發句：「${pr.source_phrase}」</div>
      <div class="pn">${pr.prep_note}</div>
    </div>`).join("");

  const realSection = !p.isMock
    ? `<div class="card">
        <h3>🔬 真實 AI 驗證結果（${p.predictions.length} 題）</h3>
        <div class="sub">另開獨立 agent 生成，當時看不到答案</div>
        ${p.predictions.map((pr) => `
          <div class="pred">
            <span class="cat">${pr.category}</span>
            ${state.revealedReal ? hitBadge(pr.hit) : `<span class="hit hit-hidden">？</span>`}
            <div class="q">${pr.question}</div>
            <div class="sp">觸發句：「${pr.source_phrase}」</div>
            <div class="pn">${pr.prep_note}</div>
          </div>`).join("")}
        ${state.revealedReal
          ? `<div class="hitnote">${p.hitNote}</div><div class="real-panel"><b>面試官實際問的問題：</b><ol>${p.realQuestions.map((q) => `<li>${q}</li>`).join("")}</ol></div>`
          : `<button class="btn block" id="revealBtn">🔓 揭曉面試官實際問的問題</button>`}
      </div>`
    : `<div class="mock-note">這位是示範假資料 persona，沒有真實面試記錄可以對照，不顯示命中率。</div>`;

  const recs = p.actionRecommendations || [];
  const recRows = recs.map((r, idx) => {
    const key = recKey(idx);
    const st = state.recAdoption[key] || {};
    return `<div class="rec-row">
      <div class="rec-text">${r}</div>
      <label><input type="checkbox" data-reckey="${key}" data-field="tried" ${st.tried ? "checked" : ""}> 已照做</label>
      <label><input type="checkbox" data-reckey="${key}" data-field="useful" ${st.useful ? "checked" : ""}> 有幫助</label>
    </div>`;
  }).join("");

  return `
    <div class="view">
      <div class="h1">進階問題 <span class="chip chip-live">核心功能</span></div>
      <p class="sub">JD 欄位可以自己改，按按鈕會真的用瀏覽器裡的規則引擎分析「履歷」分頁目前的內容。</p>
      <div class="card">
        <h3>應徵職位 / JD</h3>
        <textarea id="jdInput">${state.jd}</textarea>
        <button class="btn block" id="genBtn" style="margin-top:10px">✨ 產生進階問題（本機規則版）</button>
      </div>
      ${state.heuristicResults.length
        ? `<div class="card"><h3>🧩 本機規則版分析結果（${state.heuristicResults.length} 題）</h3>${heuristicCards}</div>`
        : `<div class="mock-note">還沒產生——按上面的按鈕會讀取「履歷」分頁目前的內容分析。</div>`}
      ${realSection}
      ${recs.length ? `<div class="card"><h3>📋 行動推薦——你真的照做了嗎？</h3><p class="sub">勾選會存起來，累計到首頁的採用率。</p>${recRows}</div>` : ""}
    </div>
  `;
}

// ---------- 投遞紀錄 ----------
function renderApps() {
  const s = computeStats();
  const rvOptions = state.resumeVersions.map((r) => `<option value="${r.label}">${r.label}</option>`).join("");
  const rows = state.applications.map((a) => `
    <div class="approw">
      <span class="co"><span class="status-dot ${statusDotClass(a.status)}"></span>${a.company} · ${a.position}</span>
      <span class="row" style="gap:8px"><span class="st">${a.resumeVersion} · ${a.status}</span><button class="iconbtn" data-delapp="${a.id}">🗑️</button></span>
    </div>`).join("");

  return `
    <div class="view">
      <div class="h1">投遞紀錄</div>
      <p class="sub">新增一筆，首頁跟目標職能統計會馬上跟著變。</p>
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
        <button class="btn block" id="addAppBtn">➕ 新增</button>
      </div>
      <div class="card"><h3>目前紀錄（${state.applications.length} 筆）</h3><div class="applist">${rows || "<div class=\"mock-note\">尚無紀錄</div>"}</div></div>
    </div>
  `;
}

// ---------- 履歷版本 ----------
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
          <input id="rvLabel" placeholder="版本名稱（v4）">
          <input id="rvRate" type="number" min="0" max="100" placeholder="被查看率 %">
          <input class="full" id="rvNote" placeholder="這版改了什麼">
        </div>
        <button class="btn block" id="addRvBtn">➕ 新增</button>
      </div>
      <div class="card"><h3>版本 × 成效（${state.resumeVersions.length} 版）</h3><div class="rvgrid">${cards || "尚無版本"}</div></div>
    </div>
  `;
}

const RENDERERS = { home: renderHome, resume: renderResume, questions: renderQuestions, apps: renderApps, versions: renderVersions };

function renderTabbar() {
  const bar = document.getElementById("tabbar");
  bar.innerHTML = "";
  TABS.forEach((t) => {
    const node = el(`<button class="tab ${t.id === state.tab ? "on" : ""}"><span class="ic">${t.icon}</span><span>${t.label}</span></button>`);
    node.addEventListener("click", () => goTab(t.id));
    bar.appendChild(node);
  });
}

function goTab(id) {
  state.tab = id;
  render();
}

function render() {
  renderTabbar();
  document.getElementById("personaPill").textContent = "示範 persona：" + currentPersona().label + (currentPersona().isMock ? "（假資料）" : "（真實語料）");
  const screen = document.getElementById("screen");
  screen.innerHTML = RENDERERS[state.tab]();
  screen.scrollTop = 0;
  wireTab();
}

function wireTab() {
  const screen = document.getElementById("screen");

  screen.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => goTab(btn.dataset.goto));
  });

  if (state.tab === "home") {
    const qb = screen.querySelector("[data-quicktried]");
    if (qb) qb.addEventListener("click", () => {
      const idx = qb.dataset.quicktried;
      const key = recKey(idx);
      state.recAdoption[key] = Object.assign({}, state.recAdoption[key], { tried: true });
      saveState();
      toast("✅ 已標記照做");
      render();
    });
  }

  if (state.tab === "resume") {
    screen.querySelectorAll(".persona").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = PERSONAS.find((x) => x.id === btn.dataset.id);
        state.personaId = p.id;
        state.resume = p.background;
        state.jd = p.jd;
        state.heuristicResults = [];
        state.revealedReal = false;
        saveState();
        toast("已套用「" + p.label + "」");
        render();
      });
    });
    const ta = document.getElementById("resumeInput");
    ta.addEventListener("input", () => { state.resume = ta.value; saveState(); });
  }

  if (state.tab === "questions") {
    const jdTa = document.getElementById("jdInput");
    jdTa.addEventListener("input", () => { state.jd = jdTa.value; saveState(); });

    document.getElementById("genBtn").addEventListener("click", () => {
      state.heuristicResults = runHeuristics(state.resume, state.jd);
      saveState();
      toast(state.heuristicResults.length ? `✨ 產生了 ${state.heuristicResults.length} 題` : "內容太短，先多寫一點背景或 JD");
      render();
    });

    const rb = document.getElementById("revealBtn");
    if (rb) rb.addEventListener("click", () => { state.revealedReal = true; saveState(); render(); });

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
      if (!company || !position) { toast("請填公司名稱與職位"); return; }
      state.applications.push({ id: "app-" + Date.now() + "-" + Math.floor(Math.random() * 1000), company, position, resumeVersion, status });
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
