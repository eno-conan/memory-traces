# Cognito ユーザー権限確認ガイド

このガイドでは、AWS CLIを使ってCognitoユーザーのLambda実行権限を確認する方法を説明します。

## 前提条件

- AWS CLIがインストールされていること
- 適切なAWS認証情報が設定されていること
- User Pool ID: `ap-northeast-1_UbEzVT7GS`
- Region: `ap-northeast-1`
- Lambda実行グループ: `lambda-executors`

## 基本情報

### 権限の仕組み
- **権限あり**: `lambda-executors` グループに所属しているユーザー
- **権限なし**: グループに所属していないユーザー

デフォルトでは、`userC@example.com` のみが `lambda-executors` グループに所属しています。

## AWS CLI コマンド集

### 1. 全ユーザーの一覧を確認

```bash
aws cognito-idp list-users \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --region ap-northeast-1
```

### 2. 特定ユーザーのグループ所属を確認

#### userA@example.comの場合
```bash
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --username userA@example.com \
  --region ap-northeast-1
```

#### userB@example.comの場合
```bash
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --username userB@example.com \
  --region ap-northeast-1
```

#### userC@example.comの場合
```bash
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --username userC@example.com \
  --region ap-northeast-1
```

### 3. lambda-executorsグループのメンバー一覧を確認

```bash
aws cognito-idp list-users-in-group \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --group-name lambda-executors \
  --region ap-northeast-1
```

### 4. 全ユーザーのグループ所属を一括確認（便利スクリプト）

```bash
# すべてのユーザーのグループ所属を確認
for email in userA@example.com userB@example.com userC@example.com; do
  echo "=== $email のグループ ==="
  aws cognito-idp admin-list-groups-for-user \
    --user-pool-id ap-northeast-1_UbEzVT7GS \
    --username $email \
    --region ap-northeast-1 \
    --query 'Groups[].GroupName' \
    --output text
  echo ""
done
```

## ユーザー管理コマンド

### グループにユーザーを追加

```bash
# 例: userAをlambda-executorsグループに追加
aws cognito-idp admin-add-user-to-group \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --username userA@example.com \
  --group-name lambda-executors \
  --region ap-northeast-1
```

### グループからユーザーを削除

```bash
# 例: userCをlambda-executorsグループから削除
aws cognito-idp admin-remove-user-from-group \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --username userC@example.com \
  --group-name lambda-executors \
  --region ap-northeast-1
```

### 全グループの一覧を確認

```bash
aws cognito-idp list-groups \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --region ap-northeast-1
```

## トラブルシューティング

### ユーザーが見つからない場合

ユーザーが正しく作成されているか確認：

```bash
aws cognito-idp admin-get-user \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --username userA@example.com \
  --region ap-northeast-1
```

### グループが見つからない場合

グループが正しく作成されているか確認：

```bash
aws cognito-idp get-group \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --group-name lambda-executors \
  --region ap-northeast-1
```

## Terraform コード上での確認箇所

実行権限は以下のTerraformファイルで定義されています：

### 1. Lambda実行権限ポリシー
- ファイル: `infra/modules/identity_pool/main.tf:74-91`
- リソース: `aws_iam_role_policy.cognito_authenticated_lambda`
- Action: `lambda:InvokeFunction`

### 2. IAMロール定義
- ファイル: `infra/modules/identity_pool/main.tf:48-72`
- デフォルトロール（権限なし）: `cognito_authenticated_default`
- Lambda実行ロール（権限あり）: `cognito_authenticated_lambda_executor`

### 3. ロールマッピング
- ファイル: `infra/modules/identity_pool/main.tf:102-116`
- 条件: `cognito:groups` に `lambda-executors` が含まれる

### 4. ユーザーグループ定義
- ファイル: `infra/modules/cognito/main.tf:143-149`
- グループ名: `lambda-executors`

## 参考情報

### テストユーザー（デフォルト設定）
- `userA@example.com` - 権限なし
- `userB@example.com` - 権限なし
- `userC@example.com` - 権限あり（lambda-executorsグループに所属）

### パスワード
すべてのテストユーザーのデフォルトパスワード: `TempPass123!`
