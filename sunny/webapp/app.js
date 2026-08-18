// Sunny 的 MVP demo — 純前端 wizard，不接資料庫、不接登入，跟團隊 mvp-scope.md 的排除項一致。
// 唯一「真」的環節是第 3 步：AI 追問預測是真的跑過（見 ../prompt.md、../results/），不是編的。

const STEPS = [
  "① 基本資訊", "② 履歷", "③ 進階問題", "④ 目標職位",
  "⑤ 投遞紀錄", "⑥ 履歷版本", "⑦ 迭代累積",
];

let state = {
  step: 0,
  personaId: PERSONAS[0].id,
  revealed: false,
};

function currentPersona() {
  return PERSONAS.find((p) => p.id === state.personaId);
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

function renderStagebar() {
  const bar = document.getElementById("stagebar");
  bar.innerHTML = "";
  STEPS.forEach((s, i) => {
    const cls = i === state.step ? "cur" : i < state.step ? "done" : "";
    const node = el(`<div class="stp ${cls}">${s}</div>`);
    node.addEventListener("click", () => goStep(i));
    bar.appendChild(node);
  });
  document.getElementById("personaPill").textContent =
    "示範 persona：" + currentPersona().label;
}

function goStep(i) {
  state.step = Math.max(0, Math.min(STEPS.length - 1, i));
  state.revealed = false;
  render();
}

function hitBadge(hit) {
  if (hit === "strong") return `<span class="hit hit-strong">強命中</span>`;
  if (hit === "weak") return `<span class="hit hit-weak">弱命中</span>`;
  return `<span class="hit hit-miss">未命中</span>`;
}

function renderStep0() {
  const p = currentPersona();
  const cards = PERSONAS.map(
    (x) => `
    <button class="persona ${x.id === p.id ? "sel" : ""}" data-id="${x.id}">
      <div class="pl">${x.label}</div>
      <div class="pr">${x.role} · ${x.industry}</div>
    </button>`
  ).join("");
  return `
    <div class="step-h"><h2>基本資訊</h2><span class="step-badge b-mock">示意</span></div>
    <p class="step-sub">選一位示範 persona——這三位都來自真實公開發表的面試心得（去識別化），不是憑空捏造的假資料。之後每一步都會用這位 persona 的真實背景與 JD 往下走。</p>
    <div class="card"><h3>選擇示範 persona</h3><div class="persona-grid">${cards}</div></div>
  `;
}

function renderStep1() {
  const p = currentPersona();
  return `
    <div class="step-h"><h2>履歷</h2><span class="step-badge b-mock">示意（內容真實）</span></div>
    <p class="step-sub">正式版這裡會是履歷上傳＋自動解析。這個 demo 直接把 persona 的真實背景貼出來，讓你看到接下來「進階問題」是根據什麼推論出來的。</p>
    <div class="card">
      <h3>${p.label} · 背景</h3>
      <textarea readonly>${p.background}</textarea>
      <div class="src-link">語料來源：<a href="${p.source}" target="_blank" rel="noopener">${p.source}</a>（已去識別化，僅用於本次驗證）</div>
    </div>
  `;
}

function renderStep2() {
  const p = currentPersona();
  const preds = p.predictions
    .map(
      (pr) => `
      <div class="pred">
        <span class="cat">${pr.category}</span>
        ${state.revealed ? hitBadge(pr.hit) : `<span class="hit hit-hidden">？</span>`}
        <div class="q">${pr.question}</div>
        <div class="sp">觸發句：「${pr.source_phrase}」</div>
        <div class="pn">${pr.prep_note}</div>
      </div>`
    )
    .join("");
  const realList = p.realQuestions.map((q) => `<li>${q}</li>`).join("");
  return `
    <div class="step-h"><h2>進階問題</h2><span class="step-badge b-real">真的跑過，非示意</span></div>
    <p class="step-sub">這是這次 MVP 真正要驗證的核心。下面的追問是用 <code>../prompt.md</code> 設計的 prompt，由「沒看過真實答案」的獨立 AI 產生——不是先看答案再回頭編的。</p>
    <div class="card">
      <h3>應徵職位 / JD</h3>
      <textarea readonly>${p.jd}</textarea>
    </div>
    <div class="card">
      <h3>AI 追問預測（${p.predictions.length} 題）</h3>
      ${preds}
      ${
        state.revealed
          ? `<div class="hitnote">${p.hitNote}</div>`
          : `<button class="btn" id="revealBtn">揭曉面試官實際問的問題，看命中率</button>`
      }
      ${
        state.revealed
          ? `<div class="real-panel"><b>面試官實際問的問題：</b><ol>${realList}</ol></div>`
          : ""
      }
    </div>
  `;
}

function renderStep3() {
  const p = currentPersona();
  const t = illustrativeTarget(p);
  return `
    <div class="step-h"><h2>目標職位 / 理想職位</h2><span class="step-badge b-mock">示意，這次沒做</span></div>
    <p class="step-sub">${t.note}</p>
    <div class="card">
      <h3>浮現中的目標（示意）</h3>
      <div class="sig">
        <div class="sigc"><div class="l">行為指向（投遞集中的職能）</div><div class="v">${t.behaviorSignal}</div></div>
        <div class="sigc"><div class="l">產業落點</div><div class="v">${t.passionSignal}</div></div>
      </div>
      <div class="mock-note">這一步在原始設計（<code>career-companion.zip</code>）裡是靠投遞紀錄累積慢慢浮現的，這次驗證 MVP 明確排除了 dashboard 與資料累積機制，所以只畫出畫面長相，數字是示意值。</div>
    </div>
  `;
}

function renderStep4() {
  const p = currentPersona();
  const apps = illustrativeApplications(p);
  const rows = apps
    .map(
      (a) => `<div class="approw"><span class="co">${a.company} · ${a.position}</span><span class="st">${a.resumeVersion} · ${a.status}</span></div>`
    )
    .join("");
  return `
    <div class="step-h"><h2>投遞紀錄 / 上傳 JD</h2><span class="step-badge b-mock">示意，這次沒做</span></div>
    <p class="step-sub">正式版這裡會是累積中的投遞紀錄，每筆記錄用的履歷版本與目前狀態。這次 demo 只放 2 筆示意紀錄 + 第 3 步用到的那份真實 JD，證明資料模型接得上，不代表這輪 MVP 做了完整投遞追蹤系統。</p>
    <div class="card"><h3>投遞紀錄（示意）</h3><div class="applist">${rows}</div></div>
  `;
}

function renderStep5() {
  const rv = illustrativeResumeVersions();
  const cards = rv
    .map(
      (r, i) => `<div class="rvi ${i === rv.length - 1 ? "best" : ""}"><div class="v">${r.v}</div><div class="m">${r.metric}</div><div class="l">${r.label}</div></div>`
    )
    .join("");
  return `
    <div class="step-h"><h2>履歷版本</h2><span class="step-badge b-mock">示意，這次沒做</span></div>
    <p class="step-sub">正式版這裡會追蹤每一版履歷對應的查看率／面試率。這次示意數字沿用原始提案（<code>career-companion.zip / career_custom_dashboard.html</code>）裡的假設情境，沒有真實使用者資料支撐。</p>
    <div class="card"><h3>履歷版本 × 成效（示意）</h3><div class="rv">${cards}</div></div>
  `;
}

function renderStep6() {
  return `
    <div class="step-h"><h2>履歷與經驗迭代</h2><span class="step-badge b-mock">概念說明</span></div>
    <p class="step-sub">資料累積越多，第 3 步「進階問題」與履歷建議理論上會越準——但這句話本身也需要被驗證，不是預設成立的。</p>
    <div class="closing">
      <h3>回到這次 MVP 真正要回答的兩個問題</h3>
      <ol>
        <li><b>AI 追問的進階問題，命不命中面試官真正會問的？</b>——第 3 步是這題的示範：3 筆語料裡，命中率隨面試官的問法風格（標準化技術題 vs. 數據/成果深挖題）明顯不同，細節見 <code>../results/hit-rate-summary.md</code>。</li>
        <li><b>AI 給的行動推薦，有沒有人真的照做並派上用場？</b>——這題需要真人質性訪談才能回答，這次 3 筆語料的示範還沒有資料，是下一步要做的事。</li>
      </ol>
      <p style="margin:10px 0 0;font-size:12.5px;color:var(--ink2)">
        第 ④⑤⑥ 步是刻意標示「示意」——它們是 <code>career-companion.zip</code> 原始提案裡完整旅程的樣子，但團隊在 <code>docs/mvp-scope.md</code> 已經決定這輪不做 dashboard、不做資料庫。這個 demo 選擇保留完整旅程的敘事，但誠實區分「哪一步是真的驗證過、哪一步只是畫給大家看未來要長什麼樣子」。
      </p>
    </div>
  `;
}

const RENDERERS = [
  renderStep0, renderStep1, renderStep2, renderStep3,
  renderStep4, renderStep5, renderStep6,
];

function render() {
  renderStagebar();
  const body = document.getElementById("stepBody");
  body.innerHTML = RENDERERS[state.step]();

  if (state.step === 0) {
    body.querySelectorAll(".persona").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.personaId = btn.dataset.id;
        render();
      });
    });
  }
  if (state.step === 2) {
    const rb = document.getElementById("revealBtn");
    if (rb) rb.addEventListener("click", () => { state.revealed = true; render(); });
  }

  const nav = el(`
    <div class="foot-nav">
      <button class="btn ghost" id="prevBtn" ${state.step === 0 ? "disabled" : ""}>← 上一步</button>
      <button class="btn" id="nextBtn" ${state.step === STEPS.length - 1 ? "disabled" : ""}>下一步 →</button>
    </div>
  `);
  body.appendChild(nav);
  document.getElementById("prevBtn").addEventListener("click", () => goStep(state.step - 1));
  document.getElementById("nextBtn").addEventListener("click", () => goStep(state.step + 1));
}

render();
