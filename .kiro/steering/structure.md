# プロジェクト構造マップ

最終更新: 2026-03-06

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js (App Router) + React + TypeScript + Tailwind CSS v4 |
| 認証 | AWS Cognito (AWS Amplify経由) |
| BFF (API層) | Next.js Route Handlers (`app/api/`) |
| データ層 | Cloudflare Workers + D1 + R2 |
| Lambda | AWS Lambda (Cap'n Web RPC経由) |
| テスト | Vitest + Storybook |
| UIライブラリ | shadcn/ui |

---

## ディレクトリ構造

```
learn-auth-nextjs-aws/
├── app/                           # Next.js App Router
│   ├── page.tsx                   # ルート（認証 → リダイレクト）
│   ├── layout.tsx                 # ルートレイアウト
│   ├── login/page.tsx             # ログインページ
│   ├── register/page.tsx          # ユーザー登録ページ
│   ├── loading.tsx                # ローディングUI
│   ├── error.tsx                  # エラーUI
│   ├── components/                # App共通コンポーネント
│   │   ├── Header.tsx
│   │   ├── CustomLogin.tsx
│   │   └── PhotoUploader.tsx
│   ├── utils/
│   │   ├── logger.ts              # logError, logWarning, logCheckpoint
│   │   └── mfa-utils.ts
│   ├── dashboard/                 # ダッシュボード（あしあと一覧）
│   │   ├── page.tsx               # 'use client' メインページ
│   │   ├── types.ts               # TravelEntry型（フロント用）
│   │   └── components/
│   │       ├── TravelEntriesTable.tsx
│   │       ├── TravelEntryTableRow.tsx
│   │       ├── TravelEntryCard.tsx
│   │       ├── Pagination.tsx
│   │       └── MapView/
│   │           ├── MapView.tsx
│   │           ├── MapMarkers.tsx
│   │           ├── MapDetailPanel.tsx
│   │           ├── MapDetailContent.tsx
│   │           └── hooks/useCurrentLocation.ts
│   └── api/                       # Next.js Route Handlers（BFF）
│       ├── log-client-error/route.ts
│       ├── rpc/route.ts
│       ├── upload-photo/route.ts
│       └── travel-entries/
│           ├── route.ts
│           ├── types.ts
│           └── [id]/route.ts
├── components/                    # プロジェクト共通コンポーネント
│   ├── AmplifyProvider.tsx
│   ├── MemoryCard.tsx
│   ├── FocusTrap.tsx
│   └── ui/                       # shadcn/ui系
│       ├── button.tsx
│       ├── card.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       └── alert-dialog.tsx
├── types/                         # 共有型定義
│   ├── amplify-user.ts
│   ├── dashboard-request-body.ts
│   ├── lambda-responses.ts
│   ├── r2-lambda-responses.ts
│   ├── r2-responses.ts
│   └── changelog-monitor.ts
├── lib/
│   └── utils.ts                   # ユーティリティ（cn関数等）
├── infra-cloudflare/              # Cloudflare Workers
│   ├── photo-upload-api/          # 本番稼働中
│   │   ├── src/index.ts
│   │   └── wrangler.jsonc
│   └── memory-traces-api/         # プレースホルダー（Hello Worldのみ）
│       ├── src/index.ts
│       └── wrangler.jsonc
├── evaluation/                    # 評価ツール（Bloom - Python）
│   └── bloom/
├── .claude/rules/                 # Claude Code ルール（14ファイル）
├── .kiro/steering/                # AIステアリング設定
├── .storybook/                    # Storybook設定
├── amplify-config.ts              # AWS Amplify設定
└── CLAUDE.md
```

---

## APIルートマップ

### Next.js Route Handlers（BFF層）

| パス | メソッド | 用途 | 認証 |
|------|----------|------|------|
| `/api/travel-entries` | `GET` | 旅行エントリー一覧取得（ページング・年・キーワード検索） | 必須（Cognito） |
| `/api/travel-entries/[id]` | `DELETE` | 旅行エントリー削除 | 必須（Cognito） |
| `/api/upload-photo` | `POST` | 写真アップロード（FormData → Workers転送） | 必須（Cognito） |
| `/api/rpc` | `POST` | Cap'n Web風バッチRPC（Lambda呼び出し） | 必須（Cognito + グループ認可） |
| `/api/log-client-error` | `POST` | クライアントエラーのサーバーログ記録 | 不要 |

### 未実装のAPIエンドポイント（存在しない）

- `/api/travel-entries` の `POST`（新規作成）— upload-photoがエントリー作成も兼ねる
- `/api/travel-entries/[id]` の `PUT` / `PATCH`（更新）
- `/api/travel-entries/[id]` の `GET`（個別取得）
- `/api/travel-entries` の `DELETE`（一括削除）

---

### Cloudflare Workers API（データ層）

#### photo-upload-api（本番稼働中）

| パス | メソッド | 用途 |
|------|----------|------|
| `/upload` | `POST` | R2画像アップロード + D1メタデータ保存 + travel_entries作成 |
| `/photos` | `GET` | 写真一覧取得（limit/offset） |
| `/photos/:id` | `GET` | 写真詳細取得 |
| `/travel-entries` | `GET` | 旅行エントリー一覧（ページング・年・キーワード検索） |
| `/travel-entries/:id` | `DELETE` | エントリー削除（D1 + R2クリーンアップ） |
| `/health` | `GET` | ヘルスチェック |

**バインディング:**
- R2: `PHOTO_BUCKET` → `travel-photos`
- D1: `DB` → `travel_photo_management`
- D1テーブル: `users`, `travel_entries`, `photo_metadata`

#### memory-traces-api（プレースホルダー）

- 現在は "Hello World!" を返すだけ
- D1: `MEMORY_TRACES_DB` → `memory_traces`
- R2: `memory_traces_images`

---

## データフロー

```
[ブラウザ] → [Next.js BFF (app/api/)] → [Cloudflare Workers] → [D1/R2]
                    ↓
              [AWS Lambda] (RPC経由)
                    ↓
              [AWS Cognito] (認証)
```

### 写真アップロード
1. クライアント → `/api/upload-photo`（FormData: image, title, entryId等）
2. BFF: 認証チェック → EXIF位置情報抽出 → Workers `/upload` に転送
3. Workers: R2アップロード → D1 travel_entries作成 → D1 photo_metadata保存

### エントリー一覧取得
1. クライアント → `/api/travel-entries?page=1&pageSize=10&year=2025&keyword=東京`
2. BFF: 認証チェック → Workers `/travel-entries` に転送
3. Workers: D1クエリ → エントリー + 代表画像取得
4. BFF: R2署名付きURL生成 → レスポンス返却

### エントリー削除
1. クライアント → `/api/travel-entries/[id]`（DELETE）
2. BFF: 認証チェック → Workers `/travel-entries/:id` に転送
3. Workers: 所有権チェック → D1バッチ削除 → R2ベストエフォートクリーンアップ

---

## 認証・認可パターン

- **認証:** AWS Amplify + Cognito（`runWithAmplifyServerContext` + `fetchAuthSession`）
- **認可:** `cognito:groups` ベース（`lambda-executors`, `capnweb-users`）
- **ユーザーID取得:** `session.tokens.idToken.payload.sub`
- **所有権検証:** Workers側で `user_id` 一致を確認

---

## GitHub Actions ワークフロー

| ワークフロー | トリガー | 用途 |
|------------|---------|------|
| `deploy.yml` | push (main) / pull_request (main) | Lint + Build + Vercel デプロイ |
| `claude.yml` | @claude メンション（コメント/レビュー/Issue） | Claude Code AI アシスタント |
| `playwright.yml` | 無効化（`if: false`） | Playwright E2E テスト（現在停止中） |
| `bloom-evaluation.yml` | 毎週水曜日 22:00 UTC / manual | LLM 行動評価（Bloom フレームワーク） |
| `claude-changelog-monitor.yml` | 毎週月曜日 22:00 UTC / manual | Claude Code CHANGELOG 監視・更新 |
| `dependabot-automerge.yml` | 毎週金曜日 19:00 JST / manual | Dependabot パッチバージョン自動マージ |

### dependabot-automerge.yml 詳細

**目的:** Dependabotが作成したパッチバージョンのみのアップデートPRを自動マージし、手動レビューの負担を軽減する。

**実行タイミング:**
- スケジュール: 毎週金曜日 19:00 JST（10:00 UTC）
- 手動実行: `workflow_dispatch`（Dry runモード対応）

**対象PR:**
- パッチバージョンのみ（例: 1.2.3 → 1.2.4）
- 単一パッケージPR（グループPRは対象外）
- CI/CDチェック（deploy, Vercel, GitGuardian）が全てSUCCESSであること

**除外パッケージ:**
- `next`, `react`, `react-dom`
- `aws-amplify`, `@aws-amplify/adapter-nextjs`
- `tailwindcss`

**処理フロー:**
1. Dependabot PRリスト取得（`author:app/dependabot is:open label:dependencies`）
2. パッチバージョンPRのフィルタリング
3. 順次マージ処理:
   - CI/CDチェック待機（最大30分）
   - コンフリクト検出時は `@dependabot rebase` 試行
   - Squash and merge
   - 次PRのCI待機（30秒）
4. GitHub Step Summaryに結果サマリー出力

**権限:**
- `contents: write` - ブランチマージ
- `pull-requests: write` - PRマージ・コメント
- `checks: read` - CI status確認

---

## .claude/rules/ 一覧

| ファイル名 | 対象パス | 概要 |
|-----------|---------|------|
| `accessibility.md` | `app/**/page.tsx`, `components/**` | WCAG 2.1 Level AA準拠 |
| `api-authorization.md` | `app/api/**/*.ts` | 認証と認可の分離、所有権検証必須 |
| `api-error-exposure.md` | `app/api/**/*.ts` | 内部エラー情報の露出防止 |
| `api-error-handling.md` | `app/api/**/*.ts` | エラーハンドリング（catchで握りつぶし禁止） |
| `api-input-validation.md` | `app/api/**/*.ts` | 入力バリデーション必須 |
| `client-component-security.md` | `app/**/page.tsx`, `components/**` | Client側で認可判定禁止 |
| `env-variable-management.md` | `.env.example` | 環境変数の追加・削除は承認必須 |
| `eslint-strict-typing.md` | `**/*.{ts,tsx}` | any型禁止、ESLint 0 errors必須 |
| `investigation-guidelines.md` | `**/*` | 調査コマンド最適化（3段階調査プロセス） |
| `lambda-type-safety.md` | `app/api/**/*.ts`, `types/**` | Lambda応答の型定義必須 |
| `performance-optimization.md` | `app/**/page.tsx`, `components/**` | Lighthouse 90+、画像最適化 |
| `responsive-design.md` | `app/**/page.tsx`, `components/**` | レスポンシブデザイン |
| `tailwind-class-optimization.md` | `app/**/*.tsx`, `components/**` | Tailwind標準クラス優先 |
| `useeffect-side-effects.md` | `app/**/page.tsx`, `components/**` | useEffect単一責務、依存配列厳格 |

---

## 更新ルール

このファイルを変更するタイミング：

- **新しいAPIルートを追加した場合** → 「APIルートマップ」セクションを更新
- **新しいページ/コンポーネントを追加した場合** → 「ディレクトリ構造」セクションを更新
- **Cloudflare Workerエンドポイントを追加した場合** → 「Cloudflare Workers API」セクションを更新
- **新しい.claude/rulesを追加した場合** → 「.claude/rules/ 一覧」セクションを更新
- **新しいGitHub Actionsワークフローを追加した場合** → 「GitHub Actions ワークフロー」セクションを更新
- **「未実装」だった機能を実装した場合** → 「未実装のAPIエンドポイント」セクションから削除
