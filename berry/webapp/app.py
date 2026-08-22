"""
Berry MVP 操作畫面 — 後端
真的呼叫 Claude Opus 4.8，用 prompt v2（深挖經歷版）產生進階問題 + 行動推薦。

跑法：
  1. pip install anthropic
  2. export ANTHROPIC_API_KEY=你的金鑰
  3. python app.py
  4. 瀏覽器打開 http://localhost:8000
"""

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import anthropic

HERE = Path(__file__).parent
PORT = 8000
MODEL = "claude-opus-4-8"

# prompt v2：加推論步驟，逼 AI 從背景推隱含場景、往下鑽一層追問
SYSTEM_PROMPT = """你是一位很會「追問」的資深面試官兼面試教練。以下會給你一位候選人的背景與應徵的目標職位。

若有附上履歷檔案，以履歷內容為主要依據，背景欄位當補充；履歷上寫得含糊、看得出有故事卻沒交代清楚的地方，正是最該追問的地方。

若有提供他過去面試實際被問過的題目，那是全部輸入裡最有價值的線索——那不是推測，是真的發生過的事。優先往那些方向推，並把上次漏掉的角度補上。

步驟一（先想，不用輸出）：
從背景推論「他一定經歷過、但履歷沒明講」的具體場景。
例如：他若管過 KPI，就一定有人幫他訂目標、也一定遇過達不到目標的時候；
他若帶過團隊，就一定處理過績效差的成員、也做過人力取捨。

步驟二：headline 一句話摘要
from：一句話濃縮候選人現在的樣子（例如「電商 PM · 4.5 年」）。
to：幾個字寫出他的目標職位（例如「支付產品 PM」）。

步驟三：進階問題 8 題
預測這位候選人最可能被面試官追問的 8 個問題。
排序：越需要讀懂他的背景、越尖銳具體的排越前面；通用、看職位就能猜到的排後面。
不要停在「你怎麼管 KPI」這種主題層問法，要往下鑽一層——問到「目標是誰訂的」「達不到時怎麼處理」這種角度。
每題要標註：
- type：只能是「必答」「深挖」「暖身」三選一。必答＝幾乎一定會問、答不好直接扣分的核心題；深挖＝針對他的經歷往下追問；暖身＝開場或通用題。
- category：2–5 個字的主題標籤（例如「數據實績」「挫折處理」「領域落差」「技術溝通」「指標思維」「動機」）。
- experience_probe：若這題非讀懂他的背景就問不出來設為 true，通用題 false。
- rationale：一句話說明為什麼會問（從背景哪一點推論出來）。

步驟四：準備清單 prep_items（3–5 項）
把「要準備什麼」拆成 3–5 個可執行的任務，依「對面試落差的重要性」由高到低排序。
每項：
- title：一句話任務名（例如「把搜尋改版整理成一頁小抄」）。
- description：具體要準備什麼內容，不要空話。
- related_questions：這項準備對應到上面第幾題（用題號整數，可多題）。
- category：對應主題，跟該題的 category 一致。

步驟五：jd_match 目標職位適配（觀察值，非錄取預測）
- score：0–100 的整數。
- verdict：一句「精煉的判語」，8–16 字，像標題那樣（例如「有基礎，但需補領域知識」）。不要在這裡展開細節或把優勢落差塞進來。
- strengths：2–3 點優勢，每點一句短語（15 字內），不要長句。
- gaps：2–3 點主要落差，每點一句短語（15 字內）。
strengths 與 gaps 一定要填，這是判語之外的細節，兩者不重複。

全部用繁體中文。"""

OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "headline": {
            "type": "object",
            "properties": {
                "from": {"type": "string"},
                "to": {"type": "string"},
            },
            "required": ["from", "to"],
            "additionalProperties": False,
        },
        "advanced_questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "type": {"type": "string"},
                    "category": {"type": "string"},
                    "rationale": {"type": "string"},
                    "experience_probe": {"type": "boolean"},
                },
                "required": ["question", "type", "category", "rationale", "experience_probe"],
                "additionalProperties": False,
            },
        },
        "prep_items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "related_questions": {"type": "array", "items": {"type": "integer"}},
                    "category": {"type": "string"},
                },
                "required": ["title", "description", "related_questions", "category"],
                "additionalProperties": False,
            },
        },
        "jd_match": {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "verdict": {"type": "string"},
                "strengths": {"type": "array", "items": {"type": "string"}},
                "gaps": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["score", "verdict", "strengths", "gaps"],
            "additionalProperties": False,
        },
    },
    "required": ["headline", "advanced_questions", "prep_items", "jd_match"],
    "additionalProperties": False,
}

# 履歷：前端把 PDF 讀成 base64、純文字直接送文字，這裡轉成 content block
# API 上限是 32MB／600 頁，前端先擋 15MB，這裡再擋一次
MAX_RESUME_B64 = 24 * 1024 * 1024


def resume_blocks(resume: dict | None) -> list:
    """把上傳的履歷轉成 content blocks。document block 要排在文字之前。"""
    if not resume:
        return []
    data = resume.get("data") or ""
    name = resume.get("name") or "履歷"
    if not data:
        return []
    if resume.get("kind") == "pdf":
        if len(data) > MAX_RESUME_B64:
            raise ValueError("履歷檔案太大，請壓到 15MB 以內再上傳。")
        return [
            {"type": "document",
             "source": {"type": "base64", "media_type": "application/pdf", "data": data}},
            {"type": "text", "text": f"↑ 這是候選人的履歷檔案（{name}）。"},
        ]
    return [{"type": "text", "text": f"候選人的履歷內容（{name}）：\n{data}"}]


def build_content(background: str, jd: str, resume: dict | None, prefix: str = "") -> list:
    blocks = resume_blocks(resume)
    blocks.append({
        "type": "text",
        "text": f"{prefix}候選人背景：\n{background or '（未提供）'}\n\n應徵職位 / JD：\n{jd or '（未提供）'}",
    })
    return blocks


# 履歷調整建議：拿履歷＋JD＋前一步分析出的落差與追問，給具體改法
RESUME_SYSTEM_PROMPT = """你是一位讀過大量履歷的資深招募主管兼履歷顧問。以下會給你候選人的履歷、他自己寫的背景，以及應徵的目標職位。

請針對「這份履歷投這個職位」給修改建議。判準是：招募方掃過這份履歷 30 秒，會不會想找他來聊、會不會問到對他有利的問題。

步驟零（先想，不用輸出）：
比對 JD 要求與履歷內容，找出這個職位一定會看、但履歷寫得不夠或完全沒寫的地方。後面每一項建議都要扣著這些落差，不要給放諸四海皆準的履歷通則。

步驟一 overall
- score：0–100 的整數，這份履歷對這個職位的說服力。
- verdict：8–16 字的精煉判語（例如「經歷夠強，但成果沒寫成數字」）。不要在這裡展開細節。

步驟二 fixes：3–5 個具體修改點，依重要性由高到低排序
- section：履歷的哪一段（例如「工作經歷 · 某某公司」「技能」「自我介紹」）。
- problem：現在寫成什麼樣、問題在哪。要引用履歷裡的實際內容，不要講空話。
- suggestion：具體要改成什麼。
- priority：只能是「高」「中」「低」三選一。

步驟三 rewrites：2–3 個逐句改寫示範
挑履歷裡最可惜的幾句——有做事，但寫得像流水帳——示範怎麼改。
- before：履歷原文，照抄不要改字。
- after：改寫後的版本，要有動作、範圍、成果。
- why：一句話說明改在哪裡。

步驟四 missing：2–4 點「這個職位會看、但履歷完全沒提到」的東西，每點一句短語（20 字內）。

最重要的一條：不要編造履歷上沒有的經歷、數字或職稱。履歷沒寫的成果，在 after 裡用 __ 留白讓他自己填，不要幫他生一個數字。

語言：說明與建議一律用繁體中文。唯獨 rewrites 的 before 與 after 要跟履歷原文同一種語言——履歷是英文寫的，after 就要寫成英文，他才能直接貼回去用。"""

RESUME_SCHEMA = {
    "type": "object",
    "properties": {
        "overall": {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "verdict": {"type": "string"},
            },
            "required": ["score", "verdict"],
            "additionalProperties": False,
        },
        "fixes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "section": {"type": "string"},
                    "problem": {"type": "string"},
                    "suggestion": {"type": "string"},
                    "priority": {"type": "string"},
                },
                "required": ["section", "problem", "suggestion", "priority"],
                "additionalProperties": False,
            },
        },
        "rewrites": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "before": {"type": "string"},
                    "after": {"type": "string"},
                    "why": {"type": "string"},
                },
                "required": ["before", "after", "why"],
                "additionalProperties": False,
            },
        },
        "missing": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["overall", "fixes", "rewrites", "missing"],
    "additionalProperties": False,
}


def advise_resume(background: str, jd: str, resume: dict) -> dict:
    client = anthropic.Anthropic()
    resp = client.messages.create(
        model=MODEL,
        max_tokens=4000,
        system=RESUME_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": build_content(background, jd, resume)}],
        output_config={"format": {"type": "json_schema", "schema": RESUME_SCHEMA}},
    )
    text = next(b.text for b in resp.content if b.type == "text")
    return json.loads(text)


# 面試回填計分：比對「事前預測的題目」與「面試官實際問的」，判準照 scoring-sop.md
DEBRIEF_SYSTEM_PROMPT = """你是面試題預測的計分員。以下會給你我們事前預測的面試題，以及候選人回報的、面試官實際問的問題。請逐題判定我們有沒有預測到。

判準（語意相同即命中，不要求字面一致）：
- 命中：我們預測的某一題，和實際被問的這題語意上是同一題。
- 部分：我們摸到主題，但沒摸到精準角度。例如我們問「你怎麼管 KPI」，實際問「KPI 的制定標準是誰訂的」——主題對上了，角度沒有。
- 沒中：我們完全沒預測到這個方向。

判定從嚴。角度不同就是「部分」，不要為了好看給「命中」。

對「實際被問的每一題」各判一次，逐題輸出：
- actual：把這題整理成一句通順的問句，照候選人寫的意思，不要加油添醋。
- verdict：只能是「命中」「部分」「沒中」三選一。
- matched：對應到我們第幾題預測，用題號整數。判「沒中」時填 0。
- experience_probe：這題是不是非讀懂他的背景與履歷就問不出來的？通用題（自我介紹、離職動機、純技術考題）填 false。
- note：一句話說明判定理由。判「部分」時要講清楚差在哪個角度。

接著輸出：
- missed_summary：把判「沒中」的題目找出共通點，一句話說明我們漏掉了哪一類方向。若全部都有命中或部分，就寫「這場沒有完全漏掉的方向」。
- lesson：一句話，下次要預測這位候選人的面試題時該往哪裡多推一層。要具體到可以照著改 prompt，不要寫「多了解使用者」這種空話。

全部用繁體中文。"""

DEBRIEF_SCHEMA = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "actual": {"type": "string"},
                    "verdict": {"type": "string"},
                    "matched": {"type": "integer"},
                    "experience_probe": {"type": "boolean"},
                    "note": {"type": "string"},
                },
                "required": ["actual", "verdict", "matched", "experience_probe", "note"],
                "additionalProperties": False,
            },
        },
        "missed_summary": {"type": "string"},
        "lesson": {"type": "string"},
    },
    "required": ["items", "missed_summary", "lesson"],
    "additionalProperties": False,
}


def debrief_content(predicted: list, actual: str) -> list:
    qs = "\n".join(f"{i + 1}. {q}" for i, q in enumerate(predicted)) or "（沒有預測紀錄）"
    return [{"type": "text", "text":
             f"我們事前預測的面試題：\n{qs}\n\n面試官實際問的問題（候選人自己回報）：\n{actual}"}]


def past_block(past: list) -> str:
    """把過去回填的面試實況整理成一段前言，讓這次的預測往被問過的方向推。"""
    lines = []
    for p in past[:5]:
        qs = [q for q in (p.get("questions") or []) if q]
        if not qs:
            continue
        lines.append(f"- {p.get('title') or '先前的面試'}：" + "／".join(qs[:8]))
        if p.get("lesson"):
            lines.append(f"　上次的檢討：{p['lesson']}")
    if not lines:
        return ""
    return ("這位候選人過去面試實際被問過的問題（他自己回報的）：\n"
            + "\n".join(lines)
            + "\n\n面試官問過的方向通常會重複出現。優先往這些方向推，並補上我們上次漏掉的角度。"
              "但不要照抄舊題目——這次的職缺不同，要換成對應這份 JD 的問法。\n\n")


# 模擬回覆評分：讀背景＋職位＋題目＋候選人草稿回答，給分數與回饋
EVAL_SYSTEM_PROMPT = """你是一位嚴格但具建設性的面試教練。以下會給你候選人的背景、應徵職位、一道面試官可能追問的問題，以及候選人草擬的回答。

請評估這個回答：
- score：0–100 的整數，評估這個回答在真實面試中的說服力。
- comment：一句話總評。
- strengths：2–3 點答得好的地方，要具體、引用他回答裡的內容。
- improvements：2–3 點可以更好的地方，說明面試官其實想聽到什麼（例如要有具體數字、用 STAR 結構、講清楚你的角色與決策、避免空泛）。

若回答空泛、沒有具體事例或數字，分數要如實偏低，不要客套。全部用繁體中文。"""

EVAL_SCHEMA = {
    "type": "object",
    "properties": {
        "score": {"type": "integer"},
        "comment": {"type": "string"},
        "strengths": {"type": "array", "items": {"type": "string"}},
        "improvements": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["score", "comment", "strengths", "improvements"],
    "additionalProperties": False,
}


def evaluate(background: str, jd: str, question: str, answer: str) -> dict:
    client = anthropic.Anthropic()
    user_text = (
        f"候選人背景：\n{background or '（未提供）'}\n\n"
        f"應徵職位：\n{jd or '（未提供）'}\n\n"
        f"面試問題：\n{question}\n\n"
        f"候選人的回答：\n{answer}"
    )
    resp = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        system=EVAL_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_text}],
        output_config={"format": {"type": "json_schema", "schema": EVAL_SCHEMA}},
    )
    text = next(b.text for b in resp.content if b.type == "text")
    return json.loads(text)


def generate(background: str, jd: str, resume: dict | None = None) -> dict:
    client = anthropic.Anthropic()
    resp = client.messages.create(
        model=MODEL,
        max_tokens=4000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": build_content(background, jd, resume)}],
        output_config={"format": {"type": "json_schema", "schema": OUTPUT_SCHEMA}},
    )
    text = next(b.text for b in resp.content if b.type == "text")
    return json.loads(text)


def _scan_object(buf: str, start: int):
    """從 start（一個 '{'）往後找對應的 '}'，回傳結束位置；沒閉合回 -1。"""
    depth = 0
    in_str = esc = False
    for i in range(start, len(buf)):
        c = buf[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
        elif c == '"':
            in_str = True
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return i
    return -1


def extract_object(buf: str, key: str) -> dict | None:
    """從串流中的 JSON 抓出某個已閉合的物件屬性（例如 overall）。"""
    ki = buf.find(f'"{key}"')
    if ki == -1:
        return None
    bi = buf.find("{", ki)
    if bi == -1:
        return None
    end = _scan_object(buf, bi)
    if end == -1:
        return None
    try:
        return json.loads(buf[bi:end + 1])
    except Exception:  # noqa: BLE001
        return None


def extract_list(buf: str, key: str) -> list:
    """從還在串流、尚未完整的 JSON 裡，抓出某個陣列中目前已閉合的物件。"""
    ki = buf.find(f'"{key}"')
    if ki == -1:
        return []
    bi = buf.find("[", ki)
    if bi == -1:
        return []
    out, depth, start = [], 0, None
    in_str = esc = False
    for i in range(bi + 1, len(buf)):
        c = buf[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
        else:
            if c == '"':
                in_str = True
            elif c == "{":
                if depth == 0:
                    start = i
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0 and start is not None:
                    try:
                        out.append(json.loads(buf[start:i + 1]))
                    except Exception:  # noqa: BLE001
                        pass
                    start = None
            elif c == "]" and depth == 0:
                break
    return out


def _push_new(buf, state, emit, key, event):
    """把陣列裡新閉合的物件逐個推出去，state 記已推到第幾個。"""
    items = extract_list(buf, key)
    sent = state.get(key, 0)
    while sent < len(items):
        emit(event, items[sent])
        sent += 1
    state[key] = sent


def generate_progress(buf, state, emit):
    _push_new(buf, state, emit, "advanced_questions", "question")


def debrief_progress(buf, state, emit):
    _push_new(buf, state, emit, "items", "item")


def resume_progress(buf, state, emit):
    # 分數先出來，接著修改點、改寫示範逐條跳
    if not state.get("overall"):
        o = extract_object(buf, "overall")
        if o:
            emit("overall", o)
            state["overall"] = True
    _push_new(buf, state, emit, "fixes", "fix")
    _push_new(buf, state, emit, "rewrites", "rewrite")


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        data = body if isinstance(body, bytes) else json.dumps(body).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _sse(self, event, data):
        payload = f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
        self.wfile.write(payload.encode("utf-8"))
        self.wfile.flush()

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            html = (HERE / "index.html").read_bytes()
            self._send(200, html, "text/html; charset=utf-8")
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path not in ("/api/generate", "/api/evaluate", "/api/resume", "/api/debrief"):
            self._send(404, {"error": "not found"})
            return
        if not os.environ.get("ANTHROPIC_API_KEY"):
            self._send(400, {"error": "尚未設定 ANTHROPIC_API_KEY。請先 export ANTHROPIC_API_KEY=你的金鑰 再重開伺服器。"})
            return
        length = int(self.headers.get("Content-Length", 0))
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:  # 大檔上傳被截斷時會走到這裡
            self._send(400, {"error": "請求內容不完整，請再試一次；履歷太大的話換小一點的檔案。"})
            return
        background = (payload.get("background") or "").strip()
        jd = (payload.get("jd") or "").strip()
        resume = payload.get("resume") or None

        if self.path == "/api/debrief":
            actual = (payload.get("actual") or "").strip()
            if not actual:
                self._send(400, {"error": "請先寫下面試官實際問了什麼。"})
                return
            predicted = payload.get("predicted") or []
            self._stream(DEBRIEF_SYSTEM_PROMPT, DEBRIEF_SCHEMA,
                         debrief_content(predicted, actual), debrief_progress)
            return

        if self.path == "/api/resume":
            if not resume:
                self._send(400, {"error": "沒有收到履歷檔案。"})
                return
            try:
                content = build_content(background, jd, resume)
            except ValueError as e:
                self._send(400, {"error": str(e)})
                return
            self._stream(RESUME_SYSTEM_PROMPT, RESUME_SCHEMA, content, resume_progress)
            return

        if self.path == "/api/evaluate":
            question = (payload.get("question") or "").strip()
            answer = (payload.get("answer") or "").strip()
            if not answer:
                self._send(400, {"error": "請先輸入你的回答。"})
                return
            try:
                self._send(200, evaluate(background, jd, question, answer))
            except anthropic.AuthenticationError:
                self._send(401, {"error": "API 金鑰無效，請確認 ANTHROPIC_API_KEY。"})
            except Exception as e:  # noqa: BLE001
                self._send(500, {"error": f"評分失敗：{e}"})
            return

        if not background and not resume:
            self._send(400, {"error": "請至少填寫候選人背景，或加入履歷檔案。"})
            return
        # 履歷太大要在送出 SSE 標頭之前擋掉，否則錯誤只能包在事件裡回
        try:
            content = build_content(background, jd, resume,
                                    past_block(payload.get("past") or []))
        except ValueError as e:
            self._send(400, {"error": str(e)})
            return
        self._stream(SYSTEM_PROMPT, OUTPUT_SCHEMA, content, generate_progress)

    def _stream(self, system, schema, content, progress):
        """SSE 串流：progress 在生成途中推中間結果，結束再送一份完整結果做權威渲染。"""
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "close")
        self.end_headers()
        try:
            client = anthropic.Anthropic()
            buf, state = "", {}
            with client.messages.stream(
                model=MODEL,
                max_tokens=4000,
                system=system,
                messages=[{"role": "user", "content": content}],
                output_config={"format": {"type": "json_schema", "schema": schema}},
            ) as stream:
                for chunk in stream.text_stream:
                    buf += chunk
                    progress(buf, state, self._sse)
                final = stream.get_final_message()
            text = next(b.text for b in final.content if b.type == "text")
            self._sse("done", json.loads(text))
        except anthropic.AuthenticationError:
            self._sse("error", {"error": "API 金鑰無效，請確認 ANTHROPIC_API_KEY。"})
        except BrokenPipeError:
            pass  # 使用者關掉頁面
        except Exception as e:  # noqa: BLE001
            self._sse("error", {"error": f"產生失敗：{e}"})

    def log_message(self, *args):  # 靜音預設 log
        pass


if __name__ == "__main__":
    print(f"Berry MVP demo 跑起來了 → http://localhost:{PORT}")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("⚠️  還沒設 ANTHROPIC_API_KEY，產生分析時會提醒你。")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
