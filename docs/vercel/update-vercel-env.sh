#!/bin/bash
# Vercel環境変数更新スクリプト

echo "Updating Vercel environment variables..."

# Production環境の環境変数を更新
vercel env rm NEXT_PUBLIC_USER_POOL_CLIENT_ID production
echo "xxxxxxxxxxxxxxxxxxxxxxxxxx" | vercel env add NEXT_PUBLIC_USER_POOL_CLIENT_ID production

# Preview環境の環境変数を更新
vercel env rm NEXT_PUBLIC_USER_POOL_CLIENT_ID preview
echo "xxxxxxxxxxxxxxxxxxxxxxxxxx" | vercel env add NEXT_PUBLIC_USER_POOL_CLIENT_ID preview

# Development環境の環境変数を更新
vercel env rm NEXT_PUBLIC_USER_POOL_CLIENT_ID development
echo "xxxxxxxxxxxxxxxxxxxxxxxxxx" | vercel env add NEXT_PUBLIC_USER_POOL_CLIENT_ID development

echo "✅ Environment variables updated!"
echo "Please trigger a new deployment to apply the changes."
