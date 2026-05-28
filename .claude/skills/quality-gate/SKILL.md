---
name: quality-gate
description: |
  コミット/デプロイ前の総合品質ゲートを実行します（TypeScript, Terraform, テスト, ビルド検証）。
  「コミット前チェック」「デプロイ前検証」「全チェック実行」「品質ゲート」などの発話で使用。
  Do NOT use for individual checks - use typescript-quality-check or terraform-quality-check instead.
compatibility: |
  npm test, npm run build が実行可能な環境。
  TypeScript, ESLint がインストール済みであること。
metadata:
  author: learn-auth-nextjs-aws
  version: 1.0.0
---

# Comprehensive Quality Gate

コミット/デプロイ前のすべての重要なチェックを一括実行します。

## CRITICAL

1. **個別チェックが失敗しても全チェックを継続する** - 全体像を把握するために全結果を収集する
2. **結果を正確に報告する** - 成功/失敗を偽装しない
3. **Performance Audit はオプション** - 必須チェック（Check 1-4）がすべて通過した場合のみ実行を提案する

## Instructions

すべてのチェックを順番に実行し、個別の失敗があっても継続する。

### Check 1: TypeScript Quality

typescript-quality-check スキルの手順に従って実行:

```bash
npx tsc --noEmit --pretty
npx eslint . --max-warnings 0
npx eslint app/api/**/*.ts --rule '@typescript-eslint/no-explicit-any: error'
```

結果を記録: PASSED または FAILED（エラー数付き）

### Check 2: Terraform Quality (if .tf files exist)

Terraformファイルの存在を確認:

```bash
ls infra-aws/*.tf 2>/dev/null
```

存在する場合、terraform-quality-check スキルの手順に従って実行:

```bash
terraform version
cd infra-aws/ && terraform fmt -check -recursive
cd infra-aws/ && terraform validate
```

結果を記録: PASSED, FAILED, または SKIPPED（.tfファイルなし）

### Check 3: Unit Tests

全ユニットテストを実行:

```bash
npm test
```

結果を記録: PASSED または FAILED（失敗テスト数付き）

### Check 4: Build Verification

アプリケーションのビルドを検証:

```bash
npm run build
```

結果を記録: PASSED または FAILED

### Check 5: Performance Audit (Optional)

Check 1-4がすべて通過した場合のみ、ユーザーに実行を提案:

```bash
npm run build
npm run start &
SERVER_PID=$!
sleep 5
npx lighthouse http://localhost:3000 --preset=desktop --only-categories=performance --output=json --output-path=./lighthouse-report.json
kill $SERVER_PID 2>/dev/null || true
```

評価基準:
- Performance Score: 90以上
- First Load JS: 200KB未満
- LCP: 2.5s未満
- FID: 100ms未満
- CLS: 0.1未満

## Final Gate Report

```
=== Quality Gate Summary ===
TypeScript Quality:    [PASSED/FAILED] [details]
Terraform Quality:     [PASSED/FAILED/SKIPPED] [details]
Unit Tests:            [PASSED/FAILED] [details]
Build Verification:    [PASSED/FAILED] [details]
Performance Audit:     [PASSED/FAILED/SKIPPED] [details]

Overall Status: [PASSED/FAILED]
```

- 全チェック通過: "Quality gate PASSED. Ready to commit/deploy."
- 失敗あり: "Quality gate FAILED. Fix the following issues:" と各失敗チェックのアクション可能な次のステップを列挙
