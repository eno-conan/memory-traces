output "identity_pool_id" {
  description = "Cognito Identity Pool ID"
  value       = aws_cognito_identity_pool.main.id
}

output "identity_pool_arn" {
  description = "Cognito Identity Pool ARN"
  value       = aws_cognito_identity_pool.main.arn
}

output "cognito_authenticated_default_role_arn" {
  description = "Cognito Authenticated Default Role ARN (No Lambda permission)"
  value       = aws_iam_role.cognito_authenticated_default.arn
}

output "cognito_authenticated_default_role_name" {
  description = "Cognito Authenticated Default Role Name"
  value       = aws_iam_role.cognito_authenticated_default.name
}
