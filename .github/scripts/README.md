# Claude Code CHANGELOG Monitor

This directory contains the automated CHANGELOG monitoring script for the official [Claude Code repository](https://github.com/anthropics/claude-code).

## Overview

The monitor runs twice weekly (Monday and Friday at 7:00 AM JST) via GitHub Actions. When new versions are detected in the Claude Code CHANGELOG, it automatically:

1. Detects version changes
2. Generates a diff of the changes
3. Translates the changes to Japanese using Claude Sonnet 4.5
4. (Optional) Searches for related information using TAVILY API
5. Creates a GitHub Issue with all the information
6. Updates the state file for next comparison

## Architecture

- **Scheduling**: GitHub Actions cron (Sunday/Thursday 22:00 UTC = Monday/Friday 07:00 JST)
- **State Management**: Git-based storage in `.github/data/claude-code-changelog.md`
- **Script Language**: TypeScript executed with `tsx`
- **Error Handling**: Graceful degradation (translation/TAVILY failures don't block Issue creation)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure GitHub Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- **`ANTHROPIC_API_KEY`** (Required): Your Claude API key from [console.anthropic.com](https://console.anthropic.com)
- **`TAVILY_API_KEY`** (Optional): Your TAVILY search API key from [tavily.com](https://tavily.com)
- **`GITHUB_TOKEN`**: Automatically provided by GitHub Actions (no setup needed)

### 3. Enable Workflow Permissions

Ensure your repository has the following workflow permissions enabled:

1. Go to Settings → Actions → General
2. Under "Workflow permissions", select:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

## Local Testing

### Prerequisites

Set up environment variables:

```bash
# Windows (PowerShell)
$env:ANTHROPIC_API_KEY = "sk-ant-..."
$env:TAVILY_API_KEY = "tvly-..."  # Optional
$env:GITHUB_TOKEN = "ghp_..."
$env:GITHUB_REPOSITORY = "eno-conan/learn-auth-nextjs-aws"

# Linux/macOS (Bash)
export ANTHROPIC_API_KEY="sk-ant-..."
export TAVILY_API_KEY="tvly-..."  # Optional
export GITHUB_TOKEN="ghp_..."
export GITHUB_REPOSITORY="eno-conan/learn-auth-nextjs-aws"
```

### Dry Run (Recommended for First Test)

This mode fetches the CHANGELOG, detects changes, generates translations, but **does not create a GitHub Issue**:

```bash
npm run monitor:changelog:dry
```

Expected output:
```
🚀 Starting Claude Code CHANGELOG Monitor...
📋 Configuration:
   Repository: eno-conan/learn-auth-nextjs-aws
   State Path: .github/data/claude-code-changelog.md
   Dry Run: true

📥 Fetching CHANGELOG from Claude Code repository...
✅ Successfully fetched CHANGELOG (XXXXX bytes)
📂 Loading previous CHANGELOG state...
ℹ️  No previous state found (first run)
🔍 Detecting changes...
ℹ️  First run detected - no changes to report
💾 Updating state file...
✅ State file updated: .github/data/claude-code-changelog.md
✅ No changes detected - exiting
```

### Full Run (Creates Real Issue)

**⚠️ Warning**: This will create a real GitHub Issue in your repository.

```bash
npm run monitor:changelog
```

### Manual Testing with tsx

You can also run the script directly:

```bash
# Dry run
DRY_RUN=true npx tsx .github/scripts/monitor-claude-changelog.ts

# Full run
npx tsx .github/scripts/monitor-claude-changelog.ts
```

## GitHub Actions Testing

### Manual Trigger

1. Go to your repository on GitHub
2. Navigate to Actions → Claude Code CHANGELOG Monitor
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

### Verify Workflow Execution

After a workflow run, check:

1. **Actions tab**: Verify the workflow completed successfully
2. **State file**: Check if `.github/data/claude-code-changelog.md` was created/updated
3. **Issues**: Verify if a new Issue was created with the correct format
4. **Labels**: The Issue should have labels: `changelog`, `claude-code`, `auto-generated`

## Test Cases

- ✅ **First run**: State file created, no Issue
- ✅ **No changes**: Early exit, no Issue
- ✅ **Single version change**: Issue created with translation
- ✅ **Multiple versions**: Issue includes all new versions
- ✅ **Translation failure**: Issue created with warning message
- ✅ **TAVILY failure**: Issue created without related info section
- ❌ **GitHub API failure**: Workflow fails with clear error

## Troubleshooting

### "ANTHROPIC_API_KEY is not set"

Make sure you've set the environment variable or GitHub Secret correctly.

### "Failed to fetch CHANGELOG from remote repository"

Check your internet connection and verify the Claude Code repository is accessible.

### "Failed to create GitHub Issue"

Verify that:
- `GITHUB_TOKEN` has the correct permissions
- Workflow permissions are set to "Read and write"
- The repository allows Issue creation

### Translation Failed

If Claude API translation fails, the Issue will still be created with a warning message. The original English diff will always be included.

### TAVILY Search Failed

TAVILY search is optional. If it fails, the Issue will be created without the "Related Information" section.

## File Structure

```
.github/
├── data/
│   ├── README.md                        # Documentation for state files
│   └── claude-code-changelog.md         # Auto-generated state file
├── scripts/
│   ├── README.md                        # This file
│   └── monitor-claude-changelog.ts      # Main monitor script
└── workflows/
    └── claude-changelog-monitor.yml     # GitHub Actions workflow
```

## Security & Compliance

- ✅ API keys stored in GitHub Secrets (encrypted)
- ✅ Minimal workflow permissions (`contents: write`, `issues: write`)
- ✅ Error handling follows `.claude/rules/api-error-handling.md`
- ✅ Input validation follows `.claude/rules/api-input-validation.md`
- ✅ Type safety follows `.claude/rules/lambda-type-safety.md`
- ✅ No sensitive data in logs or Issue bodies

## Monitoring Schedule

The workflow runs automatically on:
- **Monday** at 7:00 AM JST (Sunday 22:00 UTC)
- **Friday** at 7:00 AM JST (Thursday 22:00 UTC)

You can also trigger it manually at any time.

## Issue Format

Created Issues follow this format:

```markdown
## 🚀 Claude Code CHANGELOG 更新検知

**検出日時:** YYYY-MM-DD HH:MM:SS JST
**検出バージョン:** X.Y.Z → A.B.C

---

### 📝 変更内容(原文)

[Diff in English]

---

### 🇯🇵 日本語翻訳

[Japanese translation by Claude]

---

### 🔍 関連情報

[TAVILY search results - optional]

---

**自動生成**: GitHub Actions
**ソース**: Claude Code CHANGELOG
```

## Future Enhancements

Potential improvements for future versions:

- Slack/Discord webhook notifications
- Executive summary generation
- Historical tracking dashboard
- RSS feed generation
- Dependency analysis (correlate with project's Claude Code version)
- Email notifications
- Customizable translation languages

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the GitHub Actions logs
3. Create an issue in this repository

## Related Files

- Type definitions: `types/changelog-monitor.ts`
- GitHub workflow: `.github/workflows/claude-changelog-monitor.yml`
- State file: `.github/data/claude-code-changelog.md`

2026年に入ってからも日々Claudeがアップデートされていますね。

https://github.com/anthropics/claude-code

https://code.claude.com/docs/en/best-practices

## Claude Codeのアップデートを追うにあたり

https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md

ここ最近、Claudeのちらっと見たりしていますが、2週間くらい放っておくと、すごい数のアップデートがされているタイミングもあります。

その情報を追うとなった場合に、何か習慣をつけないと、ざっくり追うことになり、どんどん面倒になってきます。
私は、業務ではClaude Codeを利用する機会はありません。個人で遊んでいるときに、利用しています。

その状況で、そんな最新バージョンまで追う必要は正直ないかもしれませんが、あちこちで有効利用されている

今回は、その習慣というか、

## やってみたこと

Claudeのアップデートを検知して、その差分をGithubのIssue化することです。
その差分に対して、自身の`.claude`ディレクトリで改善ポイントがないか提案をしてもらう

具体的な作業としては、単純にワークフローを1つ用意しただけです。

また、ワークフロー作成以外に必要な作業は2つです。
- `.github/data/claude-code-changelog.md`を用意（ファイル名はわかれば何でも）
- 作成したファイルに、現在[changelog.md](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)の内容をペースト

## ワークフロー作成

組んだワークフローで行う処理は以下の通りです。
4が核をなる処理です。
1. 起動ログと設定内容の表示
1. CHANGELOG の取得と差分検出
1. 変更がなければ即終了
1. CHANGELOG 更新内容の処理と Issue 作成
1. 成功結果の表示と正常終了

作成時ですが、それこそ、Claudeに聞けば土台はすぐに完成しちゃいます。
細かい部分は何度かやりとりを重ねてブラッシュアップしました。

```yaml
name: Claude Code CHANGELOG Monitor

on:
  schedule:
    # 火曜日 午前7時
    - cron: '0 22 * * 1'

  # 手動実行も可能に
  workflow_dispatch: {}

# Prevent concurrent runs
concurrency:
  group: changelog-monitor
  cancel-in-progress: false

permissions:
  contents: write
  issues: write

jobs:
  monitor:
    name: Monitor CHANGELOG
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run CHANGELOG monitor
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: npm run monitor:changelog

      - name: Commit state file updates
        if: success()
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"

          # Check if there are changes to commit
          if git diff --quiet .github/data/claude-code-changelog.md; then
            echo "No changes to state file"
          else
            git add .github/data/claude-code-changelog.md
            git commit -m "chore: update Claude Code CHANGELOG state [skip ci]"
            git push
          fi

      - name: Report failure
        if: failure()
        run: |
          echo "::error::CHANGELOG monitoring failed. Check logs for details."
          exit 1

```

上記がワークフロー全体ですが、セットアップ系の処理と、gitのadd,commitくらいで
主な処理は、スクリプト内で実行しています。
`Run CHANGELOG monitor`の`npm run monitor:changelog`と記載がある通りで、`package.json`で、tsファイルを実行するコマンドを用意しています。

```json:package.json
{
  "name": "learn-auth",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "next build",
    "start": "next start",
    "monitor:changelog": "tsx .github/scripts/monitor-claude-changelog.ts",
  },
}
```

## スクリプトで何をやっているのか
スクリプトとしては、700行くらいあるので、ここではリンクのみ共有とします。

### 1. 実行前の設定と前提条件の確認

1. GitHubリポジトリ情報、CHANGELOG取得先URL、状態保存パス、Dry Run有無などの設定を読み込む
2. 必須の環境変数（Anthropic APIキー、GitHubトークン）が設定されているかを検証する
3. Claude API と GitHub API のクライアントを初期化する

---

### 2. CHANGELOGの取得

4. Claude Code公式リポジトリの CHANGELOG.md をHTTP経由で取得する
5. 一時的なネットワークエラーに備え、指数バックオフ付きリトライを行う
6. 取得した内容が空でないことを確認する

---

### 3. 過去のCHANGELOG状態の読み込み

7. 前回実行時に保存された CHANGELOG の内容をローカルファイルから読み込む
8. 初回実行でファイルが存在しない場合は「過去状態なし」として扱う

---

### 4. CHANGELOG差分の検出

9. 新旧CHANGELOGからバージョン番号一覧を抽出する
10. 新しいCHANGELOGにのみ存在するバージョンを「新規リリース」として判定する
11. 新規バージョンが存在する場合のみ、差分（diff）を生成する
12. 差分はGit形式で、人が読める形に整形される

---

### 5. CHANGELOG状態ファイルの更新

13. 差分の有無にかかわらず、最新のCHANGELOG内容を状態ファイルとして保存する
14. 初回実行時でも状態ファイルが必ず作成されるようにする

---

### 6. 変更がない場合の早期終了

15. 新しいバージョンが検出されなかった場合、以降の処理を行わず正常終了する

---

### 7. CHANGELOG差分の日本語翻訳

16. 検出されたCHANGELOG差分をClaude APIに送信する
17. 技術用語・Markdown構造・URL・バージョン番号を維持したまま日本語翻訳を行う
18. 翻訳に失敗した場合はエラー情報を保持する

---

### 8. `.claude` ディレクトリの読み取り

19. プロジェクト内の `.claude` ディレクトリを解析する
20. 以下の構成要素を収集する

* settings.json（権限設定）
* agents（エージェント定義）
* rules（セキュリティ・運用ルール）
* commands（Kiroコマンド）
* skills（自動化スキル）

21. 各領域は個別にエラーハンドリングされ、欠損していても処理全体は継続される

---

### 9. `.claude` 構成の整理と整形

22. 読み取った `.claude` の内容を、人間とLLMが理解しやすい構造化テキストに整形する
23. 重要度の高いルール類は全文、それ以外は行数制限付きで要約する

---

### 10. CHANGELOGに基づく改善点分析

24. CHANGELOG差分と現在の `.claude` 構成を組み合わせたプロンプトを作成する
25. Claude APIにより以下の観点で分析を行う

* 新機能対応
* 非推奨・廃止機能の整理
* 権限設定の見直し
* エージェント起動条件の最適化
* ルール優先度の調整

26. 各ファイル単位で「改善内容」または「改善不要」の理由を明示した提案を生成する
27. 最後に優先度付きの総合推奨事項をまとめる

---

### 11. GitHub Issue本文の生成

28. 検出された新バージョンを含むIssueタイトルを生成する
29. Issue本文に以下を順番に構成する

* 検出日時とバージョン情報
* CHANGELOG差分（原文）
* 日本語翻訳
* `.claude` ディレクトリ分析結果

30. 翻訳や分析に失敗した場合は、その旨と手動確認ポイントを明記する

---

### 12. GitHub Issueの作成

31. Dry Runモードの場合はIssueを作成せず、内容のみをログ出力する
32. 通常モードではGitHub APIを用いてIssueを作成する
33. ラベル（changelog / claude-code / auto-generated）を自動付与する

---

### 13. 処理結果の出力と終了

34. 正常終了時は、検出されたバージョンとIssue URLをログに出力する
35. エラー発生時は処理を中断し、失敗ステータスで終了する

---
