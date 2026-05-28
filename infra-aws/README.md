# Terraform Infrastructure

このディレクトリには、AWS Cognito認証とLambda連携のためのTerraformコードが含まれています。

## ディレクトリ構成

```
infra/
├── modules/
│   ├── cognito/           # Cognito User Pool、User Pool Client、テストユーザー
│   ├── identity_pool/     # Cognito Identity Pool、認証済みIAMロール
│   ├── lambda/            # Lambda関数、実行ロール
│   └── api_gateway/       # API Gateway、Cognito Authorizer、レート制限
├── provider.tf            # AWSプロバイダー設定
├── variables.tf           # 変数定義
├── main.tf                # モジュール呼び出し
├── outputs.tf             # 出力値
├── terraform.tfvars.example  # 変数のサンプル
└── .gitignore             # Terraform用.gitignore
```

## 前提条件

- Terraform 1.0以上がインストールされていること
- AWS CLIが設定されていること
- AWSアカウントへのアクセス権限があること

## 初期設定

### 1. 変数ファイルの作成

```bash
cd infra-aws
cp terraform.tfvars.example terraform.tfvars
```

必要に応じて `terraform.tfvars` を編集してください。

### 2. Terraformの初期化

```bash
terraform init
```

## 使用方法

### 全リソースの作成

```bash
# 実行計画の確認
terraform plan

# リソースの作成
terraform apply
```

### 特定のモジュールのみ作成・更新

モジュール化のメリット: 特定のリソースだけを対象にできます。

#### Lambdaだけを作成・更新

```bash
terraform plan -target=module.lambda
terraform apply -target=module.lambda
```

#### Cognitoだけを作成・更新

```bash
terraform plan -target=module.cognito
terraform apply -target=module.cognito
```

#### Identity Poolだけを作成・更新

```bash
terraform plan -target=module.identity_pool
terraform apply -target=module.identity_pool
```

### 環境変数の取得

作成後、以下のコマンドで環境変数を取得できます。

```bash
# .env.localに必要な環境変数を出力
terraform output -raw env_variables

# または個別に取得
terraform output user_pool_id
terraform output user_pool_client_id
terraform output identity_pool_id
terraform output lambda_function_name
terraform output api_gateway_invoke_url
```

### テストユーザー情報の確認

```bash
terraform output test_users
```

## モジュール構成

### cognito モジュール

Cognito User Pool、User Pool Client、テストユーザーを管理します。

**リソース:**
- `aws_cognito_user_pool`
- `aws_cognito_user_pool_client`
- `aws_cognito_user` (userA, userB, userC)

**主要な変数:**
- `user_pool_name`: User Pool名
- `user_pool_client_name`: User Pool Client名
- `test_users`: テストユーザーのマップ

### identity_pool モジュール

Cognito Identity Pool、認証済みユーザー用のIAMロールを管理します。

**リソース:**
- `aws_cognito_identity_pool`
- `aws_iam_role` (認証済みユーザー用)
- `aws_iam_role_policy` (Lambda実行権限)
- `aws_cognito_identity_pool_roles_attachment`

**主要な変数:**
- `identity_pool_name`: Identity Pool名
- `user_pool_id`: User Pool ID（cognitoモジュールから取得）
- `lambda_function_arn`: Lambda関数ARN（lambdaモジュールから取得）

### lambda モジュール

Lambda関数と実行ロールを管理します。

**リソース:**
- `aws_lambda_function`
- `aws_iam_role` (Lambda実行用)
- `aws_cloudwatch_log_group`

**主要な変数:**
- `function_name`: Lambda関数名
- `runtime`: ランタイムバージョン（デフォルト: nodejs20.x）
- `timeout`: タイムアウト（デフォルト: 30秒）
- `memory_size`: メモリサイズ（デフォルト: 128MB）

### api_gateway モジュール

API Gateway REST API、Cognito Authorizer、レート制限を管理します。

**リソース:**
- `aws_api_gateway_rest_api`
- `aws_api_gateway_authorizer` (Cognito User Pools認証)
- `aws_api_gateway_resource` (/invokeエンドポイント)
- `aws_api_gateway_method` (POST、OPTIONS)
- `aws_api_gateway_integration` (Lambda統合)
- `aws_api_gateway_deployment`
- `aws_api_gateway_stage`
- `aws_cloudwatch_log_group` (APIアクセスログ)

**主要な変数:**
- `api_name`: API Gateway名
- `stage_name`: ステージ名（デフォルト: prod）
- `throttling_burst_limit`: バースト制限（デフォルト: 5,000）
- `throttling_rate_limit`: レート制限（デフォルト: 10,000 req/sec）

**セキュリティ機能:**
- ✅ **Cognito Authorizer**: 自動的にIDトークンを検証
- ✅ **レート制限**: DDoS攻撃を防止
- ✅ **CloudWatch Logs**: 詳細なアクセスログ記録
- ✅ **X-Ray Tracing**: リクエストトレーシング
- ✅ **CORS対応**: クロスオリジンリクエストのサポート

## リソースの削除

### 特定のモジュールのみ削除

```bash
# Lambdaモジュールのみ削除
terraform destroy -target=module.lambda

# Cognitoモジュールのみ削除
terraform destroy -target=module.cognito
```

### 全リソースの削除

```bash
terraform destroy
```

## 注意事項

- `terraform.tfvars` はGit管理対象外です（機密情報を含むため）
- テストユーザーのパスワード設定には AWS CLI が必要です
- リソース間に依存関係があるため、削除時は依存順序に注意してください

## ユーザー権限管理

### Lambda実行権限の仕組み

このインフラは **Cognito User Poolグループ** を使用して、ユーザーごとにLambda実行権限を制御します。

**権限の仕組み:**
- **デフォルト**: すべての認証済みユーザーはLambda実行権限を**持ちません**
- **lambda-executorsグループ**: このグループに所属するユーザーのみがLambda関数を実行できます
- **IAMロールの自動切り替え**: ユーザーがグループに所属すると、Identity Poolが自動的にLambda実行権限を持つIAMロールを割り当てます

### ユーザーをlambda-executorsグループに追加

ユーザーにLambda実行権限を付与する場合：

```bash
# User Pool IDを取得
USER_POOL_ID=$(terraform output -raw user_pool_id)

# ユーザーをlambda-executorsグループに追加
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username "userA@example.com" \
  --group-name "lambda-executors"
```

### ユーザーをlambda-executorsグループから削除

ユーザーからLambda実行権限を削除する場合：

```bash
# User Pool IDを取得
USER_POOL_ID=$(terraform output -raw user_pool_id)

# ユーザーをlambda-executorsグループから削除
aws cognito-idp admin-remove-user-from-group \
  --user-pool-id $USER_POOL_ID \
  --username "userA@example.com" \
  --group-name "lambda-executors"
```

### グループメンバーの確認

lambda-executorsグループに所属しているユーザーを確認：

```bash
# User Pool IDを取得
USER_POOL_ID=$(terraform output -raw user_pool_id)

# グループ内のユーザーを一覧表示
aws cognito-idp list-users-in-group \
  --user-pool-id $USER_POOL_ID \
  --group-name "lambda-executors"
```

### 特定ユーザーの所属グループを確認

```bash
# User Pool IDを取得
USER_POOL_ID=$(terraform output -raw user_pool_id)

# ユーザーが所属しているグループを確認
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id $USER_POOL_ID \
  --username "userA@example.com"
```

### 権限の動作確認

1. **権限なしユーザー（デフォルト）の場合:**
   - Lambda関数の呼び出し: **403 Forbidden** エラー
   - IAMロール: `Cognito_<IdentityPoolName>_Auth_Default_Role`

2. **lambda-executorsグループ所属ユーザーの場合:**
   - Lambda関数の呼び出し: **成功**
   - IAMロール: `Cognito_<IdentityPoolName>_Lambda_Executor_Role`

## よくある操作

### Lambda関数のコードを更新

Lambda関数のコードは `modules/lambda/main.tf` の `data "archive_file" "lambda_zip"` ブロック内にあります。

コードを変更後:

```bash
terraform apply -target=module.lambda
```

### テストユーザーを追加

`terraform.tfvars` の `test_users` マップに新しいユーザーを追加:

```hcl
test_users = {
  userA = {
    email              = "userA@example.com"
    temporary_password = "TempPass123!"
  }
  userB = {
    email              = "userB@example.com"
    temporary_password = "TempPass123!"
  }
  userC = {
    email              = "userC@example.com"
    temporary_password = "TempPass123!"
  }
  userD = {
    email              = "userD@example.com"
    temporary_password = "TempPass123!"
  }
}
```

```bash
terraform apply -target=module.cognito
```

## トラブルシューティング

### AWS CLI認証エラー

```bash
aws configure
```

でAWS認証情報を設定してください。

### モジュール依存エラー

モジュール間に依存関係があるため、作成時は依存元から順に作成してください:

1. `module.cognito`
2. `module.lambda`
3. `module.identity_pool` (cognito と lambda に依存)

### 状態の確認

```bash
terraform state list
terraform show
```

## 参考リンク

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Cognito Terraform Resources](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cognito_user_pool)
- [AWS Lambda Terraform Resources](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function)
