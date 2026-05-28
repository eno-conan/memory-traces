# デプロイ手順

## 概要

本アプリケーションは以下の 3 つのサービスにデプロイします。

| サービス | 対象 | デプロイ方法 |
|---------|------|-------------|
| Vercel | Next.js アプリケーション | Vercel CLI / GitHub 連携 |
| Cloudflare Workers | バックエンド API | Wrangler CLI |
| AWS / Cloudflare | インフラ（Cognito, D1, R2） | Terraform |

## 1. Vercel へのデプロイ（Next.js）

### 方法 A: GitHub 連携（推奨）

1. [Vercel ダッシュボード](https://vercel.com/dashboard) で GitHub リポジトリをインポート
2. **Settings > Environment Variables** で環境変数を設定
   - `.env.example` に記載されているすべての変数を設定
   - 環境（Production / Preview / Development）ごとに適切な値を設定
3. `main` ブランチへのプッシュで自動デプロイ

### 方法 B: Vercel CLI

```bash
# Vercel CLI のインストール
npm i -g vercel

# ログイン
vercel login

# 環境変数の設定（.env.production を事前に作成）
./scripts/deploy-env.sh production  # Linux/Mac
# または
.\scripts\deploy-env.ps1 production  # Windows

# デプロイ
vercel --prod
```

### 環境変数の設定

本番環境では、OAuth リダイレクト URI を Vercel の URL に変更する必要があります。

```
NEXT_PUBLIC_OAUTH_REDIRECT_SIGNIN=https://your-app.vercel.app/login
NEXT_PUBLIC_OAUTH_REDIRECT_SIGNOUT=https://your-app.vercel.app/login
```

詳細は [docs/vercel/VERCEL_401_FIX_STEPS.md](./vercel/VERCEL_401_FIX_STEPS.md) を参照してください。

## 2. Cloudflare Workers のデプロイ

### memory-traces-api

```bash
cd infra-cloudflare/memory-traces-api
npx wrangler deploy
```

### photo-upload-api

```bash
cd infra-cloudflare/photo-upload-api
npx wrangler deploy
```

### Workers の環境変数（Secrets）

```bash
# API_KEY の設定（Workers 側の認証トークン）
cd infra-cloudflare/memory-traces-api
npx wrangler secret put API_KEY

cd infra-cloudflare/photo-upload-api
npx wrangler secret put API_KEY
```

## 3. AWS インフラの更新（Terraform）

```bash
cd infra-aws
terraform plan    # 変更内容を確認
terraform apply   # 適用
```

### Cognito の本番設定

本番環境では `callback_urls` と `logout_urls` に Vercel URL を追加する必要があります。

詳細は [docs/vercel/VERCEL_401_FIX_STEPS.md](./vercel/VERCEL_401_FIX_STEPS.md) を参照してください。

## 4. Cloudflare インフラの更新（Terraform）

```bash
cd infra-cloudflare/terraform
terraform plan
terraform apply
```

## 本番環境のセキュリティ設定（推奨）

- **MFA の有効化**: [docs/aws/COGNITO_MFA_SETUP.md](./aws/COGNITO_MFA_SETUP.md) を参照
- **Amazon SES でのメール送信設定**: Cognito のメール送信を SES 経由に変更
- **Cognito グループによる権限管理**: [docs/aws/COGNITO_USER_PERMISSIONS.md](./aws/COGNITO_USER_PERMISSIONS.md) を参照
- **AWS Secrets Manager での機密情報管理**: 環境変数の一元管理
- **Vercel 専用の IAM ユーザー作成**: 最小権限の原則に従う
- **セキュリティベストプラクティス**: [docs/security/security-best-practices.md](./security/security-best-practices.md) を参照

## CI/CD パイプライン

### 品質チェック（デプロイ前に実行推奨）

```bash
npm run verify  # type-check + lint + test + build
```

### デプロイフロー

```
コード変更 → git push → GitHub Actions（lint, type-check, test）
                          ↓（main ブランチの場合）
                       Vercel 自動デプロイ
```

> Cloudflare Workers のデプロイは手動で行います（`npx wrangler deploy`）。
