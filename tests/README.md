# E2E テスト概要

Playwright を使用したエンドツーエンドテスト。
実行には開発サーバー (`npm run dev`) が起動済みであること、または Playwright が自動起動する。

```bash
# 特定ファイルのみ実行
npx playwright test tests/register/title-required.spec.ts --headed

# 全テスト実行
npx playwright test

# PC のみ実行
npx playwright test --project="Desktop Chrome"

# SP のみ実行
npx playwright test --project="Mobile Safari"
```

---

## フォルダ構成

```
tests/
├── helpers/          # 機能横断ユーティリティ（テスト間で共有）
├── register/         # あしあと登録画面 (/register) のテスト
├── a11y/             # アクセシビリティテスト
└── example.spec.ts   # Playwright デフォルトサンプル（参照用）
```

---

## 機能別テスト

### `register/` — あしあと登録画面 (`/register`)

| ファイル | テスト内容 |
|----------|-----------|
| `title-required.spec.ts` | 画像選択後、タイトル未入力のとき「刻む」ボタンが `disabled` であることを確認 |

---

## ヘルパー・ユーティリティ

### `helpers/auth.ts` — 認証モック

`/register` など認証必須ページのテストで使用する、AWS Cognito 認証バイパスユーティリティ。

```typescript
import { injectCognitoAuth } from '../helpers/auth';

test.beforeEach(async ({ page }) => {
  await injectCognitoAuth(page); // page.goto() より前に呼ぶ
});
```

**仕組み:**

- Amplify v6 は `Amplify.configure(..., { ssr: true })` により Cookie にトークンを保存する
- `page.context().addCookies()` で `CognitoIdentityServiceProvider.{clientId}.*` の Cookie を直接注入
- JWT の `exp` を西暦2286年に設定することで期限切れを回避
- `NEXT_PUBLIC_USER_POOL_CLIENT_ID` は `.env.local` から自動読み込み（dotenv 不要）

**注意:** `page.goto()` より前に呼び出すこと。後から呼んでも Cookie がページに反映されない。

---

## Playwright Agent CLI（自然言語 E2E テスト）

GitHub Issue に自然言語でテストケースを記述し、AI エージェントが自動実行する仕組み。

### テストケースの作成

GitHub の Issue 作成画面で **「E2E テストケース」** テンプレートを選択し、テスト手順を自然言語で記述する（Confluence の代替）。

### セットアップ

`@playwright/cli` をインストールする（初回のみ）:

```bash
npm install --save-dev @playwright/cli
```

> **注意:** 2026年6月時点で `@playwright/cli` は alpha 版です。Playwright v1.61.0-alpha に依存します。

### テストの実行

Claude Code で以下のスキルを実行する:

```
/playwright-e2e {issue-number}
```

または直接 CLI で実行する:

```bash
npm run test:e2e-agent
# = npx @playwright/cli
```

6ステップで自動実行される:
1. GitHub Issue からテストケースを読み取る
2. テスト計画を提示 → **ユーザー承認**（必須）
3. Cognito 認証セットアップ
4. 操作リファレンスに従いブラウザ操作実行
5. OK/NG 判定・スクリーンショット撮影・Issue にコメント追記
6. 結果サマリー報告

### 操作リファレンス

プロジェクト固有の操作手順は `.claude/skills/playwright-e2e/references/` に格納されている。

| ファイル | 対象操作 |
|---------|---------|
| `login-flow.md` | Cognito ログイン（モック認証含む） |
| `register-travel-entry-flow.md` | あしあと登録 (`/register`) |
| `view-travel-entries-flow.md` | あしあと一覧・詳細 (`/dashboard`) |

新しい操作が必要になった場合、エージェントが自動的にリファレンスを追加する。

### デバイス設定

`playwright.config.ts` で PC と SP のビューポートを設定している:

| プロジェクト名 | デバイス | ビューポート |
|-------------|---------|------------|
| `Desktop Chrome` | PC | 1400×1080 |
| `Mobile Safari` | iPhone 14 | 390×844 |
