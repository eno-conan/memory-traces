variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "learn-auth"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "user_pool_name" {
  description = "Cognito User Pool name"
  type        = string
  default     = "learn-auth-user-pool"
}

variable "user_pool_client_name" {
  description = "Cognito User Pool Client name"
  type        = string
  default     = "learn-auth-client"
}

variable "identity_pool_name" {
  description = "Cognito Identity Pool name"
  type        = string
  default     = "learn_auth_identity_pool"
}

variable "test_users" {
  description = "Test users to create in Cognito User Pool"
  type = map(object({
    email              = string
    temporary_password = string
  }))
  default = {
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
    # 2FA用のユーザー（メールアドレスは手動で設定してください）
    # このユーザーはMFAを有効化して使用します
    userMFA = {
      email              = "your-email@example.com" # TODO: 実際のメールアドレスに変更
      temporary_password = "TempPass123!"
    }
  }
}

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cognito_domain_prefix" {
  description = "Cognito domain prefix (must be globally unique)"
  type        = string
  default     = ""
}

variable "callback_urls" {
  description = "OAuth callback URLs"
  type        = list(string)
  default     = ["http://localhost:3000/login"]
}

variable "logout_urls" {
  description = "OAuth logout URLs"
  type        = list(string)
  default     = ["http://localhost:3000/login"]
}
