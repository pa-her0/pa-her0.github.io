#!/bin/zsh
cd "$(dirname "$0")"
if ! command -v pnpm >/dev/null 2>&1; then
  echo "没有找到 pnpm，请先安装项目所需环境。"
  read -n 1 "?按任意键关闭…"
  exit 1
fi
pnpm studio
