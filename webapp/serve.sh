#!/usr/bin/env bash
# 固定用 8080。重跑會先關掉舊的，網址永遠一樣。
cd "$(dirname "$0")"
lsof -ti tcp:8080 | xargs kill -9 2>/dev/null
python3 -m http.server 8080 >/dev/null 2>&1 &
sleep 1
echo "http://localhost:8080"
