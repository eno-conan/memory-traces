#!/bin/bash

# Vercel環境変数から前回のコミットSHAを取得
# 初回デプロイの場合は常にビルド実行
if [ -z "$VERCEL_GIT_PREVIOUS_SHA" ]; then
  echo "✓ 初回デプロイまたは前回のコミットSHAが不明 → ビルド実行"
  exit 1
fi

# 変更されたファイルのリストを取得
CHANGED_FILES=$(git diff --name-only $VERCEL_GIT_PREVIOUS_SHA $VERCEL_GIT_COMMIT_SHA)

# デバッグ用: 変更されたファイルを表示
echo "変更されたファイル:"
echo "$CHANGED_FILES"
echo ""

# 除外パターン（これらのみの変更の場合はデプロイスキップ）
IGNORED_PATTERNS=(
  "^README\.md$"
  "^.*README\.md$"
  "^docs/"
  "\.md$"
  "^\.github/.*\.md$"
  "^infra-aws/README\.md$"
  "^infra-cloudflare/README\.md$"
)

# すべての変更ファイルをチェック
while IFS= read -r file; do
  # 空行をスキップ
  if [ -z "$file" ]; then
    continue
  fi

  SHOULD_IGNORE=false

  for pattern in "${IGNORED_PATTERNS[@]}"; do
    if echo "$file" | grep -qE "$pattern"; then
      SHOULD_IGNORE=true
      echo "  - $file (ドキュメント: スキップ対象)"
      break
    fi
  done

  if [ "$SHOULD_IGNORE" = false ]; then
    echo "✓ 変更検出: $file → ビルド実行"
    exit 1
  fi
done <<< "$CHANGED_FILES"

# すべての変更がドキュメントのみ
echo ""
echo "✗ ドキュメントのみの変更 → ビルドスキップ"
exit 0
