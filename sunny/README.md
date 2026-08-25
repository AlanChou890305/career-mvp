# Sunny 的 MVP —— onboarding→dashboard 的旅程，收斂回兩個驗證問題

這支分支（`mvp/sunny`）是「同一個命題的第三種解法」，跟 `mvp/alan`、`mvp/berry` 一樣不互相合併。

## 跟團隊共識（`docs/mvp-scope.md`）不一樣的地方

`docs/mvp-scope.md` 這輪明確排除了前端介面、dashboard、履歷/JD 填寫流程。這支分支選擇保留完整的 onboarding→dashboard 旅程敘事——這是知情後的選擇，不是沒看到那份文件。原因記在這裡，方便收斂討論時對照。

做法是誠實分層，但**互動性是真的**：履歷／JD 欄位可以打字輸入，「進階問題」有一個本機規則引擎（`webapp/heuristics.js`）會真的讀取當下輸入的文字去分析（不是查表回傳固定答案），投遞紀錄與履歷版本可以真的新增/刪除，資料存在瀏覽器 `localStorage`（關掉分頁、重新整理都還在）。目標職位這一步是從投遞紀錄即時算出來的，不是固定文字。

分層的地方在於**驗證強度不同，而且產品體驗跟內部驗證分開放**：

- 一般使用流程是 onboarding（3-4 題基本資訊 + 貼履歷/JD，可以點「用範例履歷體驗」快速帶入）→ 底部導覽列的首頁／履歷／進階問題／投遞／履歷版本。這裡完全不會出現「示範 persona」「真實語料 vs 假資料」這類內部用語——正常使用者不該看到我們的驗證機關。
- 「進階問題」在一般流程裡只顯示本機規則引擎（`webapp/heuristics.js`）讀取使用者自己輸入的履歷/JD 產生的追問，附一個可以勾選「已準備／有幫助」的量測介面（自己勾的，不是真實面試者回饋）。
- 10 篇真實語料 + 命中率，是團隊要驗證的東西、不是產品功能，收在首頁最下面一個不起眼的連結「🔬 內部驗證資料」——這裡才會出現 persona 名稱、真實/假資料標籤、揭曉答案按鈕，是特意做給 Alan、Berry 或評分的人看的，跟一般使用流程分開。

這樣一方面回應了原始提案（`career-companion.zip`，見 `assets/research/`、`docs/product-thesis.md`）想呈現的完整價值主張、也做出一個真的能操作、感覺像正常產品的 app，一方面沒有假裝「命中率」或「採用率」這兩個驗證數字比實際做到的更扎實，也沒有讓內部驗證的痕跡混進使用者體驗裡。

## 這次真正驗證了什麼

跟 Alan、Berry 一樣，對著 `docs/mvp-scope.md` 的必做流程：候選人背景 + JD → prompt → 進階問題 + 行動推薦 → 存下來對照。

1. **AI 追問的進階問題，命不命中面試官真正會問的？**
   `prompt.md` 是這一版的 prompt 設計（跟 Berry 版本的取捨差異也寫在裡面）。`fixtures/` 是 10 篇真實公開面試心得（去識別化，來源網址保留在每個檔案的 frontmatter）——達到團隊約定「每人 10 篇」的份額。`results/` 是另開「看不到答案」的獨立 agent 產生的預測，事後對照真實問題標註命中率——細節與誠實揭露的限制見 `results/hit-rate-summary.md`。

2. **AI 給的行動推薦，有沒有人真的照做並派上用場？**
   這題需要真人質性訪談，這次還沒有資料，是下一步要做的事。

## 跟 30 筆語料、正式盲測的差距

- 目標是三人各收 10 筆、共用同一批 30 筆。Sunny 這邊的 10 篇已經收齊，還要等 Alan、Berry 的份額才會湊成完整的 30 筆共用語料。
- 命中率是我自己主觀判定，沒有第二人覆核，也不是完全乾淨的盲測（詳見 `results/hit-rate-summary.md` 的揭露）。
- 「行動推薦有沒有人照做」完全沒有驗證,需要找真人做過模擬面試準備後回頭訪談。
- 目前這 10 篇還留在 `sunny/fixtures/`，沒有走 `docs/fixtures-sunny` 分支 PR 進 `assets/fixtures/` 的正式流程（Berry 的語料也是留在自己分支下，沒有人先走這個流程）——如果團隊要湊 30 筆共用語料，這是還要協調的一步。

## 怎麼打開這個 demo

不需要安裝任何東西（不需要 Node、不需要 API key）。打開「終端機」App,貼上：

```bash
cd career-mvp/sunny/webapp
python3 -m http.server 8712
```

然後在瀏覽器打開 `http://localhost:8712`。第一次會先看到 onboarding，填完基本資訊、貼上履歷（或點「用範例履歷體驗」）之後，才會進入底部導覽列的主畫面。看完按 `Ctrl+C` 關掉終端機裡的伺服器就好。

## 檔案在哪

```
sunny/
├── README.md              ← 這份
├── prompt.md               Sunny 版 prompt 設計 + 取捨說明 + 盲測限制揭露
├── fixtures/                10 篇真實面試心得語料（去識別化，格式同 assets/fixtures/README.md）
├── results/
│   ├── hit-rate-summary.md  10 篇的命中率結果與看出來的模式
│   └── predictions/         每篇語料的完整預測 + 命中標註
└── webapp/                  onboarding + 底部導覽列 app（純 HTML/CSS/JS,無需安裝）
    ├── data.js               16 位 persona 資料（10 真實 + 6 假資料）、種子用的投遞紀錄/履歷版本
    ├── heuristics.js         本機規則引擎，讀取當下輸入的履歷/JD 產生追問
    ├── app.js                onboarding 流程、狀態管理、CRUD、localStorage 存取
    └── styles.css
```
