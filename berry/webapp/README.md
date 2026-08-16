# MVP 操作畫面 Demo

真的接 Claude Opus 4.8 的三畫面 demo：輸入頁 → 結果頁 → Dashboard。
用的是 prompt v2（深挖經歷版）。

## 怎麼跑（3 步）

```bash
cd berry/webapp
pip install anthropic          # 只需裝這一個套件
export ANTHROPIC_API_KEY=你的金鑰
python app.py
```

然後瀏覽器打開 **http://localhost:8000**

- 按「填入範例」→「產生分析」就能看到 AI 即時產生的進階問題 + 行動推薦。
- 上方分頁可切到 Dashboard 看命中率成功指標。

## 檔案

- `app.py` — 後端：Python 內建伺服器（不用 Flask），POST /api/generate 呼叫 Claude，用結構化輸出回傳 JSON。
- `index.html` — 前端：三畫面單頁，vanilla JS，無外部相依。

## 要提醒的

- **需要 Anthropic API 金鑰**（付費，但每次分析成本不到 1 美分）。到 platform.claude.com 申請。
- Dashboard 的命中率數字來自 results-v2.md 的驗證結果；JD 匹配分數 / 投遞進度標「🔒 進階功能」，是 MVP 之後才做的。
- 這是 demo 操作畫面，不是這次驗證方法論的一部分（驗證仍以命中率為準）。
