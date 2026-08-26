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
  {
    id: "hr",
    label: "人資求職者（真實語料）",
    industry: "公關顧問業",
    role: "資深人力資源管理師（招募）",
    isMock: false,
    source: "https://www.ptt.cc/bbs/Salary/M.1580530629.A.FD4.html",
    background:
      "5 年 HR 經驗（4 年科技產業＋1 年餐飲食品業），企業管理與教育訓練雙專業，HRM 相關學分超過 32 學分，有 3 間公司 HR 實習經驗、20 堂以上進修課程。求職條件：薪資 4 萬以上、公司規模 100 人以上、英文工作環境。",
    jd: "資深人力資源管理師（擴編），負責台灣地區招募，面試分三關（電話 → 面對面 → CEO 面試）。",
    predictions: [
      { category: "成果量化追問", question: "5 年 HR 經驗裡，你主導或參與的招募案例，平均到職天數、offer 接受率、留任率是多少？計算基準是什麼？", source_phrase: "5 年 HR 經驗（4 年科技產業＋1 年餐飲食品業）", prep_note: "挑 1-2 個具體招募專案，準備清楚的數字與統計範圍。", hit: "miss" },
      { category: "成果量化追問", question: "20 堂以上進修課程中，有哪幾堂實際應用在工作上？帶來什麼可衡量的改變？", source_phrase: "20 堂以上進修課程", prep_note: "挑 2-3 堂跟招募/面談相關的課程，準備「學了什麼→用在哪裡→改變什麼」的敘事。", hit: "miss" },
      { category: "角色與決策追問", question: "3 間公司 HR 實習裡，你的角色與職責範圍是什麼？有沒有跟主管意見不同、自己拿主意的情況？", source_phrase: "3 間公司 HR 實習經驗", prep_note: "先釐清實習與正職的職責界線，準備一個具體分歧情境。", hit: "miss" },
      { category: "角色與決策追問", question: "從科技產業轉到餐飲食品業，是主動選擇還是被動安排？當時考量的取捨是什麼？", source_phrase: "4 年科技產業＋1 年餐飲食品業", prep_note: "誠實準備轉職原因，不迴避、不美化。", hit: "miss" },
      { category: "JD 缺口追問", question: "這個職缺要處理「擴編」的量產型招募，過去有沒有同時開多職缺、優化招募流程或雇主品牌的案例？", source_phrase: "JD「負責台灣地區招募」＋「擴編」vs. 背景偏重教育訓練", prep_note: "誠實界定做過的招募環節，準備補強說法。", hit: "weak" },
      { category: "JD 缺口追問", question: "面試最後一關是 CEO，你有沒有對高階主管精準報告用人建議的經驗？", source_phrase: "JD「CEO 面試」vs. 背景未提及高階溝通經驗", prep_note: "準備一個對上級提出用人建議的例子，強調精簡表達。", hit: "miss" },
      { category: "動機一致性追問", question: "專業背景是教育訓練，這個職缺核心是招募，為什麼選這個方向？", source_phrase: "背景「教育訓練雙專業」vs. JD「負責招募」", prep_note: "準備招募與訓練的連結敘事，佐以具體例子。", hit: "miss" },
      { category: "動機一致性追問", question: "求職條件薪資 4 萬以上，但職缺是「資深」職稱，市場薪資通常更高，這個數字是底線還是目標？", source_phrase: "背景「薪資 4 萬以上」vs. JD「資深」", prep_note: "先做市場薪資調查，想清楚 4 萬的定位。", hit: "miss" },
    ],
    actionRecommendations: [
      "重新盤點所有跟招募直接相關的具體事蹟，並盡量附上可量化的佐證數字，補強「教育訓練背景」與「招募職缺」之間的定位落差。",
      "釐清「實習」與「正職」的責任邊界，避免面試官混淆你實際擁有決策權的範圍。",
      "寫一段 2-3 句話的「為什麼是這個職缺、為什麼是現在」核心說法，檢查每個回答是否都能扣回這條主線。",
    ],
    realQuestions: [
      "找工作看重的點？為什麼？",
      "公司可以怎麼做去吸引應徵者？",
      "針對未來大型招募活動你有哪些戰略？",
      "若只能在為公司賺取利益和爭取員工權益做選擇，你會怎麼選？",
      "加入後第一個會做什麼事情？",
    ],
    hitNote: "命中率低（約 1/8，弱）。真實問題偏向價值觀取捨、招募策略發想與到職規劃，這版 prompt 抓的是「背景/JD 裡的證據缺口」，兩者對不太上——這場面試官問的是「你會怎麼做」的開放策略題，不是在查核履歷細節。",
  },
  {
    id: "pharma",
    label: "醫藥業務求職者（真實語料）",
    industry: "製藥／醫療器材",
    role: "醫藥業務代表",
    isMock: false,
    source: "https://www.ptt.cc/bbs/Bioindustry/M.1525794914.A.20D.html",
    background:
      "成大醫技學士、陽明醫工碩士，論文專長為人體訊號分析演算法，成績後段班，無特殊學術表現，退伍後開始求職，應徵多家外商醫材與藥廠的業務職位。",
    jd: "醫藥業務代表，面試分兩階段：第一階段與直屬長官及產品線主管（共三位）面談；第二階段與 NSM 和 HR 主管進行，含英文測試與閱讀測驗，最後進行 reference check。",
    predictions: [
      { category: "成果量化追問", question: "論文專長是人體訊號分析演算法，具體做出的成果是什麼？怎麼被驗證有效？", source_phrase: "論文專長為人體訊號分析演算法", prep_note: "準備研究目標、負責部分、評估方法的具體敘述。", hit: "miss" },
      { category: "成果量化追問", question: "成績後段班，這段時期你的時間實際投入在哪裡？", source_phrase: "成績後段班，無特殊學術表現", prep_note: "想清楚時間分配，準備一個具體、可檢驗的例子。", hit: "miss" },
      { category: "角色與決策追問", question: "應徵多家外商醫材藥廠業務，你是怎麼篩選、排除其他職缺類型（研發、學術）的？", source_phrase: "應徵多家外商醫材與藥廠的業務職位", prep_note: "準備篩選標準，說清楚為什麼是業務而非研發/PM。", hit: "weak" },
      { category: "角色與決策追問", question: "有沒有帶領小組或說服他人的具體經驗？", source_phrase: "背景缺乏工作/實習經驗描述", prep_note: "盤點研究所/社團經驗中說服他人或協調資源的具體事件。", hit: "weak" },
      { category: "JD 缺口追問", question: "業務工作需要陌生開發、面對面說服客戶，你怎麼證明自己有這方面的意願與能力？", source_phrase: "JD「醫藥業務代表」vs. 背景無銷售經驗", prep_note: "準備一個主動接觸陌生人、推銷想法的真實經驗。", hit: "strong" },
      { category: "JD 缺口追問", question: "第二階段有英文測試與閱讀測驗，你怎麼證明自己的英文讀寫口說能力？", source_phrase: "JD「英文測試與閱讀測驗」vs. 背景未提及英文能力", prep_note: "準備具體英文能力佐證或研究英文文獻的經驗。", hit: "miss" },
      { category: "JD 缺口追問", question: "reference check 時，你的指導教授會怎麼形容你面對壓力的反應？", source_phrase: "JD「reference check」vs. 背景無工作經驗可對照", prep_note: "誠實預估教授評價，準備面對截止期限的具體故事。", hit: "weak" },
      { category: "動機一致性追問", question: "念了六年醫技/醫工，專長訊號分析，為什麼現在轉做業務而不是相關技術職位？", source_phrase: "陽明醫工碩士，論文專長訊號分析 vs. 應徵業務職位", prep_note: "準備誠實、有邏輯的轉職敘事，避免「研究做不好才轉業務」的說法。", hit: "strong" },
    ],
    actionRecommendations: [
      "把「轉職故事」寫成一個 30 秒版本反覆打磨，確保每個回答都呼應同一條核心敘事。",
      "把醫技/醫工背景轉化成業務職位的差異化優勢，主動證明專業知識能幫助讀懂產品、跟醫師對話。",
      "針對英文測試提早模擬，練習用英文描述產品機轉或適應症。",
    ],
    realQuestions: [
      "上一份工作中覺得最值得驕傲的事／最挫折的事。",
      "上一份工作內容與自身強項。",
      "對產業與業務工作內容的了解。",
      "如果順利得到工作，去醫院第一天會做什麼？",
      "朋友眼中你是怎樣的人？",
      "前公司主管會如何評價你？",
      "業務最重要的特質是什麼？",
      "情境題（觀察面試官個性並說明接近方式）。",
      "醫院跑訪中遇過的挫折。",
      "轉職原因。",
      "自我介紹與大學社團經驗。",
      "公司內除工作外的參與活動。",
    ],
    hitNote: "命中率中等（2 強命中）。「陌生開發意願」與「轉職動機」被準確預測到——正是背景與 JD 之間最大的落差。「業務最重要的特質」「醫院跑訪挫折」等經驗導向的開放題沒有被預測到，這類題型比較依賴業務職缺的通用考古題，不是這版 prompt 的目標。",
  },
  {
    id: "socialwork",
    label: "社工求職者（真實語料）",
    industry: "非營利／社會福利",
    role: "社工員",
    isMock: false,
    source: "https://www.ptt.cc/bbs/SW_Job/M.1279713275.A.943.html",
    background:
      "應屆畢業生（2010 年），應徵多家社福機構的社工員職位。",
    jd: "社工員，面試流程包含上機測驗、筆試（每題 20 分）與 20 分鐘個人面試。",
    predictions: [
      { category: "成果量化追問", question: "實習或課程實作中提到「協助個案穩定/改善」，這是怎麼定義和判斷的？有沒有評估工具？", source_phrase: "背景未提供任何實習成果描述（缺口回推）", prep_note: "回想至少一個個案或活動，準備判斷進展的具體指標。", hit: "miss" },
      { category: "成果量化追問", question: "社工實習時數是多少？服務過幾位個案？這些數字怎麼計算的？", source_phrase: "背景未提供任何實習經歷細節", prep_note: "準備精確數字：機構名稱、時數、服務對象類型與人數。", hit: "miss" },
      { category: "角色與決策追問", question: "實習中有沒有遇過需要自己判斷「要不要通報／介入」的情境？當時怎麼決定？", source_phrase: "社工員職位本質涉及通報判斷，背景未提及相關經驗", prep_note: "回想督導帶你討論過的個案，準備清楚說出兩難與思考過程。", hit: "weak" },
      { category: "角色與決策追問", question: "小組作業中有沒有擔任協調不同角色的角色？意見不合時怎麼處理？", source_phrase: "背景未提及任何團隊角色或協調經驗", prep_note: "準備一個具體小組合作案例，說清楚取捨點。", hit: "miss" },
      { category: "JD 缺口追問", question: "筆試通常考社政法規、個案工作方法，你對社會救助法、兒少權法等法規準備狀況如何？", source_phrase: "JD「筆試（每題 20 分）」隱含法規/專業知識比重高", prep_note: "針對投遞的每個機構服務對象類型，複習對應核心法規。", hit: "weak" },
      { category: "JD 缺口追問", question: "上機測驗通常考什麼？你對社福個案管理系統或 Office 操作熟悉程度如何？", source_phrase: "JD「上機測驗」vs. 背景未提及系統/電腦技能", prep_note: "查詢機構上機測驗常見題型，練習公文寫作與 Office 操作。", hit: "weak" },
      { category: "JD 缺口追問", question: "不同機構服務對象差異很大，你對這個機構的服務對象了解多少？", source_phrase: "背景「應徵多家社福機構」，未說明差異化準備", prep_note: "針對每家機構分別寫下服務對象與常見核心議題。", hit: "miss" },
      { category: "動機一致性追問", question: "同時投多家性質不同的機構，這跟你真正想做的社工方向一致嗎？", source_phrase: "背景「應徵多家社福機構」呈現方向未收斂", prep_note: "想清楚自己是廣泛探索還是已有明確偏好，準備對這家機構的具體理由。", hit: "miss" },
    ],
    actionRecommendations: [
      "強制寫出至少 3-5 個具體事件（實習、課程專題、志工、打工經驗），每個都要能講出情境、角色、困難與行動。",
      "針對筆試與上機測驗做針對性複習：社工相關法規、社會工作直接服務方法、公文寫作、Office 操作。",
      "針對每家投遞機構做差異化準備，避免用同一套「應屆畢業生標準答案」應付所有面試。",
    ],
    realQuestions: [
      "（上機測驗）設計一日親子遊活動，依一般活動計劃撰寫方式（含活動時間、地點、名稱、宗旨）。",
      "（上機測驗）依據統計資料製作圖表，並依據資料說明看到的現象。",
      "（筆試）母攜子燒炭新聞，根據兒童保護觀點及危機處遇原則，你會怎麼做？",
      "（筆試）社工倫理守則，自己覺得重要的，依先後順序說明。",
      "（筆試）助人過程中，面對不同壓力，自己的處理態度及因應方式為何？",
      "（筆試）單親家庭面臨的問題可能有哪些？你將如何運用助人技巧及資源協助？",
      "（筆試）目前台灣的福利政策大多屬於「殘補式」福利政策，家扶未來可提供哪些一般性的關懷服務？",
      "（面試）自我介紹，並針對個人履歷延伸提問。",
    ],
    hitNote: "命中率中等偏低（2 弱命中：預測到會有法規/政策類筆試、也預測到會有上機測驗，但猜錯了上機測驗的實際內容）。背景資訊極度精簡，這版 prompt 主要靠「背景/JD 缺口」推論，背景一旦空白，追問就只能猜測試的「形式」而猜不到「內容」。",
  },
  {
    id: "frontend_real",
    label: "前端工程師求職者（真實語料）",
    industry: "軟體／科技",
    role: "Senior 前端工程師",
    isMock: false,
    source: "https://www.pttweb.cc/bbs/Soft_Job/M.1649256877.A.73F",
    background:
      "四大學士肄業，工作總年資 2 年 2 個月，曾任職三家公司（7、7、12 個月），主要技能 React 與 React Native。",
    jd: "Senior 前端工程師（兩年或三年以上經驗）。",
    predictions: [
      { category: "成果量化追問", question: "React／React Native 專案的規模、效能數字或成果佐證是什麼？", source_phrase: "背景僅列出技能名稱，沒有成果敘述", prep_note: "準備 1-2 個具體專案，講清楚規模、負責範圍、量化改善。", hit: "miss" },
      { category: "成果量化追問", question: "如何量測「優化效能／提升使用者體驗」的實際成效？", source_phrase: "常見於此類背景但未展開的美化字眼", prep_note: "先自問怎麼量測，若沒有工具就誠實說明。", hit: "miss" },
      { category: "角色與決策追問", question: "兩年兩個月內任職三家公司，每次轉職的決策脈絡是什麼？", source_phrase: "工作總年資 2 年 2 個月，三家公司（7、7、12 個月）", prep_note: "準備清楚、一致、不互相矛盾的離職原因。", hit: "miss" },
      { category: "角色與決策追問", question: "有沒有主導或帶領技術決策的實例？你在決策鏈中的實際位置是什麼？", source_phrase: "年資僅 2 年 2 個月，「主導/帶領」類敘述可信度容易被質疑", prep_note: "誠實區分「提出建議」「做決定」「獨立執行」。", hit: "miss" },
      { category: "JD 缺口追問", question: "JD 要求 Senior，但總年資僅 2 年 2 個月，你怎麼定義自己已具備 Senior 該有的能力？", source_phrase: "JD「Senior（兩年或三年以上經驗）」vs. 背景年資邊緣", prep_note: "準備 1-2 個實例證明承擔超出年資的責任範疇。", hit: "miss" },
      { category: "JD 缺口追問", question: "有沒有單元測試/E2E/CI/CD 相關經驗？", source_phrase: "背景中無測試/部署相關描述", prep_note: "誠實盤點測試框架與 CI 工具經驗程度。", hit: "miss" },
      { category: "JD 缺口追問", question: "React Native 專案裡有沒有碰過原生模組整合（iOS/Android bridging）？", source_phrase: "背景僅寫「React Native」，未說明是否碰過原生層", prep_note: "準備回答是否碰過 native module、上架流程。", hit: "miss" },
      { category: "動機一致性追問", question: "肄業＋連換三家短任期工作，這次應徵 Senior，你打算怎麼證明會穩定留下來？", source_phrase: "學士肄業＋三份 7/7/12 個月工作 vs. JD 隱含穩定性期待", prep_note: "準備誠實正向的敘事，並具體說明這次為何不同。", hit: "miss" },
    ],
    actionRecommendations: [
      "在自我介紹階段主動定調「Senior」的自我評估依據，掌握敘事主動權，不要等被問。",
      "把三段工作的離職原因先列成表格，檢查是否有邏輯上互相矛盾的地方。",
      "針對測試/CI/RN 原生整合等缺口，準備「誠實坦承＋展示學習路徑」的固定回答結構。",
    ],
    realQuestions: [
      "JS 概念名詞解釋與程式碼執行結果判斷（scope、closure、arrow function、this、async、prototype、promise）。",
      "React 生命週期、useEffect、useMemo、useCallback、key、HOC、class vs functional component、Reconciliation、SyntheticEvent、refs。",
      "Web 相關：localStorage vs sessionStorage vs cookies、HTTP Status Code、SSR、CORS、web worker、CSRF、browser rendering。",
      "CSS：權重計算、px vs em vs rem、SCSS/LESS、styled-component、置中方式、切版。",
      "LeetCode easy 等級演算法題（約 2/3 公司會考，且會追問優化方法）。",
      "現場實作：費氏數列與質數判斷＋切版、Autocomplete 元件、定時寄送 Gmail 功能。",
    ],
    hitNote: "命中率很低（約 0/8）。真實面試幾乎全是標準化技術知識題（JS/React/CSS/演算法），跟 PayPay 資料科學那筆語料同樣的模式——這類「不管是誰都問得出來」的技術篩選題，不是這版 prompt 針對「背景/JD 缺口」設計的目標。",
  },
  {
    id: "telecom",
    label: "會計求職者（真實語料）",
    industry: "電信",
    role: "會計管理師",
    isMock: false,
    source: "https://www.ptt.cc/bbs/Salary/M.1540442777.A.835.html",
    background:
      "國立會計碩士畢業，TOEIC 980、JLPT N3，持有台灣 CPA 執照，曾在四大會計師事務所工作 2 年 1 個月。",
    jd: "會計管理師，職務涉及會計處三個功能的管理工作，面試分一面（小主管、會計處長）與二面（人資電話面試）。應徵公司為電信業者。",
    predictions: [
      { category: "成果量化追問", question: "四大事務所 2 年 1 個月，實際負責過幾家客戶、什麼產業？扮演的角色是哪個層級？", source_phrase: "曾在四大會計師事務所工作 2 年 1 個月", prep_note: "列出客戶數、產業、獨立負責的科目。", hit: "miss" },
      { category: "成果量化追問", question: "TOEIC 980、JLPT N3，實際用日文或英文處理過什麼業務？", source_phrase: "TOEIC 980、JLPT N3", prep_note: "準備具體案例，或誠實說明是否為考試導向。", hit: "miss" },
      { category: "角色與決策追問", question: "這個職位要管理三個功能，你完全沒有管理經驗，怎麼說明自己準備好承擔？", source_phrase: "JD「會計處三個功能的管理工作」vs. 背景無管理經驗", prep_note: "誠實定位自己，準備逐步承擔管理責任的說法。", hit: "miss" },
      { category: "角色與決策追問", question: "查核工作中有沒有跟客戶意見不一致、需要自己判斷是否調整分類或估計的情況？", source_phrase: "背景僅描述「曾在四大會計師事務所工作」，無具體案例", prep_note: "準備 1-2 個具體會計判斷爭議情境。", hit: "miss" },
      { category: "JD 缺口追問", question: "電信業有 IFRS 15、資本密集資產折舊等特殊會計處理，你完全沒有相關產業經驗，怎麼看這個落差？", source_phrase: "JD「應徵公司為電信業者」vs. 背景無產業經驗", prep_note: "主動提出查核案中若曾接觸電信/公用事業客戶；否則準備補齊計畫。", hit: "miss" },
      { category: "JD 缺口追問", question: "你的經歷偏查核，有沒有稅務簽證、內控/內稽或 FP&A 的實務經驗？", source_phrase: "JD「三個功能的管理」vs. 背景偏查核導向", prep_note: "誠實區分「審視過」與「執行過」的差別。", hit: "miss" },
      { category: "動機一致性追問", question: "有 CPA 且四大經歷，一般會留在事務所升遷，為什麼想跳到需要管理三個功能的職位？", source_phrase: "背景「四大 2 年多＋CPA」vs. JD 管理職級落差", prep_note: "準備對職位落差有自覺、且有具體補齊計畫的說法。", hit: "weak" },
      { category: "動機一致性追問", question: "為什麼選電信業，而不是其他四大常見出路？對這家公司做過什麼功課？", source_phrase: "背景全無「電信」相關陳述，JD 明確指向電信業", prep_note: "準備公司基本財務資訊與電信業會計特性的初步理解。", hit: "strong" },
    ],
    actionRecommendations: [
      "先自己承認資歷與管理職級的落差，準備誠實但有建設性的敘事，說明打算怎麼快速補齊。",
      "把「查核」經驗轉譯成「被查核方需要的能力」，準備 2-3 個具體查核案例。",
      "做好電信業的基本功課，並區分一面（專業深度）與二面（動機、穩定性）的準備重點。",
    ],
    realQuestions: [
      "請自我介紹。",
      "過去工作上的狀況如何？",
      "為什麼想來這裡？",
      "我們公司規模還遠不及其他電信業，以你的資歷要去其他業者都沒問題，為什麼會想選我們？",
      "我們目前在虧損中，您覺得前景看好嗎？不然為什麼要來？",
    ],
    hitNote: "命中率中等（1 強命中）。「為什麼選電信業、做過什麼功課」被準確預測到，直接對應到面試官最尖銳的兩題（公司規模落差、虧損前景）。技術性追問（IFRS15、稅務、管理經驗）完全沒被問到——這場面試官全程聚焦在動機與公司認知，不是專業深挖。",
  },
  {
    id: "retail",
    label: "零售儲備幹部求職者（真實語料）",
    industry: "零售／服飾",
    role: "儲備幹部",
    isMock: false,
    source: "https://www.ptt.cc/bbs/Salary/M.1339039038.A.985.html",
    background:
      "碩士畢業生，剛完成碩班口試準備畢業，投遞多份履歷後收到面試通知。",
    jd: "儲備幹部，需從門市人員開始做起，約 2–3 年後可升任儲備店長。應徵公司為服飾零售業。",
    predictions: [
      { category: "成果量化追問", question: "目前這份是第幾個面試邀約？跟其他公司的回覆比起來，你怎麼排序？", source_phrase: "背景「投遞多份履歷後收到面試通知」", prep_note: "準備清楚的優先順序邏輯，不要含糊帶過。", hit: "miss" },
      { category: "成果量化追問", question: "碩士論文/研究過程中，有沒有可以量化的具體成果？", source_phrase: "背景僅提「碩士畢業生」，無具體成果描述", prep_note: "想好 1-2 個能講出基準與算法的小故事。", hit: "miss" },
      { category: "角色與決策追問", question: "當時怎麼決定要念碩士、又怎麼決定畢業後投零售儲幹？中間放棄了哪些選項？", source_phrase: "背景「碩士畢業生」與應徵「服飾零售業儲幹」之間沒有交代連結", prep_note: "準備清楚放棄了什麼、放棄的具體理由。", hit: "weak" },
      { category: "角色與決策追問", question: "有沒有帶過人、或在團隊裡協調不同意見的經驗？", source_phrase: "JD 隱含未來管理職需求，背景未提及團隊帶領經驗", prep_note: "挖掘專題分工、社團活動等最接近的例子。", hit: "miss" },
      { category: "JD 缺口追問", question: "要先從門市第一線做起，碩士畢業後重新回到基層，你會不會覺得學歷用不上、有落差感？", source_phrase: "JD「需從門市人員開始做起」vs. 背景「碩士畢業生」", prep_note: "準備誠實且具體的說法，說明理解基層工作內容。", hit: "strong" },
      { category: "JD 缺口追問", question: "有沒有實際接觸客人、處理客訴或銷售相關的經驗？", source_phrase: "JD 隱含核心能力為銷售與顧客服務，背景未提及服務業經驗", prep_note: "用最相近的替代經驗類比，並說明補齊計畫。", hit: "miss" },
      { category: "JD 缺口追問", question: "儲幹需要輪班、假日上班、未來可能調任，對時間彈性與 2-3 年規劃想清楚了嗎？", source_phrase: "JD「約 2-3 年後可升任儲備店長」暗示長期輪調承諾", prep_note: "想清楚實際能接受的班表範圍，準備具體 2-3 年規劃。", hit: "weak" },
      { category: "動機一致性追問", question: "花時間念碩士做研究，現在選擇不需要碩士學歷、從基層做起的零售儲幹，這兩者的關聯是什麼？", source_phrase: "背景「碩士畢業生」與應徵「服飾零售業儲幹」方向明顯不一致", prep_note: "想清楚且誠實準備這個選擇的核心敘事。", hit: "strong" },
    ],
    actionRecommendations: [
      "把「碩士 → 零售儲幹」這條敘事線想通、想成一個完整故事，所有其他問題最終都會回到這條線上。",
      "主動補位服務業/銷售/帶人經驗的背景空白，盤點打工、家教、社團裡最貼近的例子。",
      "針對輪班、假日班、2-3 年規劃等承諾度問題，準備具體、可檢查的說法，不要用空泛保證應付。",
    ],
    realQuestions: [
      "你有沒有來錯地方？",
      "為什麼在履歷中表達不願當門市人員？",
      "為什麼想到 UNIQLO 工作？",
      "所以你不會日文，那你來幹嘛？",
      "30 歲時希望生活如何？",
      "有沒有想過海外工作，會想去哪個國家？",
    ],
    hitNote: "命中率最高（2 強命中）。真實面試幾乎全繞著「碩士學歷 vs. 基層零售工作」的落差追問，這正是這版 prompt「JD 缺口追問」與「動機一致性追問」的核心設計目標。唯一明顯的漏網之魚是「你不會日文」——一個語言能力缺口，這版 prompt 沒有主動去查證 JD 或背景裡有沒有語言要求，是設計上的盲點。",
  },
  {
    id: "hospitality",
    label: "飯店接待求職者（真實語料）",
    industry: "飯店／旅宿",
    role: "飯店前台／接待",
    isMock: false,
    source: "https://www.ptt.cc/bbs/ServiceInfo/M.1282241461.A.E83.html",
    background:
      "大五休學（肄業），27 歲，無正職經驗但有多份兼職經驗，曾接待外國學生，具基礎英文能力。",
    jd: "飯店前台／接待人員，需輪班（含大夜班），需具備基礎英文溝通能力。應徵公司為連鎖商務旅館。",
    predictions: [
      { category: "成果量化追問", question: "曾接待外國學生，具體接待多少人次、什麼場合、實際負責什麼工作項目？", source_phrase: "背景中「曾接待外國學生」", prep_note: "把這段經驗量化：次數、人數、時長、身份、具體工作。", hit: "miss" },
      { category: "成果量化追問", question: "「基礎英文能力」大概是什麼程度？能否舉一個實際用英文處理狀況的例子？", source_phrase: "背景/JD 中「基礎英文能力」", prep_note: "準備 1-2 個具體英文對話情境，誠實評估聽說水平。", hit: "miss" },
      { category: "角色與決策追問", question: "是什麼原因讓你決定大五休學？當時考慮過哪些其他選項？", source_phrase: "背景中「大五休學（肄業）」", prep_note: "想清楚休學真實原因，準備不迴避但也不過度負面的說法。", hit: "miss" },
      { category: "角色與決策追問", question: "接待外國學生遇到突發狀況時，是你自己當下決定怎麼處理，還是有人可以請示？", source_phrase: "背景中「接待外國學生」缺乏處理過程描述", prep_note: "準備一個具體突發狀況案例，展現獨立應變能力。", hit: "weak" },
      { category: "JD 缺口追問", question: "過去有沒有大夜班或不固定班表的經驗？長期上大夜班的作息與生活安排怎麼調整？", source_phrase: "JD「需輪班（含大夜班）」，背景未提及排班經驗", prep_note: "誠實評估能否穩定上大夜班，準備具體理由而非空泛承諾。", hit: "strong" },
      { category: "JD 缺口追問", question: "有沒有使用過訂房系統（PMS）、收銀機或 POS 系統的經驗？", source_phrase: "JD 隱含的前台系統操作要求，背景無相關描述", prep_note: "誠實說明沒有相關經驗，準備快速學習新流程的佐證例子。", hit: "miss" },
      { category: "動機一致性追問", question: "休學之後這段時間怎麼規劃生涯？為什麼現在決定往飯店前台這個方向？", source_phrase: "背景「大五休學」與應徵服務業前台之間缺乏連結說明", prep_note: "整理出一條連貫的敘事，把休學到現在的思考過程講清楚。", hit: "miss" },
      { category: "動機一致性追問", question: "換過幾份兼職，這次應徵前台預期能穩定做多久？", source_phrase: "背景「多份兼職經驗」暗示轉換頻繁", prep_note: "準備誠實但具建設性的答案，說明這次跟過去兼職性質不同之處。", hit: "miss" },
    ],
    actionRecommendations: [
      "把「休學」講成一條故事線：休學原因→這段時間的思考→現在選擇前台的理由，邏輯連貫。",
      "用兼職經驗補強而非隱藏「無正職經驗」，把每份兼職學到的具體能力講清楚。",
      "針對輪班與大夜班，提前想好務實的生活安排細節，不要只回答「可以配合」。",
    ],
    realQuestions: [
      "自我介紹。",
      "假使客人在你面前咆哮，你會怎麼處理？",
      "可否接受大夜班？",
      "請問你覺得我們這家飯店缺點是什麼？有什麼需要改進的地方？",
      "（董事長輪）超過 20 個問題以上的延伸提問。",
    ],
    hitNote: "命中率中等（1 強命中）。「大夜班接受度」被準確預測到。「客人咆哮怎麼處理」是通用服務業情境題，跟本版預測的「接待學生突發狀況」主題接近但不完全對應，算弱命中。「飯店缺點是什麼」這種考驗有沒有做功課的題型完全沒被預測到，這類題不是背景/JD 缺口能推論出來的。",
  },

  // ---------- 示範假資料（4 筆，純粹增加可瀏覽的量，沒有命中率） ----------
  {
    id: "hr_mock",
    label: "人資求職者（假資料，示範用）",
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
  {
    id: "uiux_mock",
    label: "UI/UX 設計師求職者（假資料，示範用）",
    industry: "軟體／SaaS",
    role: "產品設計師",
    isMock: true,
    background: "3 年 UI/UX 經驗，做過一個 App 改版案，說使用者滿意度有提升，作品集裡有 3 個案例。",
    jd: "產品設計師，需具備使用者研究、原型設計能力，能與 PM／工程師協作，熟悉 Figma。",
    predictions: [
      { category: "成果量化追問", question: "「使用者滿意度有提升」是怎麼量測的？改版前後的具體數字是多少？", source_phrase: "說使用者滿意度有提升", prep_note: "準備量測工具（問卷、SUS 分數、留存率）與改版前後的具體數字。" },
      { category: "JD 缺口追問", question: "JD 要求使用者研究能力，作品集案例有沒有包含研究方法（訪談、可用性測試）？", source_phrase: "JD「使用者研究」vs. 背景只提到「做過改版案」", prep_note: "針對每個作品集案例，補上當時用了什麼研究方法、發現了什麼。" },
      { category: "角色與決策追問", question: "改版案裡，設計方向是你自己決定的，還是配合 PM／工程師限制調整的？", source_phrase: "背景未說明角色與決策範圍", prep_note: "準備一個跟 PM 或工程師意見不一致、最後怎麼協調的具體例子。" },
    ],
    actionRecommendations: [
      "每個作品集案例補上量測數字與研究方法，不要只呈現最終畫面。",
      "準備一個跟他人意見不合、如何協調的具體故事。",
    ],
  },
  {
    id: "pm_mock",
    label: "產品經理求職者（假資料，示範用）",
    industry: "電商／SaaS",
    role: "產品經理",
    isMock: true,
    background: "2 年 PM 經驗，主導過一次新功能上線，說上線後帶動營收成長，目前管理一個小型產品線。",
    jd: "產品經理，需具備數據驅動決策能力、跨部門協調經驗，能獨立規劃產品路線圖。",
    predictions: [
      { category: "成果量化追問", question: "「帶動營收成長」具體成長多少？怎麼確認是這個新功能造成的，而不是其他因素？", source_phrase: "說上線後帶動營收成長", prep_note: "準備歸因方法（A/B test、時間序列比較）與具體數字。" },
      { category: "角色與決策追問", question: "「主導」這次新功能上線，實際決策範圍是什麼？跟工程/設計意見不同時怎麼處理？", source_phrase: "主導過一次新功能上線", prep_note: "拆解主導的具體範圍，準備一個跨部門協調衝突的例子。" },
      { category: "JD 缺口追問", question: "JD 要求獨立規劃產品路線圖，背景只提到管理一個小型產品線，能否舉一個規劃路線圖的例子？", source_phrase: "JD「獨立規劃產品路線圖」vs. 背景未提及", prep_note: "準備一個實際排過優先順序、砍過功能的具體案例。" },
    ],
    actionRecommendations: [
      "準備營收成長的歸因方法，不要只給結論性數字。",
      "補一個獨立規劃路線圖、砍功能或排優先序的具體案例。",
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
