# 任務：把 alan/webapp 改成能走完 happy path 的 demo，並抽出資料層

分支 `mvp/alan`。撰寫日：2026-08-22。

先讀這四份，它們是前提：
`CLAUDE.md`、`alan/mvp-plan.md`、`alan/happy-path.html`、`alan/webapp/ORIGIN.md`。

---

## 這一跑的定位

app 在這輪是**純展示載體**。驗證資料由人在 markdown 檔裡產生並 commit，
時間戳由 git 提供——這是唯一能反駁「自己判會不會偏」的證據，不要把它搬進 localStorage。
app 的職責只是把已定案的資料演清楚。

面試還沒發生（窗口 2026-08-24 至 09-05）。步驟 7、8 用**示意資料**演，
欄位結構必須與真資料完全同構，面試後只換資料、不改程式。
畫面上要看得出那是示意資料。

## 邊界

可改：`alan/webapp/**`、`alan/happy-path.html`、`alan/mvp-plan.md`

唯讀：`docs/**`、`README.md`、`CLAUDE.md`、`alan/results.md`、`alan/results/**`、
`alan/fixtures/**`、`alan/prompts/**`、`alan/private/**`

可以在 `mvp/alan` 上 commit，一個 commit 一個主題。
**禁止 push、禁止碰 main、禁止 `--force` / `reset --hard` / `clean -fd`。**

不要做：每週一題、累積軌跡畫面、後端、API 呼叫、登入、資料庫、自動化測試、
`results.md` 的 ★ 題分母重判、發布 Artifact。

---

## 工作項目（依此順序）

### 1. 抽出資料層

現況：`alan/webapp/alan-data.js` 是 `const ALAN = {...}`，且已被 `alan/.gitignore` 排除
（裡面有真實手機、email、公司名）。`mvp-plan.md` 承諾的 `demo-data.json` 不存在。

- 建 `alan/webapp/demo-data.json`，承載目前 `alan-data.js` 的全部內容，
  外加步驟 7、8 的示意資料（見項目 4、5）。
- app 改為載入這份 JSON（`serve.sh` 已有 http server，同源 fetch 可行）。
- 把 `demo-data.json` 加進 `alan/.gitignore`，與 `alan-data.js` 同待遇。
- 另產一份 `alan/webapp/demo-data.example.json`：**結構完整、內容全部遮蔽或改為佔位字串**，
  這份要 commit。它同時是資料結構的文件，也是第二輪換受試者的模板。
- 遷移完成後移除 `alan-data.js` 的載入。

### 2. 流程重排與 questions 畫面

現在的順序有矛盾：`happy-path.html` 步驟 4 說追問來自 `prompts/d-gap-diagnosis.md`
第三區塊，但那支 prompt 吃「履歷 + JD + 面試形式」，第三區塊是依前兩區塊推出來的，
而 JD 在步驟 5 才貼。`app.js:1143` 那顆按鈕（`state.tab = "questions"`）
的意圖也是「JD 之後才追問」。

改成：`0–3 → 5a 貼 JD → 4 追問 → 5b 匹配與準備建議 → 6 → 7 → 8`

- 新增 `RENDERERS.questions`，這修掉 `app.js:1141` 附近的白畫面
  （現在點「已附 JD 的那筆投遞」會整頁空白）。
- `questions` 是關卡型畫面，跟 `after`、`validation` 一樣隱藏 tabbar，要有明確的返回。
- 職缺分頁分兩態：貼上 JD 後**先只顯示追問入口**，至少回答一題之後才顯示
  匹配分數、三層落差、面試前準備。分數是被延後的，這一點是敘事的重點。
- 追問內容取自 `demo-data.json`（來源是 `private/gap-diagnosis-output.md` 第三區塊），
  3 到 5 題，每題附「為什麼問這題」。回答後回填進主頁的歸納。

### 3. heuristics.js 的半死碼

`state.heuristicResults` 在 `app.js:303`（完整度）與 `app.js:309`（qCount）被讀，
但沒有任何地方寫入，所以那兩個數字永遠是 0 / false，主頁的完整度顯示因此偏低。

追問內容改由 `demo-data.json` 提供之後，這個規則引擎沒有角色。
移除它的載入與相關 state，把完整度改成讀實際有資料的欄位。
`heuristics.js` 檔案本身留著，在 `ORIGIN.md` 註明它來自 Sunny 的架構、這輪未使用。

### 4. 補上缺口診斷命中（N16 第二個事件）

`mvp-plan.md` 第二節列了 N16 的兩個事件，第二個是「缺口診斷命中」：
AI 事前指出的落差，面試後檢查它有沒有真的成為答不出來的地方。
`mvp-plan.md` 的失敗門檻表有這一列，但 happy path 全程沒有任何落點。

在步驟 8（面試後回饋）補上：逐條列出 AI 事前指出的落差，
每條回填「面試中有沒有被碰到 / 有沒有被追問 / 有沒有答不好」。
這一格是行動推薦的上游，不是附加欄位。

### 5. 補上主觀有用，並修正「做了沒」的時序

- `state.prepAdopt` 現在是 `{planned, didIt, usedIt, note}`，缺 `mvp-plan.md` 第二節
  第四層「主觀有用」。補一個欄位，附記性質，畫面上要看得出它不是主判準。
- 更重要的是時序。`mvp-plan.md` 的回填程序把「做了 / 沒做」排在**面試前一天**，
  理由是「『做了沒』是面試前的事實，不該事後回想」。
  但 happy path 步驟 8 讓「做了」和「用上了」同時勾——那時已經知道哪條有用，
  兩格會互相污染，而 N19 本來就是偏誤最重的指標。
  把「做了 / 沒做」拆成一個獨立的面試前時點，與「用上了」分離呈現。
  純展示模式下用示意資料演出兩個時點各自的狀態。

### 6. 文案中性化

- 「帶入 Alan 的履歷 →」「帶入 Alan 的目標職缺 →」改成中性字（人名會被讀成開發者後門）。
- 步驟 7 去掉「沒有事後修改記憶的證明」這類方法論口吻，改成使用者的語言。
- 步驟 8 的「對照失敗門檻」整張卡重寫：移除 N16／N19 代號、「對照盲測 37.6%」、
  「依計畫書規則結論作廢」——那些是內部語言。判讀規則留在 `mvp-plan.md`，不上畫面。

### 7. 內部驗證頁改 hash 入口

`validation` 頁讀 `data.js` 的 `realPersonas()`，且 `defaultState()` 用
`realPersonas()[0].id` 當初值，所以資料不能直接刪。

移除主頁與設定裡的可見入口，改成 URL hash（`#validation`）。
打包成單檔之後 hash 入口要照樣有效。

### 8. 打包腳本

建一支腳本（`alan/webapp/build.*`，語言自選，不要引入相依套件），產出 `dist/index.html` 單檔：

- inline CSS、JS、`demo-data.json`。
- **在打包階段套用 `mask.js` 的替換規則於資料本身。**
  `mask.js` 目前只在渲染時替換，它自己的註解寫了「state 與 localStorage 存的仍是原文」，
  所以發布檔裡會躺著真實手機、email、公司名，view source 就看得到。
  遮蔽必須發生在寫入 `dist` 之前，發布檔裡不能有任何原文。
- `index.html` 現在從 jsdelivr 載 framework7-icons。Artifact 的 CSP 只放行 Google Fonts，
  外部 host 會被擋，圖示會變空白方框。
  **開發版繼續用 CDN，替換只發生在打包階段**——由打包腳本把用到的圖示
  （`ICONS` 與 `ICONS_OFF` 那兩組，見 `app.js:53` 與 `app.js:61`）
  改成內嵌 SVG 或內嵌 font subset，並移除那行 `<link>`。
  不要改動 `index.html` 與 `app.js` 在開發時的載入方式。
- `dist/` 已被根目錄 `.gitignore` 排除，不會進 repo。

**不要發布 Artifact。** 產出檔案後交出一份自查清單，逐項說明哪些個資已遮蔽、
以及你用什麼方式確認 `dist/index.html` 裡沒有原文。

### 9. 同步文件

`alan/happy-path.html`：

- 流程順序改成 `0–3 → 5a → 4 → 5b → 6 → 7 → 8`。
- 「不在這條路上」那張表加一列：長期陪伴／每週一題。
  不走的理由是它需要時間才有意義，這輪做出來是空殼；
  被問到的回法是「累積是護城河，但要靠使用者一直回來才長出來，這輪只有一筆」。
- 步驟 6 的定位改成「容器的示意」。現在寫「這是累積才有的東西，不是單次」，
  但畫面上只有一筆，這句話講出來會被看穿。
- 步驟 1、2 的「驗證」欄改掉。現在寫的是輸入成本與現場問觀眾，
  但 `mvp-plan.md` 的不驗證清單明列「使用者願不願意完成填答」「介面易用性」，
  理由是受測者是設計者本人。那兩步是敘事，不是驗證點。
- 開場前檢查清單依實際完成狀況更新。

`alan/mvp-plan.md`：在「這輪為第二輪預留的接口」與「待解問題」補上實際狀態——
`demo-data.json` 已兌現、app 的角色是純展示、步驟 7/8 目前是示意資料、
Artifact 發布需要打包步驟（單檔限制與 CSP）。

---

## 寫作與程式風格

- 全部繁體中文。用詞以 `docs/glossary.md` 為準。
- 文件寫成事實與決定的紀錄：「我們決定做 X，因為 Y」。
  不用祈使句訓話、不寫「你必須」「切記」、不加警語圖示。列表就是列表。
- 程式碼跟著現有風格：`app.js` 是單檔、無框架、字串模板渲染、`state` + `saveState()`。
  不要引入建置工具或相依套件。

## 交付

不要實際開瀏覽器驗證。交出：

1. 改了什麼，逐項附 `file:line`。
2. 一份**手動驗證腳本**：從清空 localStorage 開始，
   `0 → 1 → 2 → 3 → 5a → 4 → 5b → 6 → 7 → 8` 每一步該點什麼、該看到什麼，
   加上 `dist/index.html` 單獨開啟時要確認的項目（圖示有沒有出現、
   `#validation` 打不打得開、console 有沒有錯誤）。
   這份腳本是給人照著點的，不是驗證報告。
3. 打包產物的個資自查清單。
4. 哪些項目沒做完、為什麼。

---

## 這份 brief 背後的決定

釐清過程的結論，記在這裡供日後回溯：

| # | 決定 |
|---|---|
| 1 | app 這輪是純展示：驗證資料在 markdown + commit 產生，git 蓋時間戳；app 只演已定案的資料 |
| 2 | 「長期夥伴」的主張保留，但畫面上不出現每週一題與累積面板，長期性只口頭補 |
| 3 | 面試尚未發生，步驟 7、8 用示意資料演，欄位與真資料同構 |
| 4 | 資料層抽成 `demo-data.json` + 打包腳本 inline 成單檔，遮蔽發生在打包階段而非渲染階段 |
| 5 | 步驟 4 追問搬到貼 JD 之後，做成獨立畫面 `questions`；`app.js:1141` 白畫面順帶修好 |
| 6 | 內部驗證頁改 hash 入口，移除主頁與設定的可見入口 |
| 7 | 只產出 `dist/` 單檔，不發布 Artifact——公司名是否具名這件事還沒定案 |
| 8 | ★ 題分母不放進這一跑：讓 AI 重判「AI 的預測算不算命中」，結論在收斂日站不住 |
| 9 | 可 commit、禁止 push |
| 10 | 驗收是自查清單 + `file:line`，不實際跑瀏覽器；手動走一遍由人在收斂日前完成 |

項目 4、5 與項目 3 是釐清過程中新發現的缺口，`happy-path.html` 的清單上原本沒有。
