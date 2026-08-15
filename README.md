# career-mvp｜職涯探索工具

第三組 B 組（Alan、Berry、Sunny）的職涯探索工具專案。

`career-mvp` 是工作代號，正式名稱等驗證跑完再取。

---

## 這個 repo 是什麼

這裡放的是**三個人共用的前提**：研究結論、產品命題、驗證方法、原始素材。

`main` 不放應用程式碼。每個人從 `main` 開自己的分支，在分支裡做自己版本的 MVP，最後一起收斂討論。分支之間不互相合併——它們是三個互斥的提案，不是三個互補的功能。

## 三分鐘上手

```bash
git clone <repo-url>
cd career-mvp
git checkout -b mvp/你的名字        # alan / berry / sunny
```

接著讀這三份，大約十五分鐘：

1. [`docs/product-thesis.md`](docs/product-thesis.md) — 我們在解什麼問題、為誰解、憑什麼
2. [`docs/mvp-scope.md`](docs/mvp-scope.md) — 這次做什麼、不做什麼
3. [`docs/validation-plan.md`](docs/validation-plan.md) — 怎麼知道做對了

其餘的等需要時再翻。

## 檔案在哪

```
career-mvp/
├── README.md                     ← 你正在讀的這份
├── CLAUDE.md                     Claude Code 的共同前提，開 session 時自動載入
├── docs/
│   ├── product-thesis.md         產品命題：問題、對象、利基點、價值主張
│   ├── personas.md               8 位 Persona 與痛點原型 A–I
│   ├── competitive-landscape.md  18 個競品、24 組象限、白地判定
│   ├── mvp-scope.md              這次驗證的範圍：必做、選做、不做
│   ├── validation-plan.md        雙軌驗證方法與判準
│   ├── glossary.md               用詞統一表
│   └── git-cheatsheet.md         協作方式與五個會用到的指令
└── assets/
    ├── research/                 推演過程的原始截圖（不可變）
    ├── source/                   原始 HTML 推演文件與 PDF（不可變）
    └── fixtures/                 共用測試語料（面試心得對照表）
```

`assets/` 是歷史紀錄，只增不改。`docs/` 是可維護的萃取版本，結論會隨討論更新。

## 協作方式

- 做自己的 MVP → 待在自己的 `mvp/xxx` 分支，不用管 `main`
- 要改共用文件 → 開 `docs/主題` 分支，發 PR，Alan review 後合併
- `main` 已開啟保護，任何人都不能直接推——包含 Alan

不熟 git 沒關係，[`docs/git-cheatsheet.md`](docs/git-cheatsheet.md) 列了會用到的全部指令。也可以直接跟 Claude Code 說「我要開始做我的 MVP」，它讀得到 `CLAUDE.md` 裡的分支規則，會幫你切到對的地方。

## 現在的進度

MVP 驗證階段。目標是回答兩個問題：

- AI 追問的**進階問題**，命不命中面試官真正會問的
- AI 給的**行動推薦**，有沒有人真的照做

不做前端、不做完整產品。詳見 [`docs/mvp-scope.md`](docs/mvp-scope.md)。

---

推演內容與競品評分為團隊推估，尚未經市場驗證。
