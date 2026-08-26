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

// 主頁「職涯目標／工作類型／技能雷達／資產與短板」原本是 ALAN.dash 示範資料，
// 不管使用者填什麼 basics/履歷都不會變。這支函數叫 Claude 針對「這個人」重新生成
// 這四塊，結果存進 profile_analyses，取代示範資料。跟 generate-followups 不同，
// 這四塊需要語意歸納（不是關鍵字比對），規則引擎做不出來，所以直接接 Claude API。

const PROFILE_TOOL = {
  name: "emit_profile_analysis",
  description: "根據使用者的職涯開放式回答與履歷全文，產出職涯畫像分析",
  input_schema: {
    type: "object",
    properties: {
      goal3: { type: "string", description: "3 年職涯目標，1-2 句話，具體到職稱/領域/累積的能力" },
      goal5: { type: "string", description: "5 年職涯目標，1-2 句話" },
      ideal: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3, description: "最理想的職缺類型/職稱" },
      target: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4, description: "主力投遞的職缺類型/職稱" },
      accept: { type: "array", items: { type: "string" }, minItems: 0, maxItems: 4, description: "可以接受、次要考慮的職缺類型" },
      capabilities: {
        type: "array",
        minItems: 3,
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "能力類別名稱，具體、不要用「溝通能力」這種泛用詞" },
            level: { type: "string", enum: ["強", "中", "弱"] },
            why: { type: "string", description: "為什麼判斷是這個強度，要引用履歷裡的具體事例" },
          },
          required: ["name", "level", "why"],
        },
      },
      radar: {
        type: "array",
        minItems: 3,
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            k: { type: "string", description: "跟 capabilities 的 name 對應的簡短標籤（4-8 字）" },
            v: { type: "number", minimum: 0, maximum: 100, description: "證據強度分數：履歷裡有具體量化成果=100，有具體事例但無量化=60-80，只是自稱=30-50" },
          },
          required: ["k", "v"],
        },
      },
      assets: {
        type: "array",
        minItems: 0,
        maxItems: 4,
        items: {
          type: "object",
          properties: { t: { type: "string" }, d: { type: "string", description: "使用者可能沒發現，但履歷裡看得出來的資產" } },
          required: ["t", "d"],
        },
      },
      gaps: {
        type: "array",
        minItems: 0,
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            t: { type: "string" },
            d: { type: "string" },
            fix: { type: "string", enum: ["補得起來", "先避開"] },
          },
          required: ["t", "d", "fix"],
        },
      },
    },
    required: ["goal3", "goal5", "ideal", "target", "accept", "capabilities", "radar"],
  },
};

async function callClaude(basics: Record<string, unknown>, resumeText: string) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY 未設定");

  const prompt = `以下是一位求職者的職涯開放式回答與履歷全文，請幫他做職涯畫像分析。

【第 2 題：職涯開放式回答】
${(basics.openness as string) || "（未填寫）"}

【目前職稱／類別】${basics.curTitle || "（未填寫）"} / ${basics.curCat || "（未填寫）"}
【目標職稱／類別】${basics.tgtTitle || "（未填寫）"} / ${basics.tgtCat || "（未填寫）"}
【感興趣產業】${Array.isArray(basics.industries) ? (basics.industries as string[]).join("、") : "（未填寫）"}

【履歷全文】
${resumeText || "（未提供）"}

請只根據上面的內容做判斷，不要腦補履歷沒提到的經歷。呼叫 emit_profile_analysis 回傳結果。`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      tools: [PROFILE_TOOL],
      tool_choice: { type: "tool", name: "emit_profile_analysis" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const toolUse = (data.content || []).find((b: { type: string }) => b.type === "tool_use");
  if (!toolUse) throw new Error("Claude 沒有回傳 tool_use 區塊");
  return toolUse.input;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { resume_id, basics } = await req.json();
    if (!basics) return json({ error: "basics 必填" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 履歷是選填——Basic 五題填完就該有真的職涯畫像，不用等使用者另外去履歷頁上傳。
    // 有履歷全文就一起丟給 Claude，沒有的話只靠 basics 做判斷。
    let resumeText = "";
    let ownerId: string | null = null;
    if (resume_id) {
      const { data: resumeRow, error: readErr } = await supabase
        .from("resumes")
        .select("id, owner_id, text")
        .eq("id", resume_id)
        .single();
      if (readErr || !resumeRow) return json({ error: "找不到這份履歷" }, 404);
      resumeText = resumeRow.text || "";
      ownerId = resumeRow.owner_id;
    } else {
      const authHeader = req.headers.get("authorization") || "";
      const token = authHeader.replace(/^Bearer\s+/i, "");
      const { data: userData, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !userData?.user) return json({ error: "沒有登入資訊，無法產生分析" }, 401);
      ownerId = userData.user.id;
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("profile_analyses")
      .insert({ owner_id: ownerId, resume_id: resume_id || null, basics, status: "pending" })
      .select("id")
      .single();
    if (insertErr) throw insertErr;

    try {
      const result = await callClaude(basics, resumeText);
      await supabase.from("profile_analyses").update({
        goal3: result.goal3,
        goal5: result.goal5,
        ideal: result.ideal,
        target: result.target,
        accept: result.accept,
        capabilities: result.capabilities,
        radar: result.radar,
        assets: result.assets || [],
        gaps: result.gaps || [],
        status: "done",
      }).eq("id", inserted.id);
      return json({ profile: result });
    } catch (e) {
      const message = String((e as Error)?.message || e);
      await supabase.from("profile_analyses").update({ status: "error", error: message }).eq("id", inserted.id);
      return json({ error: message }, 200);
    }
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
