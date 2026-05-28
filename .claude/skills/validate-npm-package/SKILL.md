---
name: validate-npm-package
description: |
  npmパッケージの鮮度とメンテナンス状況を検証します。
  「パッケージを調査」「npmパッケージの最終更新を確認」「このパッケージは安全か」
  「パッケージの採用判断」などの発話で使用。
  Use before adopting new npm packages to avoid unmaintained dependencies.
compatibility: |
  WebFetch ツールが利用可能な環境。
  npmjs.com へのネットワークアクセス。
metadata:
  author: learn-auth-nextjs-aws
  version: 1.0.0
---

# NPM Package Validation

新しいnpmパッケージを採用する前に、パッケージの鮮度とメンテナンス状況を検証します。

## CRITICAL

1. **1年以上更新なしのパッケージは原則非推奨** - セキュリティリスクを明示する
2. **数値に基づく判断を行う** - 主観的な評価を避ける
3. **代替パッケージが存在する場合は必ず提案する**

## Instructions

パッケージ名を受け取ったら、以下の手順で検証を実行:

### Step 1: パッケージ情報の取得

WebFetch を使用して npmjs.com からパッケージ情報を取得:

```
WebFetch(
  url: "https://www.npmjs.com/package/{package-name}",
  prompt: "Extract the following information: 1) Last publish date, 2) Weekly downloads count"
)
```

### Step 2: 最終更新日の確認

| 期間 | 評価 |
|------|------|
| 6ヶ月以内 | OK - 活発にメンテナンスされている |
| 6ヶ月〜1年 | 注意 - メンテナンスが停滞の可能性 |
| 1年以上 | 非推奨 - 放置されている可能性が高い |

### Step 3: ダウンロード数の確認

| 週間ダウンロード | 評価 |
|-----------------|------|
| 10,000以上 | OK - 広く使用されている |
| 1,000〜10,000 | 注意 - 使用量は中程度 |
| 1,000未満 | 注意 - 使用量が少ない |

### Step 4: 総合評価とレポート

以下の形式で結果をレポート:

```
Package Validation: {package-name}

Last publish: {date} ({status})
Weekly downloads: {count} ({status})

Rating: Recommended / Caution / Not Recommended

Reason:
- [具体的な評価理由]

Alternatives: (非推奨の場合)
- [より新しい/メンテナンスされている代替パッケージを提案]
```

## Examples

### Example 1: 活発なパッケージ

**入力**: `/validate-npm-package zod`

**出力**:
```
Package Validation: zod

Last publish: 2025-01-15 (OK)
Weekly downloads: 12,500,000 (OK)

Rating: Recommended
Reason: 活発にメンテナンスされており、広く使用されているバリデーションライブラリ
```

### Example 2: 放置されたパッケージ

**入力**: `/validate-npm-package moment`

**出力**:
```
Package Validation: moment

Last publish: 2022-07-06 (Not Recommended)
Weekly downloads: 18,000,000 (OK)

Rating: Caution
Reason: ダウンロード数は多いが2年以上更新なし。公式にメンテナンスモードを宣言済み。
Alternatives: date-fns, dayjs, luxon
```

## IMPORTANT

- 最終更新日を**優先的に**確認すること（両基準を同時に満たす必要はない）
- 古いパッケージは脆弱性を含む可能性が高い
- メンテナンス終了パッケージは将来的な互換性問題を引き起こす可能性がある
