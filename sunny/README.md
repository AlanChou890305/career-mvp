# Sunny 的 MVP —— onboarding→dashboard 的旅程，收斂回兩個驗證問題

這支分支（`mvp/sunny`）是「同一個命題的第三種解法」，跟 `mvp/alan`、`mvp/berry` 一樣不互相合併。

## 跟團隊共識（`docs/mvp-scope.md`）不一樣的地方

`docs/mvp-scope.md` 這輪明確排除了前端介面、dashboard、履歷/JD 填寫流程。這支分支選擇保留完整的 onboarding→dashboard 旅程敘事——這是知情後的選擇，不是沒看到那份文件。原因記在這裡，方便收斂討論時對照。

做法是誠實分層：**只有「進階問題」這一步是真的驗證過**，其餘步驟（目標職位、投遞紀錄、履歷版本、迭代累積）明確標示「示意，這次沒做」，畫出未來旅程的樣子，但不假裝是已經做完的功能。這樣一方面回應了原始提案（`career-companion.zip`，見 `assets/research/`、`docs/product-thesis.md`）想呈現的完整價值主張，一方面沒有假裝完成了團隊已經決定不做的東西。

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
```
