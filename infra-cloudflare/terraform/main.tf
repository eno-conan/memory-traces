terraform {
  required_version = "~> 1.14.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# R2バケット（写真ストレージ）
resource "cloudflare_r2_bucket" "travel_photos" {
  account_id = var.cloudflare_account_id
  name       = var.r2_bucket_name
  location   = "apac"
}

# R2バケットのライフサイクルルール設定
resource "cloudflare_r2_bucket_lifecycle" "travel_photos_lifecycle" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.travel_photos.name

  rules = [
    {
      id      = "delete-travel-photos-after-3-days"
      enabled = true

      conditions = {
        prefix = "travel-photos/photos/"
      }

      delete_objects_transition = {
        condition = {
          max_age = 259200  # 3日 = 3 * 24 * 60 * 60秒
          type    = "Age"
        }
      }
    }
  ]
}

# D1データベース
resource "cloudflare_d1_database" "travel_photo_management" {
  account_id = var.cloudflare_account_id
  name       = var.d1_database_name

  # Read replicationを明示的に無効化（Provider v5で必須）
  read_replication = {
    mode = "disabled"
  }
}

# Workers KVネームスペース（セッション管理用、将来の拡張用）
resource "cloudflare_workers_kv_namespace" "sessions" {
  account_id = var.cloudflare_account_id
  title      = "photo-upload-sessions"
}

# Outputs
output "r2_bucket_name" {
  value       = cloudflare_r2_bucket.travel_photos.name
  description = "R2バケット名"
}

output "d1_database_id" {
  value       = cloudflare_d1_database.travel_photo_management.id
  description = "D1データベースID"
}

output "d1_database_name" {
  value       = cloudflare_d1_database.travel_photo_management.name
  description = "D1データベース名"
}

output "kv_namespace_id" {
  value       = cloudflare_workers_kv_namespace.sessions.id
  description = "Workers KVネームスペースID"
}
