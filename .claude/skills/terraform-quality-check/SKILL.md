---
name: terraform-quality-check
description: |
  Terraform設定のフォーマットと妥当性を検証します。
  「Terraform検証」「tfファイルのチェック」「インフラ品質確認」「terraform validate」などの発話で使用。
  対象: **/*.tf
  Do NOT use for AWS console operations or general infrastructure questions.
compatibility: |
  Terraform v1.x が必要。
  infra-aws/ ディレクトリ内にTerraformファイルが存在すること。
metadata:
  author: learn-auth-nextjs-aws
  version: 1.0.0
---

# Terraform Quality Check

Terraform設定の検証を実行します。

## CRITICAL

1. **validation error時の自動修正は禁止** - "Fix validation errors before deployment. These errors are too risky to auto-fix." と報告して停止する
2. **Terraform v1.x 必須** - バージョンが異なる場合は即座に停止する
3. **フォーマットの自動修正はユーザー確認後のみ**

## Instructions

以下の手順を順番に実行:

### Step 1: Version Verification

Terraformバージョンが1.xであることを確認:

```bash
terraform version
```

- **v1.x**: "Terraform version is compatible (v1.x)" と報告
- **それ以外**: "Terraform version mismatch. Expected v1.x" と報告して停止

### Step 2: Format Check

全Terraformファイルのフォーマットを確認:

```bash
cd infra-aws/
terraform fmt -check -recursive
```

- **成功（出力なし）**: "All Terraform files are properly formatted" と報告
- **未フォーマットファイル検出**:
  1. ユーザーに確認: "Found unformatted Terraform files. Should I run auto-format?"
  2. 承認後に `terraform fmt -recursive` を実行
  3. フォーマット済みファイルを報告

### Step 3: Configuration Validation

Terraform設定の構文と論理を検証:

```bash
cd infra-aws/
terraform validate
```

- **成功**: "Terraform configuration is valid" と報告
- **エラー**: 各エラーをコンテキスト付きで報告して停止

## Final Report

```
Total checks performed: 3
Passed: [count]
Failed: [count]
```

- 全チェック通過: "All Terraform quality checks PASSED. Ready for deployment."
- 失敗あり: "Terraform quality check FAILED. Fix issues before deployment."

## Troubleshooting

### `terraform: command not found`
Terraformがインストールされていません:
```bash
# tfenv を使用する場合
tfenv install 1.x.x
tfenv use 1.x.x
```

### `terraform validate` が provider 関連エラーを出力
`terraform init` が未実行の可能性:
```bash
cd infra-aws/
terraform init
```
