# Cognito User Pool Module
module "cognito" {
  source = "./modules/cognito"

  user_pool_name        = var.user_pool_name
  user_pool_client_name = var.user_pool_client_name
  test_users            = var.test_users
  aws_region            = var.aws_region

  # OAuth設定
  google_client_id      = var.google_client_id
  google_client_secret  = var.google_client_secret
  cognito_domain_prefix = var.cognito_domain_prefix
  callback_urls         = var.callback_urls
  logout_urls           = var.logout_urls

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# Cognito Identity Pool Module
module "identity_pool" {
  source = "./modules/identity_pool"

  identity_pool_name  = var.identity_pool_name
  user_pool_id        = module.cognito.user_pool_id
  user_pool_client_id = module.cognito.user_pool_client_id
  user_pool_endpoint  = module.cognito.user_pool_endpoint

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }

  depends_on = [module.cognito]
}
