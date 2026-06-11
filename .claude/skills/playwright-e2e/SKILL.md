---
name: playwright-e2e
description: |
  GitHub Issue に記述されたテストケースを読み取り、Playwright で自然言語 E2E テストを実行します。
  「E2Eテストを実行して」「Issue #{番号} をテストして」「Playwright で自動テスト」などの発話で使用。
  引数: Issue番号（例: /playwright-e2e 123）または Issue URL
compatibility: |
  - npm run dev でローカル開発サーバーが起動可能であること
  - .env.local に NEXT_PUBLIC_USER_POOL_CLIENT_ID が設定されていること
  - gh CLI がインストール・認証済みであること
  - @playwright/cli がインストール済みであること（npx @playwright/cli で実行可能）
metadata:
  author: learn-auth-nextjs-aws
  version: 1.0.0
---

# Playwright E2E テスト実行エージェント

GitHub Issue に記述されたテストケースを読み取り、Playwright で E2E テストを実行します。

## CRITICAL

1. **Step 2 の承認なしに実行してはいけない** — AIの解釈が意図と異なる可能性があるため必須
2. **未定義の操作は references/ に新しいリファレンスを追加する** — 自己成長するリファレンス集
3. **スクリーンショットは必ず撮影する** — テスト結果のエビデンスとして GitHub Issue に添付

## Instructions

### Step 1: GitHub Issue からテストケースを読み取る

```bash
gh issue view {issue-number} --repo eno-conan/learn-auth-nextjs-aws
```

以下のセクションを抽出する:
- **概要**: テスト対象の機能・画面
- **テストデータ**: 使用するユーザー情報・環境 URL
- **前提条件**: テスト開始時のシステム状態
- **テスト手順**: 自然言語による操作手順（番号付きリスト）
- **期待値**: 各手順の確認ポイント
- **デバイス**: PC / SP / 両方

---

### Step 2: テスト計画を提示し、ユーザーの承認を得る（必須）

以下の形式でテスト計画を Markdown で出力し、ユーザーに確認を求める:

```markdown
## テスト計画

**対象 Issue**: #{issue-number}
**対象機能**: {機能名}
**デバイス**: {PC / SP / 両方}
**テストユーザー**: test@example.com（Cognito モック認証）

### 実行手順
1. {手順の解釈}
2. {手順の解釈}
...

### 確認ポイント（期待値）
- {確認内容}
...

### 参照するリファレンス
- `.claude/skills/playwright-e2e/references/{flow}.md`
```

**ユーザーが承認した場合のみ Step 3 に進む。**

---

### Step 3: 事前準備（認証セットアップ）

`tests/helpers/auth.ts` の `injectCognitoAuth()` を使った認証バイパスを利用する。
既存のテストコードパターンを参照:
- `tests/register/title-required.spec.ts` — 認証必須ページのテスト例

---

### Step 4: references/ のリファレンスに従い各ステップを実行

`.claude/skills/playwright-e2e/references/` に格納された操作リファレンスを参照して実行。

**使用する主なリファレンス:**
- `login-flow.md` — Cognito 認証・ログイン手順
- `register-travel-entry-flow.md` — あしあと登録 (`/register`)
- `view-travel-entries-flow.md` — あしあと一覧 (`/dashboard`)

**未定義の操作が発生した場合:**
1. 操作内容を特定する
2. 新しいリファレンスファイルを `references/{operation}-flow.md` として作成
3. 作成したリファレンスを使って操作を実行

---

### Step 5: OK/NG 判定・スクリーンショット撮影・GitHub Issue へ結果書き込み

スクリーンショットは `test-results/screenshots/issue-{number}-{timestamp}.png` に保存する。
**削除しないこと** — ローカルにエビデンスとして残す。

テスト結果を判定し、スクリーンショットのパスを含む結果コメントを Issue に追記する。

---

### Step 6: 結果サマリをユーザーへ報告

実行結果（PASS/FAIL 件数、Issue コメント URL）をターミナルに報告する。

---

## 操作リファレンス一覧

| ファイル | 対象操作 |
|---------|---------|
| `references/login-flow.md` | Cognito ログイン（モック認証含む） |
| `references/register-travel-entry-flow.md` | あしあと登録 (`/register`) |
| `references/view-travel-entries-flow.md` | あしあと一覧・詳細 (`/dashboard`) |
