# セットアップ手順

## 前提条件

- Node.js 20 以上
- npm 10 以上
- AWS アカウント
- Cloudflare アカウント
- Google Cloud Platform アカウント（OAuth、Maps API 用）

## 1. リポジトリのクローンと依存関係のインストール

```bash
git clone <repository-url>
cd learn-auth-nextjs-aws
npm install
```

## 2. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成します。

```bash
cp .env.example .env.local
```

`.env.local` に以下の値を設定してください。各サービスの設定方法は参照先ドキュメントを確認してください。

### AWS Cognito（認証）

| 変数名 | 説明 | 参照 |
|--------|------|------|
| `NEXT_PUBLIC_USER_POOL_ID` | Cognito ユーザープール ID | [AWS 設定ガイド](./aws/AWS_SETUP_GUIDE.md) |
| `NEXT_PUBLIC_USER_POOL_CLIENT_ID` | Cognito アプリクライアント ID | 同上 |
| `NEXT_PUBLIC_IDENTITY_POOL_ID` | Cognito ID プール ID | 同上 |
| `NEXT_PUBLIC_COGNITO_DOMAIN` | Cognito Hosted UI ドメイン | 同上 |
| `NEXT_PUBLIC_OAUTH_REDIRECT_SIGNIN` | OAuth サインインリダイレクト URI | 同上 |
| `NEXT_PUBLIC_OAUTH_REDIRECT_SIGNOUT` | OAuth サインアウトリダイレクト URI | 同上 |
| `AWS_REGION` | AWS リージョン（例: `ap-northeast-1`） | - |

### Google OAuth

| 変数名 | 説明 | 参照 |
|--------|------|------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth クライアント ID | [Google OAuth 設定ガイド](./security/GOOGLE_OAUTH_SETUP.md) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット | 同上 |

### Cloudflare Workers API

| 変数名 | 説明 | 参照 |
|--------|------|------|
| `CLOUDFLARE_WORKERS_API_URL` | Workers API の URL | [Cloudflare D1 ガイド](./cloudflare/CLOUDFLARE_D1.md) |
| `CLOUDFLARE_WORKERS_API_TOKEN` | Workers API の認証トークン（`openssl rand -base64 32` で生成） | 同上 |

### Cloudflare アカウント

| 変数名 | 説明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID |

### Cloudflare D1（データベース）

| 変数名 | 説明 | 参照 |
|--------|------|------|
| `D1_DATABASE_ID` | D1 データベース ID | [Cloudflare D1 ガイド](./cloudflare/CLOUDFLARE_D1.md) |
| `D1_DATABASE_NAME` | D1 データベース名 | 同上 |

### Cloudflare R2（画像ストレージ）

| 変数名 | 説明 | 参照 |
|--------|------|------|
| `R2_PHOTO_BUCKET_NAME` | R2 バケット名 | [Cloudflare R2 ガイド](./cloudflare/CLOUDFLARE_R2.md) |
| `R2_ENDPOINT` | R2 エンドポイント | 同上 |
| `R2_ACCESS_KEY_ID` | R2 アクセスキー ID | 同上 |
| `R2_SECRET_ACCESS_KEY` | R2 シークレットアクセスキー | 同上 |

### Google Maps

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API キー（クライアント側） |
| `GOOGLE_MAPS_API_KEY` | Google Maps API キー（サーバー側） |

## 3. 外部サービスの設定

各サービスの詳細な設定手順は以下のドキュメントを参照してください。

### 必須

1. **AWS Cognito**: [docs/aws/AWS_SETUP_GUIDE.md](./aws/AWS_SETUP_GUIDE.md)
2. **Cloudflare D1**: [docs/cloudflare/CLOUDFLARE_D1.md](./cloudflare/CLOUDFLARE_D1.md)
3. **Cloudflare R2**: [docs/cloudflare/CLOUDFLARE_R2.md](./cloudflare/CLOUDFLARE_R2.md)

### 任意

4. **Google OAuth**: [docs/security/GOOGLE_OAUTH_SETUP.md](./security/GOOGLE_OAUTH_SETUP.md)
5. **MFA 設定**: [docs/aws/COGNITO_MFA_SETUP.md](./aws/COGNITO_MFA_SETUP.md)

## 4. インフラのプロビジョニング（Terraform）

### AWS インフラ

```bash
cd infra-aws
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars を編集して各値を設定
terraform init
terraform plan
terraform apply
```

### Cloudflare インフラ

```bash
cd infra-cloudflare/terraform
terraform init
terraform plan
terraform apply
```

## 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアクセスします。

## 6. 動作確認

1. ログインページ（`/login`）でユーザー認証を行う
2. ダッシュボード（`/dashboard`）であしあと一覧が表示されることを確認
3. 登録ページ（`/register`）で写真アップロードが動作することを確認

## Cloudflare Workers のローカル開発

Workers のローカル開発には Wrangler を使用します。

```bash
# memory-traces-api
cd infra-cloudflare/memory-traces-api
npm install
npx wrangler dev

# photo-upload-api
cd infra-cloudflare/photo-upload-api
npm install
npx wrangler dev
```

## Storybook

UI コンポーネントの開発・確認には Storybook を使用します。

```bash
npm run storybook
```

ブラウザで [http://localhost:6006](http://localhost:6006) を開いてアクセスします。

詳細は [docs/storybook/SETUP.md](./storybook/SETUP.md) を参照してください。
