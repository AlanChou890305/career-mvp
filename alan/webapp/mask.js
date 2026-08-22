// 示範模式：把個人與公司的敏感資訊換成代號。
// 只在畫面渲染時替換，state 與 localStorage 存的仍是原文。
const MASKS = [
  // 個人身分
  [/周庭毅/g, "示範資料"],
  [/Alan\s+Chou/gi, "示範資料"],
  [/\bAlan\b/g, "示範資料"],
  [/\+?886\s?9\d{2}[\s-]?\d{3}[\s-]?\d{3}/g, "09xx-xxx-xxx"],
  [/09\d{2}[\s-]?\d{3}[\s-]?\d{3}/g, "09xx-xxx-xxx"],
  [/[\w.+-]+@[\w-]+\.[\w.]+/g, "xxx@xxx.com"],
  [/https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+/gi, "linkedin.com/in/xxxx"],
  [/https?:\/\/(www\.)?github\.com\/[\w-]+/gi, "github.com/xxxx"],
  [/linkedin\.com\/in\/[\w-]+/gi, "linkedin.com/in/xxxx"],
  [/github\.com\/[\w-]+/gi, "github.com/xxxx"],

  // 現在／過去雇主
  [/Hububble/gi, "H 公司"],
  [/TBM\s*CORPORATION/gi, "B 公司"],
  [/\bTBM\b/g, "B 公司"],
  [/EKPOS/gi, "該 POS 產品"],

  // 目標公司
  [/inline\s*樂排股份有限公司/g, "T 公司"],
  [/inline\s*樂排/g, "T 公司"],
  [/\binline\b/gi, "T 公司"],

  // 合作夥伴
  [/Appier/gi, "A 夥伴"],
  [/漸強實驗室/g, "B 夥伴"],
  [/漸強/g, "B 夥伴"],
  [/Infobip/gi, "C 夥伴"],
  [/綠界科技/g, "D 金流"],
  [/綠界/g, "D 金流"],
  [/互動資通/g, "E 夥伴"],
  [/LittleHelp/gi, "F 夥伴"],

  // 學歷
  [/國立中興大學/g, "國立大學"],
  [/義大利維羅納大學[^｜\n]*/g, "歐洲交換學生"],
  [/University\s+of\s+Verona/gi, "European University"],

  // 自有產品
  [/TaskCal/g, "個人 App"],
  [/ScoreDrop/g, "個人工具"],
];

function maskText(s) {
  if (!s) return s;
  let out = s;
  for (const [re, to] of MASKS) out = out.replace(re, to);
  return out;
}
