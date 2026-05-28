# Cognito Identity Pool
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = var.identity_pool_name
  allow_unauthenticated_identities = false
  allow_classic_flow               = true

  # Cognito User Poolを認証プロバイダーとして設定
  cognito_identity_providers {
    client_id               = var.user_pool_client_id
    provider_name           = var.user_pool_endpoint
    server_side_token_check = false
  }

  tags = merge(
    var.tags,
    {
      Name = var.identity_pool_name
    }
  )
}

# Identity PoolのロールアタッチメントData
data "aws_iam_policy_document" "cognito_identity_pool_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = ["cognito-identity.amazonaws.com"]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "cognito-identity.amazonaws.com:aud"
      values   = [aws_cognito_identity_pool.main.id]
    }

    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.amazonaws.com:amr"
      values   = ["authenticated"]
    }
  }
}

# デフォルトの認証済みユーザー用のIAMロール（Lambda実行権限なし）
resource "aws_iam_role" "cognito_authenticated_default" {
  name               = "Cognito_${var.identity_pool_name}_Auth_Default_Role"
  assume_role_policy = data.aws_iam_policy_document.cognito_identity_pool_assume_role.json

  tags = merge(
    var.tags,
    {
      Name = "Cognito Authenticated Default Role - No Lambda"
    }
  )
}

# Identity Poolに認証済みロールを関連付け
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    authenticated = aws_iam_role.cognito_authenticated_default.arn
  }
}
