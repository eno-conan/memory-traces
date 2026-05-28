---
name: typescript-quality-check
description: |
  TypeScript型チェック、ESLint、API型安全性を包括的に検証します。
  「型チェック」「ESLintを実行」「品質チェック」「TypeScript検証」「型安全性を確認」などの発話で使用。
  対象: **/*.ts, **/*.tsx
compatibility: |
  npx tsc, npx eslint が実行可能な環境。
  package.json に eslint, typescript が必要。
metadata:
  author: learn-auth-nextjs-aws
  version: 1.0.0
---

# TypeScript Quality Check

TypeScript品質の包括的検証を実行します。

## CRITICAL

1. **型チェックエラーは絶対にスキップしない** - `tsc --noEmit` が失敗した場合、即座に報告する
2. **`any` 型の検出は厳格に** - API routes内の明示的 `any` は全件報告する
3. **自動修正は確認後のみ** - `eslint --fix` はユーザー承認を得てから実行する

## Instructions

以下の手順を順番に実行:

### Step 1: Type Check

TypeScriptコンパイラをチェックのみモードで実行:

```bash
npx tsc --noEmit --pretty
```

- **成功**: "Type check passed" と報告
- **エラー**: 各エラーを `file:line` 付きで報告

### Step 2: ESLint Check (Strict Mode)

ESLintをゼロ警告モードで実行:

```bash
npx eslint . --max-warnings 0
```

- **成功**: "ESLint check passed" と報告
- **エラー**:
  1. ユーザーに確認: "ESLint found errors. Should I attempt auto-fix?"
  2. 承認後に `npx eslint . --fix` を実行
  3. 修正不可能な問題を file:line 付きで報告

### Step 3: Verify No 'any' in API Routes

APIルートでの明示的 `any` 使用をチェック:

```bash
npx eslint app/api/**/*.ts --rule '@typescript-eslint/no-explicit-any: error'
```

- **成功**: "No explicit 'any' types in API routes" と報告
- **違反**: 各違反を file:line 付きで報告し、適切な型定義を提案

### Step 4: Lambda Type Safety Verification

型アノテーションなしの JSON.parse 使用を検索:

```bash
grep -r "JSON.parse.*Payload" app/ --include="*.ts" -n
```

各マッチについて:
- 該当行または後続3行に `: SomeResponse` または `as SomeResponse` が含まれるか確認
- **型アノテーション欠落**: "Missing type annotation at `file:line`" と報告
- **全て型付き**: "All Lambda responses have explicit types" と報告

## Final Report

```
Total checks performed: 4
Passed: [count]
Failed: [count]
```

- 全チェック通過: "All TypeScript quality checks PASSED."
- 失敗あり: "TypeScript quality check FAILED. Fix issues before committing."

## Troubleshooting

### `tsc: command not found`
TypeScriptがインストールされていません:
```bash
npm install --save-dev typescript
```

### ESLintが大量の警告を出力
`--max-warnings 0` で失敗するが致命的でない場合:
1. `.eslintrc` で特定ルールの警告レベルを調整
2. 段階的に修正する計画を立てる
