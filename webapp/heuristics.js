// 本機規則引擎 —— 真的會跑，輸入什麼文字就分析什麼文字，不是預先寫好的假資料。
//
// 這不是 ../prompt.md 描述的完整 AI 版本（那個版本是真的呼叫 LLM，見 ../results/
// 的驗證結果）。這裡是輕量版：用關鍵字/正規表達式在瀏覽器裡本機比對，讓你打字貼上
// 任何背景與 JD 都能馬上看到反應，不需要 API key、不需要網路連線。
// 抓到的東西比較粗，是這個取捨的代價，頁面上會清楚標示「本機規則版」。

const ROLE_VERBs = ["帶領", "主導", "負責", "決定", "管理", "規劃", "統籌", "帶過", "推動"];
const NUMBER_RE = /[\d一二三四五六七八九十]+[\d,.]*\s*(%|％|人|份|個|年|萬|億|K|k|倍|次)/g;

function splitSentences(text) {
  return text
    .split(/[。！？\n;；]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

function splitJdKeywords(jd) {
  return jd
    .split(/[、,，。/／\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length <= 12);
}

function runHeuristics(background, jd) {
  const bg = (background || "").trim();
  const jdText = (jd || "").trim();
  const out = [];

  if (!bg && !jdText) {
    return out;
  }

  const bgSentences = splitSentences(bg);

  // 1. 成果量化追問：句子裡有數字
  bgSentences
    .filter((s) => NUMBER_RE.test(s))
    .slice(0, 2)
    .forEach((s) => {
      out.push({
        category: "成果量化追問",
        question: `「${s}」——這個數字的基準是什麼？跟誰比、跟哪個時間點比？`,
        source_phrase: s,
        prep_note: "準備說明這個數字怎麼算出來、比較基準是什麼，以及自己的貢獻比例。",
      });
    });

  // 2. 角色與決策追問：句子裡有「帶領/主導/決定」等動詞，但沒有說明取捨過程
  bgSentences
    .filter((s) => ROLE_VERBs.some((v) => s.includes(v)))
    .slice(0, 2)
    .forEach((s) => {
      const verb = ROLE_VERBs.find((v) => s.includes(v));
      out.push({
        category: "角色與決策追問",
        question: `「${s}」——當時遇到跟別人意見不一致的情況嗎？你怎麼${verb}、怎麼取捨？`,
        source_phrase: s,
        prep_note: "準備一個具體的意見衝突或取捨情境，不要只描述結果。",
      });
    });

  // 3. JD 缺口追問：JD 提到的關鍵字，背景完全沒出現
  if (jdText) {
    const jdKeywords = splitJdKeywords(jdText);
    const gaps = jdKeywords.filter((k) => k.length >= 2 && !bg.includes(k));
    gaps.slice(0, 2).forEach((k) => {
      out.push({
        category: "JD 缺口追問",
        question: `JD 提到「${k}」，但背景完全沒提到，能否舉一個相關的實際案例？`,
        source_phrase: `JD：「${k}」`,
        prep_note: "若這確實是薄弱的一塊，準備誠實承認 + 具體補強計畫，比硬掰更可信。",
      });
    });
  }

  // 4. 動機一致性追問：背景字數過少、或 JD 與背景完全沒有共同詞
  if (jdText && bg) {
    const bgTokens = new Set(bg.match(/[一-龥]{2,4}/g) || []);
    const jdTokens = jdText.match(/[一-龥]{2,4}/g) || [];
    const overlap = jdTokens.some((t) => bgTokens.has(t));
    if (!overlap) {
      out.push({
        category: "動機一致性追問",
        question: "你的背景敘述跟這份 JD 的用詞幾乎沒有重疊，是什麼讓你想應徵這個職位？",
        source_phrase: "背景與 JD 用詞重疊度低",
        prep_note: "想清楚背景經驗跟這個職位之間的具體連結，準備一句話講清楚，不要只說「想學習」。",
      });
    }
  }
  if (bg.length > 0 && bg.length < 40) {
    out.push({
      category: "動機一致性追問",
      question: "背景描述目前偏簡短，你會怎麼具體說明過去經驗跟這個職位的關聯？",
      source_phrase: "背景字數偏少（" + bg.length + " 字）",
      prep_note: "背景越簡短，這類開放式追問越可能出現——建議先補充 1-2 個具體案例再上場。",
    });
  }

  return out;
}
