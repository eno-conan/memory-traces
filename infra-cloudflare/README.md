# Cloudflare インフラストラクチャ管理

このディレクトリには、Cloudflareリソース（R2、D1、Workers KV）をTerraformで管理するための設定が含まれています。

## 概要

このディレクトリは、Next.jsアプリケーションの写真管理・旅行エントリー管理のバックエンドインフラを提供します。Cloudflare Workers、R2、D1を活用したサーバーレスアーキテクチャで構築されており、すべてのリソースはTerraformで管理されています。

**使用しているCloudflareサービス:**

- **Cloudflare Workers**: 3つのマイクロサービスAPI（photo-upload-api, travel-entries-api, travel-entry-delete-api）
- **Cloudflare R2**: オブジェクトストレージ（travel-photosバケット、APAC地域、3日後自動削除ルール適用）
- **Cloudflare D1**: SQLiteベースのサーバーレスデータベース（photo_managementデータベース）
- **Cloudflare Workers KV**: Key-Valueストレージ（photo-upload-sessionsネームスペース、将来の拡張用）

## アーキテクチャ

### フォルダ構成

```
infra-cloudflare/
├── README.md
├── terraform/                   # Terraformでインフラ管理
│   ├── main.tf                  # R2, D1, KV リソース定義
│   ├── variables.tf             # 変数定義
│   └── terraform.tfvars         # 環境変数
├── photo-upload-api/            # 画像アップロードAPI
│   ├── src/
│   │   ├── index.ts             # メインハンドラー
│   │   └── retry-utils.ts       # リトライ処理ユーティリティ
│   ├── migrations/              # D1マイグレーション
│   │   ├── 0001_add_users_updated_at.sql
│   │   └── 0002_add_shot_at_to_travel_entries.sql
│   ├── schema.sql               # 完全なDBスキーマ（新規環境用）
│   ├── wrangler.jsonc           # Wrangler設定
│   └── package.json
├── travel-entries-api/          # 旅行エントリー読み込みAPI
│   ├── src/
│   │   └── index.ts             # メインハンドラー
│   ├── wrangler.jsonc           # Wrangler設定
│   └── package.json
└── travel-entry-delete-api/     # 旅行エントリー削除API
    ├── src/
    │   ├── index.ts             # メインハンドラー
    │   └── retry-utils.ts       # リトライ処理ユーティリティ
    ├── wrangler.jsonc           # Wrangler設定
    └── package.json
```

### 各フォルダの役割

- **terraform/**: R2バケット、D1データベース、Workers KVネームスペースの定義と管理
- **photo-upload-api/**: 画像アップロード、travel_entriesとphoto_metadataのD1登録、R2への画像保存
- **travel-entries-api/**: 旅行エントリー一覧取得（ページング、年検索、キーワード検索機能付き）
- **travel-entry-delete-api/**: 旅行エントリー削除（D1レコード削除 + R2オブジェクトクリーンアップ）

### Workers API一覧

| API | エンドポイント | メソッド | 責務 |
|-----|--------------|---------|------|
| photo-upload-api | `/upload` | POST | 画像をR2に保存、travel_entriesとphoto_metadataをD1に登録 |
| | `/health` | GET | ヘルスチェック |
| travel-entries-api | `/travel-entries` | GET | D1から旅行エントリー一覧を取得（ページング・年・キーワード検索対応） |
| | `/health` | GET | ヘルスチェック |
| travel-entry-delete-api | `/travel-entries/{id}` | DELETE | D1レコード削除 + R2オブジェクトクリーンアップ |
| | `/health` | GET | ヘルスチェック |

### データフロー

```
[Next.js BFF] → [Cloudflare Workers] → [D1/R2]
                        ↓
                  認証チェック (Bearer Token)
                  リトライ処理 (Exponential Backoff)
                  エラーハンドリング
```

## データベーススキーマ

### D1データベース: `travel_photo_management`

| テーブル | 用途 | 主要カラム |
|---------|------|-----------|
| `users` | ユーザー情報 | id, email, name, picture, google_id, created_at, updated_at |
| `travel_entries` | 旅行エントリー | id, user_id, title, thoughts, r2_folder, shot_at, created_at, updated_at |
| `photo_metadata` | 写真メタデータ | id, user_id, r2_key, latitude, longitude, entry_id, uploaded_at |

### リレーション

- `photo_metadata.user_id` → `users.id`
- `photo_metadata.entry_id` → `travel_entries.id` (ON DELETE SET NULL)
- `travel_entries.user_id` → `users.id` (ON DELETE CASCADE)

### 主要インデックス

- **ユーザーIDベース検索**: `idx_travel_entries_user`, `idx_photo_user`
- **日時ソート**: `idx_travel_entries_created`, `idx_travel_entries_updated`, `idx_travel_entries_shot`, `idx_photo_uploaded`
- **位置情報検索**: `idx_photo_location` (latitude, longitude)

### スキーマ管理

- **新規環境**: `schema.sql` を1回実行するだけで完全なスキーマが構築されます
- **既存環境**: `migrations/` フォルダのマイグレーションファイルを順次実行して、既存環境を最新スキーマに更新します
- **詳細**: スキーマ管理の詳細は `.claude/rules/cloudflare-d1-migrations.md` を参照してください

## バージョン情報

- **Terraform**: ~> 1.14.0
- **Cloudflare Provider**: ~> 5.0 (v5.16.0+)

## セットアップ手順

### 1. Cloudflare API Tokenの作成

https://developers.cloudflare.com/fundamentals/api/get-started/create-token/

**必要な権限**:
- Account.Cloudflare R2 (Read/Write)
- Account.D1 (Read/Write)
- Account.Workers KV Storage (Read/Write)

**注意事項**:
- 「クライアント IP アドレス フィルタリング」は、WiFiによって動的に変わる可能性があるため、適宜調整してください

### 4. D1データベースの初期化

Terraformでデータベースリソースを作成した後、スキーマを適用します：

```bash
cd ../photo-upload-api  # または memory-traces-api

# テーブル定義確認
SELECT sql
FROM sqlite_master
WHERE type = 'table'
  AND name = 'travel_entries';

# スキーマをリモートD1に適用
npx wrangler d1 execute travel_photo_management --remote --file=./migrations/nnnn_xxxx.sql
```

**注意**:
- `<database-name>` は `terraform output` で確認できるD1データベース名に置き換えてください（例: `photo_management`）
- `wrangler.jsonc` の `database_id` が正しく設定されているか確認してください

### 5. API_KEYシークレットの設定

Cloudflare WorkersのAPIを保護するため、シークレットキーを設定します：

```bash
cd photo-upload-api  # または memory-traces-api

# ランダムなAPIキーを生成
openssl rand -base64 32

# Wranglerでシークレットを設定
npx wrangler secret put API_KEY
# プロンプトが表示されたら、上で生成したキーを入力
# ↑このコマンドで設定したら、ターミナルには表示されないかもしれん

# デプロイ
npx wrangler deploy
```

**重要**:
- 「API_KEY」はシークレット変数の名前です（置き換えないでください）
- 実際のキーの値は、コマンド実行時に入力します
- 生成したキーは、プロジェクトルートの `.env.local` にも `CLOUDFLARE_WORKERS_API_TOKEN` として設定してください

## Cloudflare Provider v5 移行について

このプロジェクトはCloudflare Provider v5を使用しています。v4からの主な変更点：

### 破壊的変更
- **R2 Bucket location**: `"auto"`が廃止され、明示的な地域指定が必要
  - このプロジェクトでは`"apac"`（Asia Pacific）を使用
  - 他の選択肢: `"enam"`, `"wnam"`, `"weur"`, `"eeur"`, `"oc"`

- **D1 Database read_replication**: Provider v5で必須プロパティに変更
  - `null`値は受け付けない（APIエラー: "Expected object, received null"）
  - 明示的に`read_replication = { mode = "disabled" }`を指定する必要あり
  - `mode`の有効な値: `"auto"`（グローバルレプリケーション）または`"disabled"`

### v5の利点
- APIカバレッジ100%達成
- リソース数25%増加
- データソース200以上追加
- OpenAPI Schemaベースの自動生成で最新機能に追従

詳細: https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/guides/version-5-upgrade