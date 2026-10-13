#!/bin/zsh

set -u

script_dir="${0:A:h}"

pause_on_error() {
  echo
  read -r "?按回车键关闭此窗口…"
}

if ! cd "$script_dir"; then
  echo "无法进入博客项目目录：$script_dir"
  pause_on_error
  exit 1
fi

# Finder 双击 .command 时可能拿不到用户的完整 PATH。
# 补上 Apple Silicon / Intel Homebrew 和 pnpm 的常见安装位置。
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/Library/pnpm:$HOME/.local/share/pnpm:$HOME/.local/bin:$PATH"

if (( $+commands[pnpm] )); then
  pnpm_command=(pnpm)
elif (( $+commands[corepack] )); then
  pnpm_command=(corepack pnpm)
else
  echo "没有找到 pnpm。请先安装 Node.js 和 pnpm，再重新双击此脚本。"
  pause_on_error
  exit 1
fi

dependencies_changed=false
if [[ ! -f node_modules/.pnpm/lock.yaml ]]; then
  dependencies_changed=true
elif ! cmp -s pnpm-lock.yaml node_modules/.pnpm/lock.yaml; then
  dependencies_changed=true
fi

if [[ "$dependencies_changed" == true ]]; then
  echo "检测到项目依赖尚未安装或已更新，正在自动补齐…"
  if ! "${pnpm_command[@]}" install --frozen-lockfile --prefer-offline; then
    echo "项目依赖安装失败，请检查网络或 pnpm 配置后重试。"
    pause_on_error
    exit 1
  fi
fi

echo
echo "正在启动鲸落博客工作台…"
echo "工作台会自动在浏览器中打开，关闭此窗口即可停止。"
echo

if (( $# > 0 )); then
  "${pnpm_command[@]}" studio -- "$@"
else
  "${pnpm_command[@]}" studio
fi
studio_exit=$?

if (( studio_exit != 0 )); then
  echo "博客工作台因错误停止（退出码：$studio_exit）。"
  pause_on_error
fi

exit "$studio_exit"
