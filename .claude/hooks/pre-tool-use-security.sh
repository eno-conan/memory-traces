#!/bin/bash

# 標準入力からJSON入力を読み込み
INPUT=$(cat)

# nodeを使ってJSON解析（jqが不要）
TOOL_NAME=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).tool_name||''))")
TOOL_INPUT_JSON=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.stringify(JSON.parse(d).tool_input||{})))")

# 1. Bashツール: Git/npm の危険な操作をブロック
if [ "$TOOL_NAME" = "Bash" ]; then
  COMMAND=$(echo "$TOOL_INPUT_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).command||''))")

  DANGEROUS_PATTERNS=(
    "git push --force"
    "git push -f "
    "git branch -D"
    "git branch -d main"
    "git branch -d master"
    "npm publish"
    "npm unpublish"
    "npx -y "
  )

  for pattern in "${DANGEROUS_PATTERNS[@]}"; do
    if echo "$COMMAND" | grep -q "$pattern"; then
      echo "🚨 [Security Hook] 危険なコマンドをブロックしました" >&2
      echo "   パターン: $pattern" >&2
      echo "   コマンド: $COMMAND" >&2
      echo "   実行したい場合はユーザーに手動実行を依頼してください" >&2
      exit 2
    fi
  done
fi

# 2. Write/Editツール: 保護対象ファイルへの直接編集をブロック
if [[ "$TOOL_NAME" =~ ^(Write|Edit)$ ]]; then
  FILE_PATH=$(echo "$TOOL_INPUT_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).file_path||''))")

  PROTECTED_PATTERNS=(
    "package-lock.json"
    "pnpm-lock.yaml"
    ".husky/"
    "next.config"
  )

  for pattern in "${PROTECTED_PATTERNS[@]}"; do
    if echo "$FILE_PATH" | grep -q "$pattern"; then
      echo "🚨 [Security Hook] 保護対象ファイルへの編集をブロックしました" >&2
      echo "   ファイル: $FILE_PATH" >&2
      echo "   保護パターン: $pattern" >&2
      echo "   このファイルを変更するにはユーザーによる手動操作が必要です" >&2
      exit 2
    fi
  done
fi

# すべてのチェックをパス
exit 0
