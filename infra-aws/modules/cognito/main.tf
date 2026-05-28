# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = var.user_pool_name

  # サインインオプション: Eメール
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # パスワードポリシー
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  # MFA設定: オプション（ユーザーごとに有効/無効を選択可能）
  mfa_configuration = "OPTIONAL"

  # MFA方式: TOTPとSMSの両方をサポート
  software_token_mfa_configuration {
    enabled = true
  }

  # アカウント復旧設定: Eメールのみ
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # セルフサービスのサインアップを有効化
  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  # 必須の属性: email
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Eメール設定: Cognitoを使用してEメールを送信
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Eメール検証メッセージのカスタマイズ
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Your verification code"
    email_message        = "Your verification code is {####}"
  }

  tags = merge(
    var.tags,
    {
      Name = var.user_pool_name
    }
  )
}

# Cognito User Pool Client (SPA)
resource "aws_cognito_user_pool_client" "main" {
  name         = var.user_pool_client_name
  user_pool_id = aws_cognito_user_pool.main.id

  # クライアントシークレットを生成しない（SPAの場合）
  generate_secret = false

  # 認証フロー - OAuthフローを追加
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  # OAuth設定を有効化
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  allowed_oauth_flows_user_pool_client = true

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  # Cognitoとgoogleの両方をサポート
  supported_identity_providers = concat(
    ["COGNITO"],
    length(var.google_client_id) > 0 ? [aws_cognito_identity_provider.google[0].provider_name] : []
  )

  # トークンの有効期限設定
  refresh_token_validity = 30
  access_token_validity  = 60
  id_token_validity      = 60

  token_validity_units {
    refresh_token = "days"
    access_token  = "minutes"
    id_token      = "minutes"
  }

  # 読み取り/書き込み属性
  read_attributes  = ["email", "email_verified"]
  write_attributes = ["email"]

  prevent_user_existence_errors = "ENABLED"

  depends_on = [
    aws_cognito_identity_provider.google
  ]
}

# テストユーザーの作成
resource "aws_cognito_user" "test_users" {
  for_each = var.test_users

  user_pool_id = aws_cognito_user_pool.main.id
  username     = each.value.email  # username_attributes = ["email"]の場合、usernameにメールアドレスを指定

  attributes = {
    email          = each.value.email
    email_verified = "true"
  }

  temporary_password = each.value.temporary_password

  # 初回サインイン時にパスワードをリセット不要
  message_action = "SUPPRESS"
}

# ユーザーのパスワードを永続的に設定（AdminSetUserPasswordで確認済み状態に）
resource "null_resource" "set_user_password" {
  for_each = var.test_users

  # ユーザー作成後に実行
  depends_on = [aws_cognito_user.test_users]

  # AWS CLIでパスワードを永続的に設定
  provisioner "local-exec" {
    command = "aws cognito-idp admin-set-user-password --user-pool-id ${aws_cognito_user_pool.main.id} --username ${each.value.email} --password ${each.value.temporary_password} --permanent --region ${var.aws_region}"
  }

  triggers = {
    user_pool_id = aws_cognito_user_pool.main.id
    username     = each.value.email
    password     = each.value.temporary_password
  }
}

# Google Identity Provider
resource "aws_cognito_identity_provider" "google" {
  count = length(var.google_client_id) > 0 ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    authorize_scopes = "profile email openid"
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
  }
}

# Cognito Domain for OAuth
resource "aws_cognito_user_pool_domain" "main" {
  count = length(var.cognito_domain_prefix) > 0 ? 1 : 0

  domain       = var.cognito_domain_prefix
  user_pool_id = aws_cognito_user_pool.main.id
}
