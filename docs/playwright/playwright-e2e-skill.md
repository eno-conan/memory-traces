# `/playwright-e2e` スラッシュコマンド

## 概要

GitHub Issue に自然言語で書かれたテストケースを読み取り、Playwright で E2E テストを自動実行するスラッシュコマンド。

Issue #456 で導入した **Playwright Agent CLI 連携** の中核となるスキル。  
Confluence の代わりに **GitHub Issue** をテストケース管理の場として使用する。

## 使い方

Claude Code のチャットで以下を入力する:

```
/playwright-e2e {issue-number}
```

**例:**
```
/playwright-e2e 470
```

## 実行フロー（6ステップ）

```
Step 1  GitHub Issue を読み取る
          ↓
Step 2  テスト計画をユーザーに提示 → 承認待ち ← ここで必ず確認する
          ↓
Step 3  開発サーバー確認・Cognito モック認証セットアップ
          ↓
Step 4  操作リファレンスに従い Playwright でブラウザ操作実行
          ↓
Step 5  OK/NG 判定・スクリーンショット撮影・Issue にコメント追記
          ↓
Step 6  結果サマリーをターミナルに報告
```

**Step 2 の承認は必須。** AI の解釈が意図と異なる場合があるため、実行前に計画を確認する。

## テストケースの書き方（GitHub Issue テンプレート）

GitHub で Issue を新規作成するとき、**「E2E テストケース」** テンプレートを選択する。

テンプレートのセクション:

| セクション | 内容 |
|-----------|------|
| テスト対象ページ | `/register`, `/dashboard` など |
| 概要 | テストの目的 |
| テスト対象デバイス | PC / SP / 両方 |
| 前提条件 | テスト開始時の状態 |
| テストデータ | URL・ユーザー情報など |
| テスト手順 | 自然言語の番号付き手順 |
| 期待値 | 各手順の確認ポイント |

## スクリーンショット

テスト実行時のスクリーンショットは `test-results/screenshots/` に保存される。

```
test-results/
└── screenshots/
    └── issue-{number}-{timestamp}.png
```

## 操作リファレンス

プロジェクト固有の操作手順は `.claude/skills/playwright-e2e/references/` に格納されている。

| ファイル | 対象操作 |
|---------|---------|
| `login-flow.md` | Cognito ログイン（モック認証含む） |
| `register-travel-entry-flow.md` | あしあと登録 (`/register`) |
| `view-travel-entries-flow.md` | あしあと一覧・詳細 (`/dashboard`) |

**未定義の操作に遭遇した場合、エージェントが自動で新しいリファレンスを追加する。**

## 既存テストケース Issue

| Issue | 対象機能 |
|-------|---------|
| [#470](https://github.com/eno-conan/learn-auth-nextjs-aws/issues/470) | あしあと登録 - タイトル未入力バリデーション |
| [#471](https://github.com/eno-conan/learn-auth-nextjs-aws/issues/471) | WCAG アクセシビリティ準拠確認（3ページ） |

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `.claude/skills/playwright-e2e/SKILL.md` | スキル定義（実行フロー） |
| `.claude/skills/playwright-e2e/references/` | 操作リファレンス集 |
| `.github/ISSUE_TEMPLATE/e2e-test-case.yml` | テストケース Issue テンプレート |
| `playwright.config.ts` | PC/SP ビューポート設定 |
| `tests/helpers/auth.ts` | Cognito モック認証ユーティリティ |

## 参考

- Issue #456: 本機能の導入経緯
- [ZOZO テックブログ](https://techblog.zozo.com/entry/claude-code-with-playwright-cli) — 実装参考記事
- [Playwright Agent CLI](https://playwright.dev/agent-cli/introduction) — 公式ドキュメント
- [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli) — GitHub リポジトリ
