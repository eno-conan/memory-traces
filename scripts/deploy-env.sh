#!/bin/bash

# Vercel 環境変数一括設定スクリプト
# Usage: ./scripts/deploy-env.sh [production|preview|development]

set -e

ENV_FILE=".env.production"
TARGET_ENV="${1:-production}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found"
  echo "Please create .env.production with your environment variables"
  exit 1
fi

echo "Setting environment variables to Vercel ($TARGET_ENV environment)..."
echo ""

# 環境変数のカウンター
count=0

while IFS='=' read -r key value; do
  # コメント行と空行をスキップ
  if [[ $key =~ ^#.*$ ]] || [[ -z $key ]]; then
    continue
  fi

  # 前後の空白を削除
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)

  # クォートを削除
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

  echo "[$((++count))] Setting $key..."
  echo "$value" | vercel env add "$key" "$TARGET_ENV" 2>/dev/null || echo "  (already exists, skipping)"

done < "$ENV_FILE"

echo ""
echo "Done! Set $count environment variables to $TARGET_ENV environment."
echo ""
echo "To deploy, run:"
echo "  vercel --prod    # for production"
echo "  vercel           # for preview"
