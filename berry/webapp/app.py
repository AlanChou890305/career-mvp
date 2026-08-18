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


def generate(background: str, jd: str) -> dict:
    client = anthropic.Anthropic()
    user_text = f"候選人背景：\n{background}\n\n應徵職位 / JD：\n{jd or '（未提供）'}"
    resp = client.messages.create(
        model=MODEL,
        max_tokens=4000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_text}],
        output_config={"format": {"type": "json_schema", "schema": OUTPUT_SCHEMA}},
    )
    text = next(b.text for b in resp.content if b.type == "text")
    return json.loads(text)


def extract_questions(buf: str) -> list:
    """從還在串流、尚未完整的 JSON 裡，抓出目前已閉合的 advanced_questions 物件。"""
    ki = buf.find('"advanced_questions"')
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
        if self.path not in ("/api/generate", "/api/evaluate"):
            self._send(404, {"error": "not found"})
            return
        if not os.environ.get("ANTHROPIC_API_KEY"):
            self._send(400, {"error": "尚未設定 ANTHROPIC_API_KEY。請先 export ANTHROPIC_API_KEY=你的金鑰 再重開伺服器。"})
            return
        length = int(self.headers.get("Content-Length", 0))
        payload = json.loads(self.rfile.read(length) or b"{}")
        background = (payload.get("background") or "").strip()
        jd = (payload.get("jd") or "").strip()

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

        if not background:
            self._send(400, {"error": "請至少填寫候選人背景。"})
            return
        # 串流：問題逐題推出，結尾再送一份完整結果做權威渲染
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "close")
        self.end_headers()
        try:
            client = anthropic.Anthropic()
            user_text = f"候選人背景：\n{background}\n\n應徵職位 / JD：\n{jd or '（未提供）'}"
            buf, sent = "", 0
            with client.messages.stream(
                model=MODEL,
                max_tokens=4000,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_text}],
                output_config={"format": {"type": "json_schema", "schema": OUTPUT_SCHEMA}},
            ) as stream:
                for chunk in stream.text_stream:
                    buf += chunk
                    qs = extract_questions(buf)
                    while sent < len(qs):
                        self._sse("question", qs[sent])
                        sent += 1
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
