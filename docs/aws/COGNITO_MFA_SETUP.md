# 2段階認証（MFA）セットアップガイド

このガイドでは、Cognitoで2段階認証を有効化する手順を説明します。

## 概要

- **MFA設定**: OPTIONAL（ユーザーごとに有効/無効を選択可能）
- **MFA方式**: TOTP (Time-based One-Time Password) - 認証アプリを使用
- **対応認証アプリ**: Google Authenticator, Microsoft Authenticator, Authy など

## 前提条件

- Terraformで変更を適用済みであること
- User Pool ID: `ap-northeast-1_UbEzVT7GS`
- Region: `ap-northeast-1`

## 手順1: メールアドレスの設定

### Terraformファイルの更新

`infra/variables.tf` の `userMFA` のメールアドレスを実際のものに変更します:

```hcl
userMFA = {
  email              = "your-actual-email@example.com"  # 実際のメールアドレスに変更
  temporary_password = "TempPass123!"
}
```

### Terraform適用

```bash
cd infra-aws
terraform plan
terraform apply
```

## 手順2: アプリケーションでのMFAデバイス登録

**重要**: AWS CLIでMFAを有効化する前に、必ずアプリケーションでMFAデバイスを登録してください。

### Next.jsアプリケーションの起動

```bash
cd app
npm run dev
```

### MFAデバイスの登録

1. ブラウザで http://localhost:3000 にアクセス
2. MFA対応ユーザーでログイン（variables.tfで設定したメールアドレスと仮パスワード）
3. 初回ログイン時にQRコードが表示される
4. 認証アプリ（Google Authenticator等）でQRコードをスキャン
5. 認証アプリに表示される6桁のコードを入力
6. MFAデバイスの登録が完了

### 登録の確認

```bash
aws cognito-idp admin-get-user \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --username your-actual-email@example.com \
  --region ap-northeast-1
```

出力に `"MFAOptions"` セクションが表示されていれば、MFAデバイスが正常に登録されています。

## 手順3: MFAを優先認証方法に設定（オプション）

**注意**: この手順は通常不要です。アプリケーションでMFAデバイスを登録すると、自動的に優先認証方法として設定されます。

### オプションA: AWS コンソールから設定

1. AWS Cognito コンソールにアクセス
2. User Pool `learn-auth-user-pool` を選択
3. 「Users」タブから対象ユーザーを選択
4. 「MFA settings」セクションで設定を確認・変更

### オプションB: AWS CLI から設定

MFAを明示的に優先認証方法として設定:

```bash
aws cognito-idp admin-set-user-mfa-preference \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --username your-actual-email@example.com \
  --software-token-mfa-settings Enabled=true,PreferredMfa=true \
  --region ap-northeast-1
```

**このコマンドを実行する前に、必ず手順2でMFAデバイスを登録してください。**
登録前にこのコマンドを実行すると、以下のエラーが発生します：
```
InvalidParameterException: User does not have delivery config set to turn on SOFTWARE_TOKEN_MFA
```

## 手順4: Lambda実行権限の付与（必要な場合）

MFAユーザーにLambda実行権限を付与する場合:

```bash
# lambda-executorsグループに追加
aws cognito-idp admin-add-user-to-group \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --username your-actual-email@example.com \
  --group-name lambda-executors \
  --region ap-northeast-1
```

確認:

```bash
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --username your-actual-email@example.com \
  --region ap-northeast-1
```

## ユーザー管理

### 全ユーザーの一覧確認

```bash
aws cognito-idp list-users \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --region ap-northeast-1
```

### 特定ユーザーのMFA設定確認

```bash
aws cognito-idp admin-get-user \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --username your-actual-email@example.com \
  --region ap-northeast-1
```

### MFAの無効化（必要な場合）

```bash
aws cognito-idp admin-set-user-mfa-preference \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --username your-actual-email@example.com \
  --software-token-mfa-settings Enabled=false,PreferredMfa=false \
  --region ap-northeast-1
```

## ロールバック手順

MFAを完全に無効化する場合:

### 手順1: Terraformファイルを元に戻す

`infra/modules/cognito/main.tf` を以下のように変更:

```hcl
# MFA設定: なし
mfa_configuration = "OFF"
```

`software_token_mfa_configuration` ブロックを削除します。

### 手順2: Terraform適用

```bash
cd infra-aws
terraform plan
terraform apply
```

### 手順3: userMFAユーザーの削除（オプション）

`infra/variables.tf` から `userMFA` エントリを削除してから、再度 `terraform apply` を実行します。

または、AWS CLIで手動削除:

```bash
aws cognito-idp admin-delete-user \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --username your-actual-email@example.com \
  --region ap-northeast-1
```

## トラブルシューティング

### AWS CLIで "User does not have delivery config set" エラーが発生

**エラーメッセージ:**
```
InvalidParameterException: User does not have delivery config set to turn on SOFTWARE_TOKEN_MFA
```

**原因:**
`admin-set-user-mfa-preference` コマンドを実行する前に、ユーザーがMFAデバイス（TOTPアプリ）を登録していない。

**解決方法:**
1. まず、手順2に従ってアプリケーションでMFAデバイスを登録
2. デバイス登録完了後、必要に応じてAWS CLIコマンドを実行

**確認方法:**
```bash
aws cognito-idp admin-get-user \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --username your-actual-email@example.com \
  --region ap-northeast-1
```
出力に `"MFAOptions"` または `"UserMFASettingList"` が含まれていることを確認してください。

### QRコードが表示されない

- ブラウザのコンソールでエラーを確認
- Amplifyの設定が正しいか確認
- User Poolの設定でMFAが有効になっているか確認

### 認証コードが無効と表示される

- デバイスの時刻が正確か確認（TOTPは時刻同期が必要）
- 認証アプリで正しいアカウントを選択しているか確認
- コードの有効期限（30秒）が切れていないか確認

### MFA設定をリセットしたい

```bash
# ユーザーのMFAデバイスを削除
aws cognito-idp admin-forget-device \
  --user-pool-id ap-northeast-1_UbEzVT7GS \
  --username your-actual-email@example.com \
  --device-key <device-key> \
  --region ap-northeast-1
```

## セキュリティに関する注意事項

### CLAUDE.mdのインシデント記録を参照

このプロジェクトでは、`CLAUDE.md` にセキュリティインシデントと教訓が記録されています。
特に、**ユーザー切り替え時の状態残存問題**に注意してください。

### MFA使用時の追加の注意点

1. **バックアップコードの保管**: 認証アプリにアクセスできなくなった場合に備える
2. **複数デバイスの登録**: 可能であれば複数の認証デバイスを設定
3. **ログアウト時の状態クリア**: MFA認証後のデータも適切にクリアされることを確認

## 参考資料

- [AWS Cognito MFA Documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-mfa.html)
- [AWS Amplify MFA Documentation](https://docs.amplify.aws/javascript/build-a-backend/auth/enable-mfa/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)
