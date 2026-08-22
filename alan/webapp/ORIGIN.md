# 這份 webapp 的來源

複製自 `main` 分支的 `sunny/webapp/`，commit `62ac620`，複製日 2026-08-22。

原作者是 Sunny。這裡拿它當**架構起點**，不是拿它當成果——
Alan 這支分支要換掉的是內容與資料來源，介面骨架沿用。

沿用的理由記在 [../mvp-plan.md](../mvp-plan.md)：
收斂日重做一個較弱的 App 沒有意義，Alan 的差異化在
A/B/C 基準線與真實面試閉環，不在介面。

## 原始檔案

| 檔案 | 行數 | 原本做什麼 |
|---|---|---|
| `app.js` | 570 | onboarding 流程、狀態管理、CRUD、localStorage |
| `data.js` | 505 | 16 位 persona（10 真實語料 + 6 假資料）、種子投遞紀錄與履歷版本 |
| `heuristics.js` | 101 | 本機規則引擎，讀輸入的履歷/JD 產生追問 |
| `index.html` | 30 | 進入點 |
| `styles.css` | 151 | 樣式 |

## 打開方式（沿用 Sunny 的）

```bash
cd career-mvp/alan/webapp
python3 -m http.server 8712
```

瀏覽器開 `http://localhost:8712`。
