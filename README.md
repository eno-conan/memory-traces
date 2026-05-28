# Memory Traces - 旅のあしあと記録アプリ

旅先での体験を写真と位置情報とともに記録・管理する Web アプリケーションです。
Next.js 16 と AWS / Cloudflare のマネージドサービスを活用して構築されています。

## 機能

### 認証

- AWS Cognito によるユーザー認証（メール/パスワード + Google OAuth）
- MFA（多要素認証）対応
- セッション管理

### あしあと一覧表示（/dashboard）

- 旅の記録を一覧表示
- 年別フィルタリング・キーワード検索
- Google Maps 連携によるマップ表示
- ページネーション

### 足跡を刻む（/register）

- 写真アップロードによる旅の記録作成（最大 5 枚）
- EXIF 位置情報の自動抽出
- クライアント側での画像圧縮
- ドラッグ&ドロップ対応

### 写真管理

- Cloudflare R2 への画像保存
- EXIF メタデータ（GPS 座標、カメラ情報）の抽出・活用
- 署名付き URL による安全な画像配信

### UI/UX

- レスポンシブデザイン
- ダークモード対応

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS 4, Radix UI, shadcn/ui, Lucide Icons |
| 認証 | AWS Amplify 6, AWS Cognito |
| データベース | Cloudflare D1 |
| オブジェクトストレージ | Cloudflare R2 |
| バックエンド API | Cloudflare Workers |
| マップ | Google Maps API |
| AWS SDK | AWS SDK v3（S3, Lambda, credential-providers） |
| IaC | Terraform（AWS / Cloudflare） |
| テスト | Vitest, Playwright, Storybook |
| ホスティング | Vercel |

## クイックスタート

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.local を編集して各サービスの認証情報を設定

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアクセスします。

> 詳細なセットアップ手順は [docs/SETUP.md](./docs/SETUP.md) を参照してください。

## プロジェクト構成

```
.
├── app/
│   ├── api/
│   │   ├── log-client-error/    # クライアントエラーログ
│   │   ├── rpc/                 # RPC エンドポイント
│   │   ├── travel-entries/      # あしあとデータ取得 API
│   │   └── upload-photo/        # 写真アップロード API
│   ├── components/              # アプリ内共有コンポーネント
│   ├── dashboard/               # あしあと一覧ページ
│   │   └── components/          # ダッシュボード専用コンポーネント
│   ├── detail/                  # 詳細ページ
│   ├── login/                   # ログインページ
│   ├── register/                # 足跡を刻むページ
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/                      # UI コンポーネント（shadcn/ui）
├── infra-aws/                   # AWS インフラ（Terraform）
├── infra-cloudflare/            # Cloudflare インフラ
│   ├── memory-traces-api/       # あしあと API（Workers）
│   ├── photo-upload-api/        # 写真アップロード API（Workers）
│   └── terraform/               # Cloudflare IaC
├── docs/                        # ドキュメント
├── scripts/                     # ユーティリティスクリプト
├── stories/                     # Storybook ストーリー
├── amplify-config.ts            # Amplify 設定
└── package.json
```

## 開発コマンド

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run lint` | ESLint 実行 |
| `npm run lint:fix` | ESLint 自動修正 |
| `npm run type-check` | TypeScript 型チェック |
| `npm run test` | テスト実行 |
| `npm run quality-check` | 型チェック + lint + テスト |
| `npm run verify` | quality-check + build |
| `npm run storybook` | Storybook 起動（ポート 6006） |
| `npm run format` | Prettier によるフォーマット |

## デプロイ

詳細な手順は [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) を参照してください。

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [docs/SETUP.md](./docs/SETUP.md) | セットアップ手順 |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | デプロイ手順 |
| [docs/aws/](./docs/aws/) | AWS 設定ガイド（Cognito, MFA 等） |
| [docs/cloudflare/](./docs/cloudflare/) | Cloudflare 設定ガイド（D1, R2） |
| [docs/security/](./docs/security/) | セキュリティ関連 |
| [docs/vercel/](./docs/vercel/) | Vercel 関連（OAuth 401 修正等） |
| [docs/storybook/](./docs/storybook/) | Storybook 関連 |
| [docs/tests/](./docs/tests/) | テスト関連 |

## トラブルシューティング

問題が発生した場合は、以下のドキュメントを参照してください。

- **AWS / Cognito 関連**: [docs/aws/AWS_SETUP_GUIDE.md](./docs/aws/AWS_SETUP_GUIDE.md)
- **Vercel Google OAuth 401 エラー**: [docs/vercel/VERCEL_401_FIX_STEPS.md](./docs/vercel/VERCEL_401_FIX_STEPS.md)
- **セキュリティ**: [docs/security/security-best-practices.md](./docs/security/security-best-practices.md)

## 参考リンク

- [claude-code Change log](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- [Subagent Samples](https://medium.com/@joe.njenga/17-claude-code-subagents-examples-with-templates-you-can-use-immediately-c70ef5567308)
- [cc-sdd](https://github.com/gotalab/cc-sdd)
- [Anthropic Academy](https://www.anthropic.com/learn)

## ライセンス

MIT
