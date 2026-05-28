#!/bin/bash

# 標準入力からJSON入力を読み込み
INPUT=$(cat)

# nodeを使ってファイルパスを取得（try/catchでパースエラーを安全に処理）
FILE_PATH=$(echo "$INPUT" | node -e "
let d='';
process.stdin.on('data', c => d += c);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(d);
    process.stdout.write((data.tool_input || {}).file_path || '');
  } catch (e) {
    process.stdout.write('');  // パースエラー時は空文字 → lintスキップ
  }
});
" 2>/dev/null)

# TypeScript/JavaScriptファイルのみlint実行
if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx|mjs)$ ]]; then
  echo "Running lint on $FILE_PATH..."

  # プロジェクトルートへ移動（cygpathでWindowsパス変換に対応）
  if [ -n "$CLAUDE_PROJECT_DIR" ]; then
    if command -v cygpath &>/dev/null 2>&1; then
      PROJECT_ROOT=$(cygpath -u "$CLAUDE_PROJECT_DIR" 2>/dev/null || echo "$CLAUDE_PROJECT_DIR")
    else
      PROJECT_ROOT="$CLAUDE_PROJECT_DIR"
    fi
    cd "$PROJECT_ROOT" 2>/dev/null || true
  fi

  # npm run lintを実行
  LINT_OUTPUT=$(npm run lint 2>&1)
  LINT_EXIT_CODE=$?

  if [ $LINT_EXIT_CODE -ne 0 ]; then
    # exit 2: Claudeにエラーをフィードバックして修正させる
    echo "🔍 [Lint Hook] Lintエラーを検出しました — 自動修正を試みます" >&2
    echo "   対象ファイル: $FILE_PATH" >&2
    echo "" >&2
    echo "$LINT_OUTPUT" >&2
    exit 2
  fi

  echo "Lint check passed!"
fi

exit 0
