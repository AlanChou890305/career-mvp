# Sunny 的 MVP —— onboarding→dashboard 的旅程，收斂回兩個驗證問題

這支分支（`mvp/sunny`）是「同一個命題的第三種解法」，跟 `mvp/alan`、`mvp/berry` 一樣不互相合併。

## 跟團隊共識（`docs/mvp-scope.md`）不一樣的地方

`docs/mvp-scope.md` 這輪明確排除了前端介面、dashboard、履歷/JD 填寫流程。這支分支選擇保留完整的 onboarding→dashboard 旅程敘事——這是知情後的選擇，不是沒看到那份文件。原因記在這裡，方便收斂討論時對照。

做法是誠實分層，但**互動性是真的**：履歷／JD 欄位可以打字輸入，「進階問題」有一個本機規則引擎（`webapp/heuristics.js`）會真的讀取當下輸入的文字去分析（不是查表回傳固定答案），投遞紀錄與履歷版本可以真的新增/刪除，資料存在瀏覽器 `localStorage`（關掉分頁、重新整理都還在）。目標職位這一步是從投遞紀錄即時算出來的，不是固定文字。

分層的地方在於**驗證強度不同，畫面上都標出來**：
- 「真實 AI 驗證結果」只有 3 位真實語料 persona 有，是另開獨立 agent 生成、事後對照命中率的結果——這才是算進 `results/hit-rate-summary.md` 的東西。
- 「本機規則版」進階問題對任何輸入都會跑，但只是關鍵字/正規表達式比對，是完整 AI 版本的簡化替身，不是同一個驗證強度。
- 「行動推薦」的勾選框是量測介面（demo 裡自己勾的，不是真實面試者的回饋），不是驗證結果本身。
- 8 位 persona 裡，3 位「真實語料」、5 位「示範假資料」——假資料只用來讓畫面有更多東西可以點，不能拿假資料的「命中率」當證據（自己出題自己驗證是循環論證，`docs/personas.md` 已經指出這一點）。

這樣一方面回應了原始提案（`career-companion.zip`，見 `assets/research/`、`docs/product-thesis.md`）想呈現的完整價值主張、也做出一個真的能操作的 app，一方面沒有假裝「命中率」或「採用率」這兩個驗證數字比實際做到的更扎實。

## 這次真正驗證了什麼

跟 Alan、Berry 一樣，對著 `docs/mvp-scope.md` 的必做流程：候選人背景 + JD → prompt → 進階問題 + 行動推薦 → 存下來對照。

1. **AI 追問的進階問題，命不命中面試官真正會問的？**
   `prompt.md` 是這一版的 prompt 設計（跟 Berry 版本的取捨差異也寫在裡面）。`fixtures/` 是 3 筆真實公開面試心得（去識別化，來源網址保留在每個檔案的 frontmatter）。`results/` 是另開「看不到答案」的獨立 agent 產生的預測，事後對照真實問題標註命中率——細節與誠實揭露的限制見 `results/hit-rate-summary.md`。

2. **AI 給的行動推薦，有沒有人真的照做並派上用場？**
   這題需要真人質性訪談，這次還沒有資料，是下一步要做的事。

## 跟 30 筆語料、正式盲測的差距

- 目標是三人各收 10 筆、共用同一批 30 筆。這裡只收了 3 筆，還欠 7 筆。
- 命中率是我自己主觀判定，沒有第二人覆核，也不是完全乾淨的盲測（詳見 `results/hit-rate-summary.md` 的揭露）。
- 「行動推薦有沒有人照做」完全沒有驗證,需要找真人做過模擬面試準備後回頭訪談。

## 怎麼打開這個 demo

不需要安裝任何東西（不需要 Node、不需要 API key）。打開「終端機」App,貼上：

```bash
cd career-mvp/sunny/webapp
python3 -m http.server 8712
```

然後在瀏覽器打開 `http://localhost:8712`。七個步驟可以用最上面的階段列直接跳,不用照順序點。看完按 `Ctrl+C` 關掉終端機裡的伺服器就好。

## 檔案在哪

```
sunny/
├── README.md              ← 這份
├── prompt.md               Sunny 版 prompt 設計 + 取捨說明 + 盲測限制揭露
├── fixtures/                3 筆真實面試心得語料（去識別化，格式同 assets/fixtures/README.md）
├── results/
│   ├── hit-rate-summary.md  命中率結果與看出來的模式
│   └── predictions/         3 筆語料各自的完整預測 + 命中標註
└── webapp/                  7 步驟 walkthrough demo（純 HTML/CSS/JS,無需安裝）
    ├── data.js               8 位 persona 資料（3 真實 + 5 假資料）、種子用的投遞紀錄/履歷版本
    ├── heuristics.js         本機規則引擎，讀取當下輸入的履歷/JD 產生追問
    ├── app.js                狀態管理、CRUD、localStorage 存取
    └── styles.css
```
