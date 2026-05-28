variable "user_pool_name" {
  description = "Cognito User Pool name"
  type        = string
}

variable "user_pool_client_name" {
  description = "Cognito User Pool Client name"
  type        = string
}

variable "test_users" {
  description = "Test users to create in Cognito User Pool"
  type = map(object({
    email              = string
    temporary_password = string
  }))
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
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
  description = "Cognito domain prefix for hosted UI"
  type        = string
  default     = ""
}

variable "callback_urls" {
  description = "Allowed callback URLs for OAuth"
  type        = list(string)
  default     = ["http://localhost:3000/login"]
}

variable "logout_urls" {
  description = "Allowed logout URLs for OAuth"
  type        = list(string)
  default     = ["http://localhost:3000/login"]
}
