variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "r2_bucket_name" {
  description = "R2バケット名（写真ストレージ用）"
  type        = string
  default     = "travel-photos"
}

variable "d1_database_name" {
  description = "D1データベース名"
  type        = string
  default     = "travel_photo_management"
}

variable "google_client_id" {
  description = "Google OAuth 2.0 クライアントID"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth 2.0 クライアントシークレット"
  type        = string
  default     = ""
  sensitive   = true # ログに値が表示されないように保護
}

variable "cognito_domain_prefix" {
  description = "Amazon Cognito ユーザープールのカスタムドメインプレフィックス"
  type        = string
  default     = "photo-management-auth"
}
