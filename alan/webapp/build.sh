#!/usr/bin/env bash
# 打包成 dist/index.html。實際邏輯在 build.js（純 Node 內建模組，沒有 npm 相依）。
cd "$(dirname "$0")"
node build.js
