---
name: analyze-changelog
description: |
  GitHub Actions で作成された Claude Code CHANGELOG 更新 Issue を分析し、
  .claude ディレクトリへの具体的な改善提案を生成します。
  「CHANGELOG分析」「Claude Code更新の確認」「.claude設定の改善」などの発話で使用。
  使い方: /analyze-changelog <issue-number>
  Requires: ANTHROPIC_API_KEY environment variable, gh CLI.
license: Complete terms in LICENSE.txt
compatibility: |
  GitHub CLI (gh) がインストールされ認証済みであること。
  環境変数 ANTHROPIC_API_KEY が設定されていること。
  npmjs.com へのネットワークアクセス。
metadata:
  author: learn-auth-nextjs-aws
  version: 1.0.0
---

# Analyze Claude Code CHANGELOG Issue

GitHub Actionsで作成されたClaude Code CHANGELOG更新Issueを分析し、
.claudeディレクトリへの具体的な改善提案を生成します。

## CRITICAL

1. **アクション可能な項目のみ提案する** - バグ修正やパフォーマンス改善など、ユーザー側で対応不要な内容は除外
2. **環境変数の確認を最初に行う** - `ANTHROPIC_API_KEY` と `gh` CLI が利用可能でなければ即座に停止

## Arguments

- `<issue-number>`: 分析対象のGitHub Issue番号（必須）

## Instructions

### Step 0: タスクリスト作成

TodoWriteツールで進捗を可視化するタスクリストを作成。

### Step 1: 前提条件チェック

```bash
gh --version
echo $ANTHROPIC_API_KEY
```

利用できない場合はエラーメッセージを表示して終了。

### Step 2: Issue読み込み

```bash
gh issue view <issue-number> --json title,body,number,createdAt
```

### Step 3: Issue内容の解析

Issue本文から以下を抽出:
1. **検出バージョン**: `**検出バージョン:** X.Y.Z`
2. **変更差分**: ` ```diff ` ブロック
3. **日本語翻訳**: `### 日本語翻訳` セクション
4. **.claude現状**: `### .claude ディレクトリ現状` セクション

### Step 4: 最新の.claudeディレクトリ確認

現在の構成を確認（Issue作成時点から変更されている可能性があるため）。

### Step 5: 分析範囲の確認

AskUserQuestionツールでユーザーに質問:
- 既存設定の改善提案
- 新機能の導入提案
- 両方

### Step 6: リポジトリコンテキストの構築

package.jsonから技術スタック、`.claude/settings.json`から有効プラグインを取得。

### Step 7: Claude APIで詳細分析

詳細なプロンプトテンプレートは [references/claude-api-prompt-template.md](references/claude-api-prompt-template.md) を参照。

Claude API（モデル: `claude-sonnet-4-5-20250929`、最大トークン: 8000）で分析を実行。

**アクション可能性フィルタ**:
- OK: 新機能追加、既存機能の仕様変更、新しいベストプラクティス、.claude設定で活用可能な機能
- NG: Claude Code内部実装変更、バグ修正、パフォーマンス改善、内部処理改善

### Step 8: 分析結果の表示と確認

結果を表示し、AskUserQuestionでフィードバックを収集。

### Step 9: 結果の保存（オプション）

保存方法をユーザーに確認:
- Issueコメントとして投稿
- ローカルファイルに保存（`.claude/analysis/changelog-<version>.md`）
- 両方
- 保存しない

### Step 10: 完了報告

Issue番号、検出バージョン、分析範囲、提案数のサマリーを表示。

## IMPORTANT

- このSkillは**インタラクティブ**に実行されるため、自動化には適していない
- 分析結果の品質はCHANGELOG差分とリポジトリ情報に依存する
