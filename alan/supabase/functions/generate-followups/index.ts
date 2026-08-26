import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

// 本機規則引擎——搬自 alan/webapp/heuristics.js，目前沒接 Claude API（還沒儲值），
// 先用關鍵字/正規表達式在伺服器邊比對履歷與 JD，不叫任何 LLM、不花錢。
// 之後接上 API key 後，只需換按1 個函數內容，前端不用改。

const ROLE_VERBS = ["帶領", "主導", "負責", "決定", "管理", "視劃", "統籹", "帶過", "推動"];
const NUMBER_RE = /[\d一二三四五六七八九十]+[\d,.]*\s*(%|％|人|份|個|年|萬|億|K|k|倍|次)/;

function splitSentences(text: string): string[] {
  return text.split(/[。！？\n;；]/).map((s) => s.trim()).filter((s) => s.length > 2);
}
function splitJdKeywords(jd: string): string[] {
  return jd.split(/[、,，。\/／\n]/).map((s) => s.trim()).filter((s) => s.length >= 2 && s.length <= 12);
}

function runHeuristics(background: string, jd: string) {
  const bg = (background || "").trim();
  const jdText = (jd || "").trim();
  const out: Record<string, string>[] = [];
  if (!bg && !jdText) return out;

  const bgSentences = splitSentences(bg);

  bgSentences.filter((s) => NUMBER_RE.test(s)).slice(0, 2).forEach((s) => {
    out.push({
      category: "成果量化追問",
      question: `「${s}」——這個數字的基準是什麼？跟誰比、跟哪個時間點比？`,
      source_phrase: s,
      why: "數字很搞眼，但常常沒交代基準與樣本，面試官會追這一字。",
    });
  });

  bgSentences.filter((s) => ROLE_VERBS.some((v) => s.includes(v))).slice(0, 2).forEach((s) => {
    const verb = ROLE_VERBS.find((v) => s.includes(v));
    out.push({
      category: "角色與決策追問",
      question: `「${s}」——當時有遇到跟別人意見不一致的情況嗎？你怎麼${verb}、怎麼取舍？`,
      source_phrase: s,
      why: "只寫「我" + verb + "了什麼」沒有說明取舍過程，這類句子容易被追問具體細節。",
    });
  });

  if (jdText) {
    const jdKeywords = splitJdKeywords(jdText);
    const gaps = jdKeywords.filter((k) => k.length >= 2 && !bg.includes(k));
    gaps.slice(0, 2).forEach((k) => {
      out.push({
        category: "JD 缺口追問",
        question: `JD 提到「${k}」，但履歷/背景完全沒提到，能否舉一個相關的實際案例？`,
        source_phrase: `JD：「${k}」`,
        why: "JD 明確提到、履歷完全沒提到的詞，是最容易被盯上的落差。",
      });
    });
  }

  if (jdText && bg) {
    const bgTokens = new Set(bg.match(/[一-龥]{2,4}/g) || []);
    const jdTokens = jdText.match(/[一-龥]{2,4}/g) || [];
    const overlap = jdTokens.some((t) => bgTokens.has(t));
    if (!overlap) {
      out.push({
        category: "動機一致性追問",
        question: "背景描述跟這份 JD 的用詞幾乎沒有重疊，是什麼讓你想應徵這個職位？",
        source_phrase: "背景與 JD 用詞重疊度低",
        why: "用詞完全沒重疊通常代表投遂方向很寬，面試官會想確認動機。",
      });
    }
  }
  if (bg.length > 0 && bg.length < 40) {
    out.push({
      category: "動機一致性追問",
      question: "背景描述目前偏簡短，你會怎麼具體說明過往經驗跟這個職位的關聯？",
      source_phrase: `背景字數偏少（${bg.length} 字）`,
      why: "背景越簡短，這類開放式追問越可能出現。",
    });
  }

  return out.slice(0, 5);
}

// 適配度分析——一樣是規則引擎，不叫 Claude API。把 JD 拆成關鍵字，逐一比對
// 履歷有沒有提到：完整出現算「符合」，履歷裡有相近的短詞算「證據薄」，
// 完全沒有算「缺口」。
function computeFit(background: string, jd: string) {
  const bg = (background || "").trim();
  const jdText = (jd || "").trim();
  if (!bg || !jdText) return { strong: [], weak: [], miss: [] };

  const keywords = Array.from(new Set(splitJdKeywords(jdText)));
  const bgTokens = new Set(bg.match(/[一-龥]{2,4}/g) || []);

  const strong: string[] = [];
  const weak: string[] = [];
  const miss: string[] = [];
  keywords.forEach((k) => {
    if (bg.includes(k)) {
      strong.push(k);
      return;
    }
    const hasPartialOverlap = Array.from(bgTokens).some((t) => k.includes(t) || t.includes(k));
    if (hasPartialOverlap) weak.push(k); else miss.push(k);
  });

  return { strong: strong.slice(0, 8), weak: weak.slice(0, 8), miss: miss.slice(0, 8) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { submission_id } = await req.json();
    if (!submission_id) return json({ error: "submission_id 必填" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row, error: readErr } = await supabase
      .from("submissions")
      .select("id, resumes(text), jds(text)")
      .eq("id", submission_id)
      .single();
    if (readErr || !row) return json({ error: "找不到這筆資料" }, 404);

    const bg = row.resumes?.text || "", jdText = row.jds?.text || "";
    const followups = runHeuristics(bg, jdText);
    const fit = computeFit(bg, jdText);
    const fitScore = (() => {
      const total = fit.strong.length + fit.weak.length + fit.miss.length;
      if (!total) return null;
      return Math.round(100 * (fit.strong.length * 1 + fit.weak.length * 0.4) / total);
    })();

    if (!followups.length) {
      await supabase.from("submissions").update({
        followups: [],
        followups_status: "error",
        followups_error: "規則引擎沒找到可以追問的點（履歷/JD 內容太短或太相似），這是本機規則版的限制，接上 Claude API 後會好很多。",
        fit_score: fitScore, fit_strong: fit.strong, fit_weak: fit.weak, fit_miss: fit.miss,
      }).eq("id", submission_id);
      return json({ error: "規則引擎沒找到可以追問的點", fit }, 200);
    }

    await supabase.from("submissions").update({
      followups,
      followups_status: "done",
      followups_error: null,
      fit_score: fitScore, fit_strong: fit.strong, fit_weak: fit.weak, fit_miss: fit.miss,
    }).eq("id", submission_id);

    return json({ followups, fit, engine: "heuristics-v1 (本機規則引擎，非 AI)" });
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
