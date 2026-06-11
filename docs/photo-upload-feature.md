# 旅行写真アップロード機能

## 概要

この機能は、旅行先で撮影した写真をアップロードし、位置情報（EXIF）を抽出してCloudflareのインフラストラクチャに保存するシステムです。

## アーキテクチャ

```
ユーザー → Next.js (Google認証)
           ↓
       Google Drive (一時保存)
           ↓ (JWT認証)
       Next.js API Route (EXIF抽出)
           ↓
    Cloudflare Workers API
           ↓
    D1 (メタデータ) + R2 (画像ストレージ)
```

### フロー詳細

1. **認証**: ユーザーがGoogle OAuthでログイン（drive.fileスコープのみ）
2. **画像圧縮**: クライアント側で画像を圧縮（最大1MB、1920px）
3. **一時アップロード**: Google Driveの専用フォルダ（TravelPhotosTemp）にアップロード
4. **サーバー処理**:
   - Next.js API RouteがGoogle Driveから画像をダウンロード
   - EXIF情報（緯度・経度）を抽出
   - Cloudflare Workers APIに転送
5. **永続化**:
   - Workers APIがR2バケットに画像を保存
   - D1データベースにメタデータ（位置情報含む）を保存
6. **クリーンアップ**: Google Driveの一時ファイルを削除

## セキュリティ設計

### 最小権限の原則

- **Google Drive**: `drive.file` スコープのみ（アプリが作成したファイルのみアクセス）
- **一時保存**: 専用フォルダに隔離
- **即時削除**: 処理完了後、一時ファイルを自動削除

### データ保護

- **アクセストークン**: サーバー側で即座に使用、長期保存なし
- **Workers API認証**: Bearer tokenによる認証
- **R2バケット**: 非公開、Workers経由でのみアクセス

## 技術スタック

### フロントエンド
- **Next.js 15** (App Router)
- **React 19**
- **@react-oauth/google**: Google OAuth認証
- **react-dropzone**: ドラッグ&ドロップUI
- **browser-image-compression**: クライアント側画像圧縮

### バックエンド
- **Next.js API Routes**: サーバーサイド処理
- **googleapis**: Google Drive API連携
- **exifr**: EXIF情報抽出

### インフラストラクチャ
- **Cloudflare Workers**: サーバーレスAPIエンドポイント
- **Cloudflare D1**: SQLiteベースのデータベース（メタデータ保存）
- **Cloudflare R2**: S3互換オブジェクトストレージ（画像保存）

### IaC（Infrastructure as Code）
- **Terraform**: Cloudflareリソースの管理

## データベーススキーマ

### users テーブル
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  google_id TEXT UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### photo_metadata テーブル
```sql
CREATE TABLE photo_metadata (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  uploaded_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API エンドポイント

### フロントエンド → Next.js

#### POST /api/upload-photo
写真のアップロード処理を行います。

**リクエスト**:
```typescript
FormData {
  driveFileId: string;  // Google DriveのファイルID
  accessToken: string;  // Google OAuthアクセストークン
  fileName: string;     // ファイル名
}
```

**レスポンス**:
```typescript
{
  success: boolean;
  location?: {
    lat: number;
    lng: number;
  };
  message: string;
}
```

### Next.js → Cloudflare Workers

#### POST /upload
画像とメタデータをR2/D1に保存します。

**リクエスト**:
```typescript
FormData {
  image: Blob;         // 画像ファイル
  latitude?: string;   // 緯度
  longitude?: string;  // 経度
}
```

**ヘッダー**:
```
Authorization: Bearer <CLOUDFLARE_WORKERS_API_TOKEN>
```

**レスポンス**:
```typescript
{
  success: boolean;
  photoId: string;
  r2Key: string;
  location?: {
    lat: number;
    lng: number;
  };
}
```

#### GET /photos
写真一覧を取得します。

**クエリパラメータ**:
- `limit`: 取得件数（デフォルト: 20）
- `offset`: オフセット（デフォルト: 0）

**レスポンス**:
```typescript
{
  photos: Array<{
    id: string;
    user_id: string;
    r2_key: string;
    latitude?: number;
    longitude?: number;
    uploaded_at: string;
  }>;
  count: number;
}
```

## 使用方法

### 1. セットアップ

#### Google OAuth
[Google OAuth セットアップガイド](./GOOGLE_OAUTH_SETUP.md) を参照してください。

#### Cloudflare インフラストラクチャ
[Cloudflare セットアップガイド](./CLOUDFLARE_SETUP.md) を参照してください。

### 2. 環境変数の設定

`.env.local` ファイルを作成：

```bash
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_WORKERS_API_URL=https://photo-upload-api.your-account.workers.dev
CLOUDFLARE_WORKERS_API_TOKEN=your-secure-token

# D1 Database
D1_DATABASE_ID=your-database-id
D1_DATABASE_NAME=travel_photo_management

# R2 Storage
R2_PHOTO_BUCKET_NAME=travel-photos
```

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000/photos にアクセスしてください。

## 機能詳細

### 画像圧縮

クライアント側で以下の設定で自動圧縮：
- **最大ファイルサイズ**: 1MB
- **最大解像度**: 1920px
- **形式**: JPEG（元の形式を維持）

圧縮により、アップロード速度と保存コストを最適化します。

### 位置情報抽出

EXIF情報から以下を抽出：
- **緯度（Latitude）**
- **経度（Longitude）**

位置情報がない画像もアップロード可能です（位置情報なしとして保存）。

### アップロード制限

- **最大枚数**: 5枚/回
- **対応形式**: JPEG, PNG, HEIC
- **最大ファイルサイズ**: 制限なし（圧縮後1MB以下を推奨）

### 進捗表示

各写真のアップロード状態をリアルタイム表示：
- **待機中**: アップロード前
- **圧縮中**: 画像圧縮処理中
- **アップロード中**: サーバー転送中
- **完了**: 処理成功
- **エラー**: エラー発生時

## トラブルシューティング

### Google認証エラー

**症状**: "Access blocked: This app's request is invalid"

**解決策**:
1. Google Cloud ConsoleでOAuth同意画面の設定が完了しているか確認
2. 承認済みのリダイレクトURIが正しいか確認
3. テストモードの場合、テストユーザーに追加されているか確認

### 位置情報が取得できない

**原因**:
- 写真にEXIF情報が含まれていない
- スマホのカメラ設定で位置情報がオフ
- ブラウザ経由でアップロードされた画像（EXIFが削除される）

**対応**:
- Google Drive経由でアップロード（EXIFを保持）
- カメラアプリの設定で位置情報をオン

### Cloudflare Workers API エラー

**症状**: "500 Internal Server Error"

**確認事項**:
1. Workers APIがデプロイされているか: `wrangler deployments list`
2. D1データベースが作成されているか: `wrangler d1 list`
3. R2バケットが作成されているか: `wrangler r2 bucket list`
4. `wrangler.jsonc` の設定が正しいか

**ログ確認**:
```bash
wrangler tail photo-upload-api
```

### アップロードが遅い

**原因**:
- 画像ファイルが大きすぎる
- インターネット接続が不安定

**対応**:
- 画像圧縮設定を調整（`maxSizeMB` を減らす）
- 画像の枚数を減らす
- 安定したネットワーク環境で実行

## パフォーマンス最適化

### クライアント側
- 画像圧縮により転送量を削減
- 並列アップロードではなく順次処理（API負荷軽減）
- React.memoによるコンポーネント最適化

### サーバー側
- Cloudflare Workersのエッジコンピューティング
- R2の低レイテンシストレージ
- D1のインデックス最適化

## 今後の拡張予定

- [ ] ユーザー認証の統合（現在はdefault-user）
- [ ] 画像の表示機能（ギャラリー）
- [ ] 地図上での位置表示
- [ ] 画像の削除機能
- [ ] 画像の編集機能（回転、トリミング）
- [ ] アルバム機能
- [ ] 共有機能

## ライセンス

このプロジェクトはプライベートリポジトリです。

## サポート

質問や問題が発生した場合は、GitHubのIssueを作成してください。
