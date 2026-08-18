// Sunny 的 MVP demo 資料
//
// 三位「真實語料」persona（isMock:false）對應 ../fixtures/ 的三筆真實面試心得語料，
// 「進階問題」預測是真的用 ../prompt.md 的 system prompt、由沒看過答案的獨立 agent
// 生成，事後對照真實問題標註命中——不是編出來的。細節見 ../results/hit-rate-summary.md。
//
// 另外 5 位「示範假資料」persona（isMock:true）是我（Claude）直接捏造的，純粹是為了讓
// 這個 demo 有更多資料可以點、感覺更像一個真的在用的 app。這些沒有「面試官實際問的問題」
// 可以對照，所以不算命中率——硬要幫假資料編一個「命中率」，等於自己出題自己驗證，
// docs/personas.md 已經指出這種循環論證沒有意義，這裡刻意不做。

const PERSONAS = [
  // ---------- 真實語料（3 筆，命中率算過） ----------
  {
    id: "data",
    label: "資料科學求職者",
    industry: "電子支付／金融科技",
    role: "Product Science Engineer（資料科學）",
    isMock: false,
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
    actionRecommendations: [
      "把「26 投遞/8 面試/2 offer」的求職故事，與「為什麼是這家公司」的動機串成同一條邏輯線，避免像海投中隨機命中一站。",
      "針對 JD 裡相對薄弱的資料視覺化、機器學習應用兩塊，準備「誠實承認落差 + 具體補強計畫」的說法，不要臨場硬掰。",
      "針對目標公司的市場定位做功課（例如它跟同業的差異、可能面對的實際業務問題），面試官會感覺出你是不是套用同一份萬用腳本。",
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
    isMock: false,
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
    actionRecommendations: [
      "統一「乙方轉甲方」的敘事邏輯，補上對遊戲產業的基本理解與熱情證據，彌補背景完全沒提到相關興趣的空白。",
      "作品集要能拆解角色與貢獻，而非只呈現成品，並先確認哪些代理商客戶資料可公開分享。",
      "在職狀態、離職原因、薪資基準這三件事，三關面試的說法要完全一致，避免被追問出矛盾。",
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
    isMock: false,
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
    actionRecommendations: [
      "把作品集重新做一次「可追問性」檢查：每個數字旁邊寫下怎麼算、基準是什麼、自己的角色是什麼。",
      "準備「失敗／未達標」案例，不要只準備成功案例——這類面試官特別愛深挖。",
      "把求職動機和產業選擇寫成一條連貫的故事線，先寫下一段 30 秒版本反覆練習。",
    ],
    realQuestions: [
      "這個 KPI 當初是怎麼訂出來的？",
      "為什麼這個數據跟你剛剛說的有落差？",
      "這個數據是怎麼得來的？（方法論追問）",
    ],
    hitNote: "命中率最高（2 強命中對應到全部 3 題真實問題的核心）。這場面試官問的正好就是「數字怎麼來的、基準是什麼、有沒有落差」——完全對上這版 prompt「成果量化追問」的設計目標。",
  },

  // ---------- 示範假資料（5 筆，純粹增加可瀏覽的量，沒有命中率） ----------
  {
    id: "frontend",
    label: "前端工程師求職者",
    industry: "電商",
    role: "前端工程師",
    isMock: true,
    background: "2 年前端經驗，主要用 React，曾參與一個購物車改版專案，帶來轉換率提升。目前在一間中型電商公司工作。",
    jd: "前端工程師，需熟悉 React／TypeScript，具備效能優化經驗，能與後端及設計協作。",
    predictions: [
      { category: "成果量化追問", question: "「轉換率提升」具體提升了多少？怎麼歸因是購物車改版造成的？", source_phrase: "帶來轉換率提升", prep_note: "準備明確數字與歸因方法（例如 A/B test 結果）。" },
      { category: "角色與決策追問", question: "購物車改版專案裡，你負責的部分是什麼？跟設計/後端意見不一致時怎麼處理？", source_phrase: "曾參與一個購物車改版專案", prep_note: "拆解自己實際負責的範圍，準備一個協作衝突的例子。" },
      { category: "JD 缺口追問", question: "JD 要求效能優化經驗，背景沒有提到，能否舉一個實際案例？", source_phrase: "JD「效能優化經驗」vs. 背景未提及", prep_note: "準備至少一個 loading 時間、bundle size 或 render 效能相關的具體案例。" },
    ],
    actionRecommendations: [
      "準備轉換率提升的具體數字與歸因方法，不要只說「有提升」。",
      "補一個效能優化的具體案例，即使規模不大也要能講清楚問題與解法。",
    ],
  },
  {
    id: "hr",
    label: "人資求職者",
    industry: "製造業",
    role: "人資專員",
    isMock: true,
    background: "3 年人資經驗，做過招募與員工關係，曾經手一次組織重整，過程中沒有太多細節描述。",
    jd: "人資專員，需具備招募、勞資關係處理經驗，能獨立處理員工申訴案件。",
    predictions: [
      { category: "角色與決策追問", question: "組織重整過程中，你實際負責的部分是什麼？遇到最困難的取捨是什麼？", source_phrase: "曾經手一次組織重整", prep_note: "準備具體角色與一個困難決策的例子，不要只描述「有經手」。" },
      { category: "JD 缺口追問", question: "JD 要求能獨立處理員工申訴案件，背景沒有提到相關經驗，能否舉例？", source_phrase: "JD「獨立處理員工申訴案件」vs. 背景未提及", prep_note: "若沒有直接經驗，準備類似情境的處理邏輯。" },
      { category: "成果量化追問", question: "3 年人資經驗裡，經手過幾次招募？平均到職率或留任率大概是多少？", source_phrase: "做過招募與員工關係", prep_note: "準備具體招募量與留任率相關數字。" },
    ],
    actionRecommendations: [
      "把組織重整的角色與困難取捨想清楚，準備成一個完整的故事。",
      "針對員工申訴處理，準備一個處理邏輯或類似情境的例子。",
    ],
  },
  {
    id: "finance",
    label: "財務分析求職者",
    industry: "金融服務",
    role: "財務分析師",
    isMock: true,
    background: "1.5 年財務分析經驗，主要做預算編製與月結報表，曾協助簡化一項報表流程。",
    jd: "財務分析師，需具備財務模型建置能力、跨部門溝通經驗，並能提出成本改善建議。",
    predictions: [
      { category: "成果量化追問", question: "簡化報表流程後，時間或人力成本省了多少？怎麼衡量的？", source_phrase: "協助簡化一項報表流程", prep_note: "準備具體的節省時數或人力比例，以及衡量方式。" },
      { category: "JD 缺口追問", question: "JD 要求財務模型建置能力，背景只提到預算編製與月結，能否舉一個建過模型的例子？", source_phrase: "JD「財務模型建置能力」vs. 背景未提及", prep_note: "若沒有正式建模經驗，準備用 Excel 做過的類似分析。" },
      { category: "動機一致性追問", question: "背景是預算與月結為主，這個職位偏重成本改善建議，你怎麼看這個落差？", source_phrase: "背景「預算編製與月結報表」vs. JD「成本改善建議」", prep_note: "想清楚過去經驗跟成本分析之間的連結。" },
    ],
    actionRecommendations: [
      "準備簡化報表流程的具體效益數字，不要只說「有簡化」。",
      "補一個財務模型或类似分析的案例，即使工具只是 Excel 也要講清楚邏輯。",
    ],
  },
  {
    id: "cs",
    label: "客服主管求職者",
    industry: "電信",
    role: "客服主管",
    isMock: true,
    background: "5 年客服經驗，帶過 8 人團隊，曾處理過幾次重大客訴，團隊滿意度有改善。",
    jd: "客服主管，需具備團隊管理經驗、危機處理能力，並能建立標準作業流程（SOP）。",
    predictions: [
      { category: "成果量化追問", question: "「團隊滿意度有改善」具體是從多少改善到多少？怎麼衡量的？", source_phrase: "團隊滿意度有改善", prep_note: "準備具體的滿意度數字或調查方式。" },
      { category: "角色與決策追問", question: "帶 8 人團隊時，遇到績效不佳的成員，你怎麼處理？", source_phrase: "帶過 8 人團隊", prep_note: "準備一個具體的績效管理案例，說明你的決策過程。" },
      { category: "JD 缺口追問", question: "JD 要求建立 SOP 的經驗，背景沒有提到，能否舉一個例子？", source_phrase: "JD「建立標準作業流程（SOP）」vs. 背景未提及", prep_note: "準備一個實際整理過流程或規則的例子，即使不是正式 SOP。" },
    ],
    actionRecommendations: [
      "準備團隊滿意度改善的具體數字與衡量方式。",
      "補一個處理績效不佳成員的具體案例。",
    ],
  },
  {
    id: "ops",
    label: "電商營運求職者",
    industry: "跨境電商",
    role: "營運專員",
    isMock: true,
    background: "2 年電商營運經驗，負責過商品上架與庫存管理，曾遇過一次缺貨危機。",
    jd: "電商營運專員，需具備供應鏈協調經驗、數據分析能力，並能跨部門推動專案。",
    predictions: [
      { category: "角色與決策追問", question: "那次缺貨危機，你當時怎麼判斷優先處理順序？跟供應商怎麼協調？", source_phrase: "曾遇過一次缺貨危機", prep_note: "準備完整的危機處理時間線與決策邏輯。" },
      { category: "JD 缺口追問", question: "JD 要求數據分析能力，背景只提到上架與庫存管理，能否舉一個用數據做決策的例子？", source_phrase: "JD「數據分析能力」vs. 背景未提及", prep_note: "準備一個具體的數據判斷案例，即使工具簡單也要講清楚邏輯。" },
      { category: "成果量化追問", question: "負責的商品上架與庫存管理，規模大概是多少 SKU？庫存周轉率有沒有改善？", source_phrase: "負責過商品上架與庫存管理", prep_note: "準備具體 SKU 數量與周轉率相關數字。" },
    ],
    actionRecommendations: [
      "把缺貨危機的處理時間線與決策邏輯整理成一個完整故事。",
      "補一個用數據做營運決策的具體例子。",
    ],
  },
];

function realPersonas() {
  return PERSONAS.filter((p) => !p.isMock);
}

// 首次載入時的預設種子資料（給投遞紀錄／履歷版本用），使用者之後可以自由新增/刪除，
// 改動會存進 localStorage，不會因為重新整理就不見。
function seedApplications() {
  return [
    { id: "seed-1", company: "示範電商公司 A", position: "行銷企劃", resumeVersion: "v1", status: "投遞・無回應" },
    { id: "seed-2", company: "示範電商公司 B", position: "行銷企劃", resumeVersion: "v2", status: "被查看" },
    { id: "seed-3", company: "示範遊戲公司 C", position: "產品行銷", resumeVersion: "v2", status: "進面試" },
  ];
}

function seedResumeVersions() {
  return [
    { id: "rv-1", label: "v1", viewRate: 40, note: "第一版，條列式工作內容" },
    { id: "rv-2", label: "v2", viewRate: 65, note: "加了量化成果" },
    { id: "rv-3", label: "v3", viewRate: 78, note: "針對 JD 客製開頭" },
  ];
}
