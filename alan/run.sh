#!/usr/bin/env bash
# 跑一組 prompt 對全部 fixture，輸出到 results/<組>/
# 用法：./run.sh a-baseline
#
# 盲測由本腳本保證：餵給 AI 的內容在 "## 實際被問的問題" 之前就被切斷，
# 標準答案不可能洩漏到輸入裡。

set -euo pipefail
cd "$(dirname "$0")"

GROUP="${1:?用法: ./run.sh <prompt 檔名，不含 .md>}"
PROMPT_FILE="prompts/${GROUP}.md"
[[ -f "$PROMPT_FILE" ]] || { echo "找不到 $PROMPT_FILE"; exit 1; }

OUT="results/${GROUP}"
mkdir -p "$OUT"

for fx in fixtures/*.md; do
  name="$(basename "$fx" .md)"

  industry="$(awk -F': ' '/^industry: /{print $2; exit}' "$fx")"
  role="$(awk -F': ' '/^role: /{print $2; exit}' "$fx")"

  # 切掉標準答案段：只留到「## 實際被問的問題」之前
  visible="$(awk '/^## 實際被問的問題/{exit} {print}' "$fx")"

  if [[ "$GROUP" == a-* ]]; then
    # baseline：只給產業與職位，不給背景
    input="產業：${industry}
職位：${role}"
  else
    input="產業：${industry}
職位：${role}

${visible}"
  fi

  echo "→ ${GROUP} / ${name}"
  {
    printf '%s\n\n---\n\n' "$(cat "$PROMPT_FILE")"
    printf '%s\n' "$input"
  } | claude -p > "${OUT}/${name}.md"
done

echo "完成，輸出在 ${OUT}/"
