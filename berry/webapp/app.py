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
SYSTEM_PROMPT = """你是一位很會「追問」的資深面試官。以下會給你一位候選人的背景與應徵職位。

步驟一（先想，不用輸出）：
從背景推論「他一定經歷過、但履歷沒明講」的具體場景。
例如：他若管過 KPI，就一定有人幫他訂目標、也一定遇過達不到目標的時候；
他若帶過團隊，就一定處理過績效差的成員、也做過人力取捨。

步驟二：進階問題 8 題
預測這位候選人最可能被面試官追問的 8 個問題。
排序：越需要讀懂他的背景、越尖銳具體的排越前面；通用、看職位就能猜到的排後面。
關鍵要求：不要停在「你怎麼管 KPI」這種主題層問法，要往下鑽一層——
問到「這些 KPI 的目標是誰、怎麼訂出來的」「達不到時你怎麼處理」這種角度。
每題標註 experience_probe：若這題「非讀懂他的背景就問不出來」設為 true，通用題設為 false。
每題附一句 rationale，說明為什麼會問（從背景哪一點推論出來）。

步驟三：行動推薦 3–5 條
針對上面的問題，給具體、可執行的面試前準備建議。不要講「多練習」這種空話。

全部用繁體中文。"""

OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "advanced_questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "rationale": {"type": "string"},
                    "experience_probe": {"type": "boolean"},
                },
                "required": ["question", "rationale", "experience_probe"],
                "additionalProperties": False,
            },
        },
        "action_recommendations": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["advanced_questions", "action_recommendations"],
    "additionalProperties": False,
}


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


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        data = body if isinstance(body, bytes) else json.dumps(body).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            html = (HERE / "index.html").read_bytes()
            self._send(200, html, "text/html; charset=utf-8")
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/api/generate":
            self._send(404, {"error": "not found"})
            return
        if not os.environ.get("ANTHROPIC_API_KEY"):
            self._send(400, {"error": "尚未設定 ANTHROPIC_API_KEY。請先 export ANTHROPIC_API_KEY=你的金鑰 再重開伺服器。"})
            return
        length = int(self.headers.get("Content-Length", 0))
        payload = json.loads(self.rfile.read(length) or b"{}")
        background = (payload.get("background") or "").strip()
        jd = (payload.get("jd") or "").strip()
        if not background:
            self._send(400, {"error": "請至少填寫候選人背景。"})
            return
        try:
            self._send(200, generate(background, jd))
        except anthropic.AuthenticationError:
            self._send(401, {"error": "API 金鑰無效，請確認 ANTHROPIC_API_KEY。"})
        except Exception as e:  # noqa: BLE001
            self._send(500, {"error": f"產生失敗：{e}"})

    def log_message(self, *args):  # 靜音預設 log
        pass


if __name__ == "__main__":
    print(f"Berry MVP demo 跑起來了 → http://localhost:{PORT}")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("⚠️  還沒設 ANTHROPIC_API_KEY，產生分析時會提醒你。")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
