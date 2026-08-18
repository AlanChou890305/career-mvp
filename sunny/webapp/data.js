// Sunny 的 MVP demo 資料
// 三位 persona 對應 ../fixtures/ 的三筆真實面試心得語料。
// 「進階問題」的 AI 預測是真的用 ../prompt.md 的 system prompt、
// 由沒看過答案的獨立 agent 生成，事後由 Sunny 對照真實問題標註命中——
// 不是編出來的示範資料。命中判定細節見 ../results/hit-rate-summary.md。

const PERSONAS = [
  {
    id: "data",
    label: "資料科學求職者",
    industry: "電子支付／金融科技",
    role: "Product Science Engineer（資料科學）",
    source: "https://www.ptt.cc/bbs/Soft_Job/M.1716136384.A.C9C.html",
    background:
      "具備資料分析／資料科學工作經驗，同一輪求職中投遞 26 個職位、進入 8 家公司面試、取得 2 份 offer（Coupang、Agoda）。具備資料探勘、機器學習基礎、SQL 與 Python 實作能力，曾負責數據分析與商業指標相關專案。",
    jd:
      "應徵職位為 PayPay（日本電子支付公司）Data Insights 部門的 Product Science Engineer，職務要求包含資料探勘、程式設計能力、資料視覺化與機器學習應用能力。",
    predictions: [
      { category: "成果量化追問", question: "你提到投遞 26 個職位、進 8 家公司面試、取得 2 份 offer，這個轉換率你怎麼解讀？", source_phrase: "投遞 26 個職位、進入 8 家公司面試、取得 2 份 offer", prep_note: "準備說明這 26 個職位的產業／職能分布，以及轉換率背後的原因，而不是只給數字。", hit: "miss" },
      { category: "成果量化追問", question: "「數據分析與商業指標相關專案」能否舉具體案例，指標定義、資料來源、分析方法、對業務決策的影響？", source_phrase: "曾負責數據分析與商業指標相關專案", prep_note: "準備至少一個具體案例，包含指標定義、baseline、分析方法與最終被採用的結論。", hit: "miss" },
      { category: "角色與決策追問", question: "分析結果跟 PM 或業務單位預期不一致時，你當時怎麼溝通、怎麼取捨？", source_phrase: "缺乏決策過程與衝突處理的描述", prep_note: "準備一個實際發生過的分歧情境，並說明你在專案中的角色。", hit: "weak" },
      { category: "角色與決策追問", question: "同時準備 8 家公司面試，你怎麼分配準備的時間與精力優先順序？", source_phrase: "進入 8 家公司面試", prep_note: "說明你如何排序這 8 家公司的重要性與取捨邏輯。", hit: "miss" },
      { category: "JD 缺口追問", question: "JD 要求資料視覺化能力，但背景完全沒提到，能否舉一個實際案例？", source_phrase: "JD「資料視覺化」要求 vs. 背景未提及", prep_note: "準備 1-2 個具體案例；若確實薄弱，誠實承認並準備補強說法。", hit: "miss" },
      { category: "JD 缺口追問", question: "背景寫「機器學習基礎」，JD 要「應用能力」，能否舉一個把 ML 落地到產品的例子？", source_phrase: "背景「機器學習基礎」vs. JD「機器學習應用能力」", prep_note: "先誠實界定經驗層級，準備一個框架式的誠實回答。", hit: "weak" },
      { category: "動機一致性追問", question: "手上有 Coupang、Agoda 兩份 offer，為什麼應徵 PayPay？三者你會怎麼排序？", source_phrase: "取得 2 份 offer（Coupang、Agoda）vs. JD PayPay", prep_note: "想清楚三家公司在職涯故事裡的共同主軸與排序邏輯。", hit: "weak" },
      { category: "動機一致性追問", question: "PayPay 是日本本土公司，背景完全沒提日語或日本市場經驗，你怎麼看這個落差？", source_phrase: "JD「日本電子支付公司」vs. 背景未提及語言／地區經驗", prep_note: "誠實評估日語程度，準備快速融入的替代證明。", hit: "miss" },
    ],
    realQuestions: [
      "（第一關回家作業）給定一份電子支付交易紀錄，提出你觀察到的數據洞見。",
      "什麼是過擬合（overfitting）？你會怎麼處理？",
      "丟硬幣的機率推導題。",
      "資料不平衡（imbalanced data）時你怎麼處理？",
      "解釋 Type-I Error，什麼情境下要特別注意它。",
      "用 Python 模擬計算擲骰子的機率分佈。",
      "寫一段 SQL，把兩張資料表 JOIN 起來。",
      "如果要幫我們設計一套推薦系統，你會怎麼做？（開放式題目）",
      "（行為面試）談談你的職涯規劃，以及這次為什麼想轉職。",
    ],
    hitNote: "命中率低（約 1/8，弱）。真實問題幾乎都是標準化技術篩選題，跟候選人背景敘述關聯度低——這類題本來就不是這版 prompt 要抓的目標。",
  },
  {
    id: "gaming",
    label: "遊戲產業行銷企劃求職者",
    industry: "遊戲產業",
    role: "行銷企劃",
    source: "https://www.ptt.cc/bbs/Salary/M.1607617859.A.4A5.html",
    background:
      "24 歲男性，南部國立科技大學商管系畢業，學生時期有系學會與社團經歷、餐飲與超商打工經驗；退伍後於一間 10 人以內規模的媒體代理商擔任 AE 一年以上，工作內容涵蓋企劃、提案、執行、結案與開發。半年內投遞約 50 份履歷、進入約 10 場面試，期望薪資 35K 以上。",
    jd:
      "行銷企劃，面試分三關（部門經理、部門主管、人資），需準備作品集與過往專案說明，並涉及廣告與 KOL 合作相關專業知識。",
    predictions: [
      { category: "成果量化追問", question: "一年多以來獨立完整結案幾個專案？預算規模最大最小分別多少？", source_phrase: "工作內容涵蓋企劃、提案、執行、結案與開發", prep_note: "準備 2-3 個代表性案例，拆解客戶產業、預算區間、自己主責比例、成效。", hit: "weak" },
      { category: "成果量化追問", question: "「開發」實際成功幾家新客戶？從接觸到簽約平均多久？", source_phrase: "工作內容涵蓋企劃、提案、執行、結案與開發", prep_note: "誠實拆解自己在「開發」裡的實際角色比例。", hit: "miss" },
      { category: "角色與決策追問", question: "提案內容的發想與撰寫，是你自己主筆的比例高，還是配合主管修改？跟主管想法不一致時怎麼處理？", source_phrase: "10 人以內規模的媒體代理商擔任 AE", prep_note: "準備一個具體的意見衝突案例，展現協調能力。", hit: "strong" },
      { category: "角色與決策追問", question: "系學會或社團裡有沒有帶過需要協調不同意見的專案？", source_phrase: "學生時期有系學會與社團經歷", prep_note: "想清楚一個具體職位、一件需要拍板的決定與取捨理由。", hit: "miss" },
      { category: "JD 缺口追問", question: "有沒有實際執行過 KOL 合作案？如果沒有，你會怎麼準備這塊知識？", source_phrase: "JD「廣告與 KOL 合作相關專業知識」vs. 背景未提及", prep_note: "誠實承認落差，準備替代論述（社群廣告經驗、KOL 合作模式研究）。", hit: "strong" },
      { category: "JD 缺口追問", question: "作品集裡最能代表能力的案例，哪些是原創發想、哪些是既有模板調整？", source_phrase: "JD「需準備作品集與過往專案說明」", prep_note: "準備 1-2 頁摘要，每個案例拆解角色／產出／成效。", hit: "weak" },
      { category: "動機一致性追問", question: "是什麼讓你想從代理商轉到遊戲產業做甲方？", source_phrase: "背景為媒體代理商 AE，應徵職位為遊戲產業甲方", prep_note: "準備具體且正向的轉換理由，避免消極表述。", hit: "weak" },
      { category: "動機一致性追問", question: "現在的 AE 工作仍在職嗎？期望 35K 以上的薪資是根據什麼基準？", source_phrase: "半年內投遞約 50 份履歷、期望薪資 35K 以上", prep_note: "統一在職狀態與離職原因的說法，準備薪資依據。", hit: "weak" },
    ],
    realQuestions: [
      "自我介紹。",
      "你的優點與缺點是什麼？",
      "談談你過去負責的專案經歷。",
      "（針對作品集提問）這個提案當時是怎麼發想出來的？",
      "你為什麼想離開上一份工作？",
      "你對我們公司過去的作品／產品有什麼看法？",
      "廣告相關專業知識提問，包含 KOL 合作機制。",
      "如果錄取，多久可以到職報到？",
    ],
    hitNote: "命中率中等（2 強、多個弱命中）。「提案怎麼發想的」與「KOL 合作知識」被準確預測到——正是 JD 明確要求但背景沒證據的兩處。「自我介紹、優缺點」這類開場罐頭題完全沒被預測到，但這是設計上主動放棄的題型，不是漏掉。",
  },
  {
    id: "digital",
    label: "數位行銷求職者",
    industry: "人力銀行／媒合平台",
    role: "網路行銷",
    source: "https://www.ptt.cc/bbs/Salary/M.1612210007.A.A0A.html",
    background:
      "北科文創碩士畢業生，學生時期曾在人力銀行與一間電腦系統整合服務公司擔任網路行銷實習生，這是畢業後第一次正式求職。求職期間約半年，投遞約 70 份履歷、實際面試 38 間公司。",
    jd: "網路行銷職位，需能在面試中即席解釋自己過去操作過的行銷數據與成效。",
    predictions: [
      { category: "成果量化追問", question: "作品集裡的成效數據，基準期怎麼設定？跟誰比、跟哪個時間點比？", source_phrase: "面試官針對其中呈現的數據追問", prep_note: "為每個數字準備分子分母定義、比較基準、自己的貢獻比例。", hit: "strong" },
      { category: "成果量化追問", question: "這些數據有沒有可能受外部因素影響？你怎麼排除干擾證明是自己的貢獻？", source_phrase: "JD 要求「即席解釋…成效」", prep_note: "先列出可能的外部變數，準備排除干擾的具體說法。", hit: "strong" },
      { category: "成果量化追問", question: "投遞 70 份、面試 38 間，這個轉換率你怎麼看？", source_phrase: "投遞約 70 份、實際面試 38 間", prep_note: "準備一個簡短誠實的自我分析，而非「運氣好」。", hit: "miss" },
      { category: "角色與決策追問", question: "作品集裡呈現的行銷操作，是你自己主導決定的，還是主管指派、你執行的？", source_phrase: "僅說「擔任網路行銷實習生」，沒說明角色範圍", prep_note: "誠實界定角色，準備一個具體取捨情境。", hit: "miss" },
      { category: "角色與決策追問", question: "有沒有成效不如預期、後來決定調整或放棄的案例？", source_phrase: "JD 隱含要看面對不理想成效時的應變", prep_note: "準備至少一個「沒有達標」的真實案例，不要只準備成功案例。", hit: "miss" },
      { category: "JD 缺口追問", question: "過去經驗跟 Meet.jobs（人才媒合平台）受眾不同，你會怎麼調整行銷手法？", source_phrase: "背景實習經驗與應徵標的的受眾差異", prep_note: "研究 Meet.jobs 雙邊市場性質，整理可遷移與不能直接套用的方法論。", hit: "miss" },
      { category: "JD 缺口追問", question: "平常操作行銷活動時，習慣看哪些過程指標？怎麼判斷該不該喊停？", source_phrase: "作品集只呈現靜態結果，JD 要求動態即席解讀", prep_note: "列出實際用過的分析工具，準備「看數據做調整」的小故事。", hit: "weak" },
      { category: "動機一致性追問", question: "半年投 70 份、面試 38 間，為什麼特別想加入 Meet.jobs？", source_phrase: "投遞方向似乎廣泛嘗試，與「特別想做這份工作」的一致性未被證實", prep_note: "準備具體理由，避免「因為想找到工作」這種萬用答案。", hit: "miss" },
    ],
    realQuestions: [
      "這個 KPI 當初是怎麼訂出來的？",
      "為什麼這個數據跟你剛剛說的有落差？",
      "這個數據是怎麼得來的？（方法論追問）",
    ],
    hitNote: "命中率最高（2 強命中對應到全部 3 題真實問題的核心）。這場面試官問的正好就是「數字怎麼來的、基準是什麼、有沒有落差」——完全對上這版 prompt「成果量化追問」的設計目標。",
  },
];

// Step 4-6：示意畫面用的內容，標示「這次沒做，先畫出未來要長什麼樣子」
function illustrativeTarget(p) {
  return {
    behaviorSignal: p.role,
    passionSignal: p.industry,
    note: `示意：假設你投遞的職缺集中在「${p.role}」、產業落在「${p.industry}」，系統會慢慢把這個當成浮現中的目標——這一步這次 MVP 沒有真的做（不做 dashboard、不做資料庫），畫出來是為了說明第 3 步「進階問題」準不準，最終會接到這個更大的旅程上。`,
  };
}

function illustrativeApplications(p) {
  return [
    { company: "（示意）" + p.industry + " 公司 A", position: p.role, resumeVersion: "v1", status: "投遞・無回應" },
    { company: "（示意）" + p.industry + " 公司 B", position: p.role, resumeVersion: "v2", status: "被查看" },
    { company: "本次示範用的真實 JD", position: p.role, resumeVersion: "v2", status: "已產生進階問題（見第 3 步）" },
  ];
}

function illustrativeResumeVersions() {
  return [
    { v: "v1", metric: "40%", label: "被查看率" },
    { v: "v2", metric: "65%", label: "被查看率・加了量化成果" },
    { v: "v3", metric: "面試↑", label: "針對 JD 客製開頭" },
  ];
}
