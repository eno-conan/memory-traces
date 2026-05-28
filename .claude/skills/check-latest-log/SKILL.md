---
name: check-latest-log
description: |
  npm run dev のエラーログを分析し、具体的な修正案を提示します。
  「ログ分析」「エラーを見て」「デバッグしたい」「開発サーバーが起動しない」などの発話で使用。
  対象: logs/*.log
compatibility: |
  プロジェクトに logs/ ディレクトリが必要。
  Bash環境（ls, grep コマンド）。
metadata:
  author: learn-auth-nextjs-aws
  version: 1.0.0
---

# Check Latest Development Log

開発ログ分析とデバッグ支援を実行します。

## CRITICAL

1. **ログが見つからない場合は即座に報告する** - 推測でエラーを作成しない
2. **file:line 参照を必ず含める** - 曖昧な指摘はしない
3. **最も重要なエラーから優先的に報告する**

## Instructions

以下の手順を順番に実行:

### Step 1: Find Latest Log File

`logs/` ディレクトリから最新のログファイルを特定:

```bash
ls -t logs/*.log 2>/dev/null | head -n 1
```

- **ログファイルが見つからない場合**: "No log files found in logs/ directory. Run `npm run dev` first." と報告して終了
- **ログファイルが見つかった場合**: ファイル名を報告し、Step 2 へ進む

### Step 2: Read Log Content

最新ログファイルの全内容を読み取る。

### Step 3: Error Analysis

以下のパターンを検索:

1. **Stack traces**: エラーメッセージと file:line の位置
2. **Compilation errors**: TypeScriptエラー、モジュール解決失敗
3. **Runtime errors**: 未処理例外、Promiseの拒否
4. **Warning patterns**: 非推奨警告、設定問題
5. **Failed requests**: APIエラー、ネットワーク障害

各エラーについて:
- エラーの種類とメッセージを抽出
- file:line の位置を特定
- 根本原因を判定
- 関連するコンテキスト（タイムスタンプ、リクエストパス等）を記録

### Step 4: Root Cause Identification

検出されたエラーに基づき、根本原因を特定:

- **Module/Import Issues**: 依存関係の欠落、パスの誤り
- **Type Errors**: TypeScriptコンパイルエラー
- **Configuration Issues**: Next.js設定、環境変数の問題
- **Runtime Logic Errors**: null参照、undefined変数
- **API/Lambda Errors**: バックエンド統合の失敗

### Step 5: Suggested Fixes

具体的な修正案を提示:

1. **即座に実行可能なアクション**: すぐに適用できる修正
2. **ファイル変更**: 具体的なコード修正（file:line 付き）
3. **検証手順**: 修正の確認方法

## Final Report

以下の形式でサマリーを提示:

```
Log file: [filename]
Errors found: [count]
Primary issue: [description]
Suggested fixes: [summary]
```

- エラー検出時: "Development errors detected. Review suggested fixes above."
- エラーなし: "No errors found in latest log."

## Examples

### Example 1: TypeScript型エラーの検出

**ユーザー入力**: `/check-latest-log`

**出力例**:
```
Analyzing log: dev-2025-02-11-143022.log

Development errors detected

Error 1: Type 'string | undefined' is not assignable to type 'string'
  File: app/api/travel-entries/route.ts:45
  Fix: Add null check before accessing userId

Suggested fix:
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
```

## Notes

- **アクション可能な洞察**に集中する - file:line 参照と具体的なコード変更を提供
- **最も重要なエラー**を優先する
- 関連するエラーはグループ化する
- 型エラーが疑われる場合は `/typescript-quality-check` の実行を提案する
