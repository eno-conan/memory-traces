# Vercel環境での401エラー修正手順

## 問題の概要

Vercel環境でGoogle OAuth認証時に401エラーが発生しています。これは、OAuth リダイレクトURIがデフォルト値（localhost）のままになっているためです。

## 修正手順

### ステップ1: Vercel URLの確認

まず、あなたのVercelデプロイURLを確認します。

#### 方法1: Vercelダッシュボード

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. **Deployments** タブを開く
4. 最新のProductionデプロイメントのURLをコピー（例: `https://your-app.vercel.app`）

#### 方法2: Vercel CLI（インストールされている場合）

```bash
# Vercel CLIでプロジェクト情報を表示
vercel ls

# 出力例:
# Age  Deployment                         Status  Duration  URL
# 1h   learn-auth-nextjs-aws-xxx.vercel.app  Ready   45s      https://your-app.vercel.app
```

**重要**: URLは `https://` から始まる完全なURLです（例: `https://your-app.vercel.app`）

---

### ステップ2: Terraform設定の更新

`infra-aws/terraform.tfvars` ファイルを編集し、Vercel URLを追加します。

#### 2.1 ファイルを開く

```bash
# お好みのエディタで開く
code infra-aws/terraform.tfvars
# または
notepad infra-aws/terraform.tfvars
```

#### 2.2 callback_urlsとlogout_urlsを更新

**変更前**:
```hcl
# OAuth URLs
callback_urls = ["http://localhost:3000/login"]
logout_urls   = ["http://localhost:3000/login"]
```

**変更後**（`https://your-app.vercel.app` を実際のVercel URLに置き換えてください）:
```hcl
# OAuth URLs
callback_urls = [
  "http://localhost:3000/login",
  "https://your-app.vercel.app/login"
]
logout_urls = [
  "http://localhost:3000/login",
  "https://your-app.vercel.app/login"
]
```

#### 2.3 Terraformを適用

```bash
cd infra-aws

# 変更内容を確認
terraform plan

# 確認後、適用
terraform apply
```

適用後、AWS Cognitoの設定が更新され、Vercel URLからのOAuthリダイレクトが許可されます。

---

### ステップ3: Vercel環境変数の設定

#### 3.1 必要な環境変数

以下の環境変数をVercelに設定します:

| 環境変数 | 値の例 |
|---------|-------|
| `NEXT_PUBLIC_COGNITO_DOMAIN` | `learn-auth-1769549572.auth.ap-northeast-1.amazoncognito.com` |
| `NEXT_PUBLIC_OAUTH_REDIRECT_SIGNIN` | `https://your-app.vercel.app/login` |
| `NEXT_PUBLIC_OAUTH_REDIRECT_SIGNOUT` | `https://your-app.vercel.app/login` |

**注意**: `NEXT_PUBLIC_COGNITO_DOMAIN` の値は `terraform.tfvars` の `cognito_domain_prefix` から取得できます。
- 形式: `{cognito_domain_prefix}.auth.{region}.amazoncognito.com`
- 例: `learn-auth-1769549572.auth.ap-northeast-1.amazoncognito.com`

#### 3.2 Vercelダッシュボードでの設定

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. **Settings** > **Environment Variables** に移動
4. 以下の環境変数を追加:

**NEXT_PUBLIC_COGNITO_DOMAIN**:
- **Key**: `NEXT_PUBLIC_COGNITO_DOMAIN`
- **Value**: `learn-auth-1769549572.auth.ap-northeast-1.amazoncognito.com`
- **Environment**: **Production** と **Preview** にチェック

**NEXT_PUBLIC_OAUTH_REDIRECT_SIGNIN**:
- **Key**: `NEXT_PUBLIC_OAUTH_REDIRECT_SIGNIN`
- **Value**: `https://your-app.vercel.app/login` （実際のVercel URLに置き換え）
- **Environment**: **Production** と **Preview** にチェック

**NEXT_PUBLIC_OAUTH_REDIRECT_SIGNOUT**:
- **Key**: `NEXT_PUBLIC_OAUTH_REDIRECT_SIGNOUT`
- **Value**: `https://your-app.vercel.app/login` （実際のVercel URLに置き換え）
- **Environment**: **Production** と **Preview** にチェック

#### 3.3 Vercel CLIでの設定（推奨）

Vercel CLIがインストールされている場合:

```bash
# Production環境に設定
vercel env add NEXT_PUBLIC_COGNITO_DOMAIN production
# 入力: learn-auth-1769549572.auth.ap-northeast-1.amazoncognito.com

vercel env add NEXT_PUBLIC_OAUTH_REDIRECT_SIGNIN production
# 入力: https://your-app.vercel.app/login

vercel env add NEXT_PUBLIC_OAUTH_REDIRECT_SIGNOUT production
# 入力: https://your-app.vercel.app/login

# Preview環境にも同様に設定
vercel env add NEXT_PUBLIC_COGNITO_DOMAIN preview
vercel env add NEXT_PUBLIC_OAUTH_REDIRECT_SIGNIN preview
vercel env add NEXT_PUBLIC_OAUTH_REDIRECT_SIGNOUT preview
```

Vercel CLIがインストールされていない場合:

```bash
# インストール
npm i -g vercel

# ログイン
vercel login
```

---

### ステップ4: Vercelの再デプロイ

環境変数を設定した後、必ず再デプロイが必要です。

#### 方法1: Vercel CLI

```bash
vercel --prod --force
```

#### 方法2: Vercelダッシュボード

1. **Deployments** タブを開く
2. 最新のデプロイメントを選択
3. 右上の **"..."** メニューをクリック
4. **Redeploy** を選択
5. **Redeploy** ボタンをクリック

---

### ステップ5: Google Cloud Consoleの設定確認

#### 5.1 Google Cloud Consoleにアクセス

1. [Google Cloud Console](https://console.cloud.google.com/) にログイン
2. プロジェクトを選択
3. **APIs & Services** > **Credentials** に移動

#### 5.2 OAuth 2.0クライアントIDの確認

1. OAuth 2.0クライアントID `358279768337-55ctp18q8bo2hv73uqfpdsgkd13g25rh.apps.googleusercontent.com` を選択
2. **承認済みのリダイレクトURI** セクションを確認
3. 以下のURIが登録されているか確認:

**必要なURI**:
- `https://your-app.vercel.app/login` （実際のVercel URLに置き換え）
- `https://learn-auth-1769549572.auth.ap-northeast-1.amazoncognito.com/oauth2/idpresponse`

#### 5.3 URIを追加（未登録の場合）

1. **URIを追加** ボタンをクリック
2. Vercel URL: `https://your-app.vercel.app/login` を入力
3. Cognito OAuth エンドポイント: `https://learn-auth-1769549572.auth.ap-northeast-1.amazoncognito.com/oauth2/idpresponse` を入力
4. **保存** をクリック

---

### ステップ6: 動作確認

#### 6.1 Vercel環境でのテスト

1. ブラウザで `https://your-app.vercel.app/login` にアクセス
2. 「Googleでログイン」ボタンをクリック
3. **期待される動作**:
   - Googleアカウント選択画面が表示される
   - アカウントを選択
   - `https://your-app.vercel.app/login` にリダイレクト
   - その後、自動的に `/register` に遷移

#### 6.2 エラーログの確認

Vercelダッシュボードでログを確認:

1. **Deployments** > 最新デプロイを選択
2. **Functions** タブでログを確認
3. 401エラーが表示されないことを確認

#### 6.3 ブラウザDevToolsでの確認

1. ブラウザのDevToolsを開く（F12）
2. **Network** タブを選択
3. 「Googleでログイン」をクリック
4. リダイレクトフローを確認（すべて200または302レスポンス）

---

## トラブルシューティング

### 問題1: "redirect_uri_mismatch" エラー

**原因**: Google Cloud ConsoleまたはCognitoでリダイレクトURIが未登録

**対処法**:
1. Google Cloud Consoleの承認済みリダイレクトURIを確認
2. Cognitoの Allowed callback URLs を確認（ステップ2で設定済み）
3. URIが完全に一致しているか確認（末尾のスラッシュなど）

### 問題2: 401エラーが継続する

**原因**: 環境変数が未設定、または再デプロイが未実行

**対処法**:
1. Vercel環境変数を再確認
2. `vercel --prod --force` で強制的に再デプロイ

### 問題3: 環境変数が反映されない

**原因**: 環境変数設定後に再デプロイが未実行

**対処法**:
1. Vercel環境変数を確認（タイポがないか）
2. 環境（Production/Preview）が正しく選択されているか確認
3. 再デプロイを実行

---

## チェックリスト

すべての手順が完了したか確認してください:

- [ ] Vercel URLを確認した
- [ ] `infra-aws/terraform.tfvars` にVercel URLを追加した
- [ ] `terraform apply` を実行した
- [ ] Vercelに `NEXT_PUBLIC_COGNITO_DOMAIN` を設定した
- [ ] Vercelに `NEXT_PUBLIC_OAUTH_REDIRECT_SIGNIN` を設定した
- [ ] Vercelに `NEXT_PUBLIC_OAUTH_REDIRECT_SIGNOUT` を設定した
- [ ] Vercelを再デプロイした
- [ ] Google Cloud Consoleで承認済みリダイレクトURIを確認した
- [ ] 必要に応じてGoogle Cloud ConsoleにURIを追加した
- [ ] Vercel環境で動作確認した
- [ ] 401エラーが解消されたことを確認した

---

## 参考ドキュメント

- [VERCEL_OAUTH_SETUP.md](./VERCEL_OAUTH_SETUP.md) - 詳細な設定ガイド
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Vercelデプロイ手順

## 質問がある場合

問題が解決しない場合は、以下の情報を提供してください:

1. Vercel URL
2. Vercel環境変数のスクリーンショット（Settings > Environment Variables）
3. Vercelデプロイログ（エラー部分）
4. ブラウザDevToolsのNetworkタブのスクリーンショット（認証フロー）
