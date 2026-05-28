# Cognito User Pool Outputs
output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = module.cognito.user_pool_arn
}

output "user_pool_endpoint" {
  description = "Cognito User Pool endpoint"
  value       = module.cognito.user_pool_endpoint
}

# Cognito User Pool Client Outputs
output "user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.cognito.user_pool_client_id
}

# Cognito Identity Pool Outputs
output "identity_pool_id" {
  description = "Cognito Identity Pool ID"
  value       = module.identity_pool.identity_pool_id
}

output "identity_pool_arn" {
  description = "Cognito Identity Pool ARN"
  value       = module.identity_pool.identity_pool_arn
}

# IAM Role Outputs
output "cognito_authenticated_default_role_arn" {
  description = "Cognito Authenticated Default Role ARN (No Lambda permission)"
  value       = module.identity_pool.cognito_authenticated_default_role_arn
}

output "cognito_authenticated_default_role_name" {
  description = "Cognito Authenticated Default Role Name"
  value       = module.identity_pool.cognito_authenticated_default_role_name
}

# Environment Variables for .env.local
output "env_variables" {
  description = "Environment variables for .env.local file"
  value       = <<-EOT
    # AWS Cognito Configuration
    NEXT_PUBLIC_USER_POOL_ID=${module.cognito.user_pool_id}
    NEXT_PUBLIC_USER_POOL_CLIENT_ID=${module.cognito.user_pool_client_id}
    NEXT_PUBLIC_IDENTITY_POOL_ID=${module.identity_pool.identity_pool_id}

    # AWS Region
    AWS_REGION=${var.aws_region}
  EOT
}

# Test Users Information
output "test_users" {
  description = "Test users created in Cognito User Pool"
  value       = module.cognito.test_users
  sensitive   = true
}
