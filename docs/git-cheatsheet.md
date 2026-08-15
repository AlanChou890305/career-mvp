# Git 協作方式

給第一次用 git 協作的人。這份只寫我們真的會用到的部分。

---

## 我們怎麼分工

`main` 放三個人共用的文件與素材，不放應用程式碼，而且已開啟保護——**任何人都不能直接推上去，包含 Alan**。

| 你在做什麼 | 你該在哪個分支 |
|---|---|
| 做自己版本的 MVP | `mvp/alan`、`mvp/berry`、`mvp/sunny` |
| 改共用文件（`docs/`、`README.md`、`CLAUDE.md`） | 開 `docs/主題` 分支，發 PR |
| 加共用語料到 `assets/fixtures/` | 開 `docs/fixtures-你的名字` 分支，發 PR |

三支 `mvp/` 分支之間不互相合併——它們是三個互斥的提案，不是三個互補的功能。要拿 `main` 的最新文件時，是單向從 `main` 同步過來。

## 關於 PR

PR 不需要等別人核准，開完可以自己按合併，不會卡住任何人。

這道關卡的用意不是審查，是兩件事：`main` 改不到，以及每次改動都留下紀錄，隔天其他人能看到共用前提被動了什麼。

改共用文件的完整流程：

```bash
git checkout main
git pull                       # 先拿最新的
git checkout -b docs/改了什麼    # 開一支新的
# ...改檔案...
git add .
git commit -m "改了什麼"
git push -u origin docs/改了什麼
```

推完 GitHub 會在頁面上顯示一個開 PR 的按鈕，按下去、再按 Merge 就好。合併後那支分支可以刪掉。

## 五個指令

**第一次拿到專案**

```bash
git clone <repo-url>
cd career-mvp
```

**開始做自己的 MVP（只做一次）**

```bash
git checkout -b mvp/你的名字
git push -u origin mvp/你的名字
```

**存檔（每天做很多次）**

```bash
git add .
git commit -m "做了什麼"
git push
```

**看自己在哪個分支**

```bash
git status
```

第一行會寫 `On branch mvp/berry`。不確定時就打這個。

**把 main 的最新文件拿過來**

```bash
git fetch origin
git merge origin/main
```

## 出事了怎麼辦

**「我好像在錯的分支上改了東西」**

還沒 commit 的話，改動會跟著你切分支：

```bash
git status              # 先確認自己在哪、改了什麼
git checkout mvp/你的名字   # 切到對的分支，改動會跟過來
```

已經 commit 了就先別動，跟 Alan 說一聲，這種情況救得回來但指令不只一行。

**「我想丟掉剛剛的改動，回到上次存檔的樣子」**

```bash
git checkout -- 檔名
```

丟掉的東西救不回來，所以指定檔名，不要一次丟全部。

**「我 push 不上去，說 main 被保護」**

這是防呆生效了，代表你人在 `main` 上。切到自己的分支：

```bash
git checkout mvp/你的名字
```

如果改動是在 `main` 上做的，改動會跟著切過來，再 commit 一次就好。

## 不確定就問 Claude

三個人都用 Claude Code，而 `CLAUDE.md` 裡寫了上面這些規則，所以可以直接用中文講：

- 「我要開始做我的 MVP」
- 「我改好了，幫我存起來」
- 「我現在在哪個分支？」
- 「幫我把 main 的最新文件拿過來」

它讀得到規則，會確認你在對的分支才動作。有疑慮時它會先問，不會自己亂做。

## 幾個不要用的指令

這些會丟掉工作而且救不回來，需要時找 Alan：

- `git push --force`
- `git reset --hard`
- `git clean -fd`
