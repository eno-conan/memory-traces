---
name: resolve-dependency-conflict
description: |
  npm peer dependency競合（ERESOLVE）エラーを診断し、
  エコシステム単位で一括アップグレードを実施します。
  「ERESOLVE エラー」「依存関係競合」「Vercelビルド失敗」
  「dependabot PRがコンフリクト」「peer dependency」などの発話で使用。
  Use when encountering peer dependency conflicts from Vercel builds or dependabot.
compatibility: |
  npm, package.json が存在する環境。
  WebFetch ツールでnpmレジストリへのアクセスが可能。
metadata:
  author: learn-auth-nextjs-aws
  version: 1.0.0
---

# npm依存関係の競合解決

Vercelビルドやdependabot PRで発生する`ERESOLVE`エラーを診断し、エコシステム単位で一括アップグレードを実施します。

## CRITICAL

1. **`--force` や `--legacy-peer-deps` は絶対に使わない** - 問題を隠蔽するだけで解決にならない
2. **ダウングレードは絶対禁止** - 全パッケージは現在のバージョン以上にする
3. **エコシステム内は一括アップグレード** - 個別アップグレードは競合の原因

## 既知のエコシステム

以下のパッケージグループはバージョン同期が必須です。詳細は [references/known-ecosystems.md](references/known-ecosystems.md) を参照。

| エコシステム | pin方式 |
|-------------|---------|
| Vitest | exact pin（完全一致peer dep） |
| Storybook | コアはexact pin、addonはcaret可 |
| AWS SDK v3 | caret可（メジャー内互換） |
| Playwright | 同一バージョン推奨 |

## Instructions

### Step 1: エラーログの収集と分類

エラーソースを特定:
- **Vercelビルドログ**: `docs/vercel/` 配下のログファイル
- **ローカル**: `npm install` を実行してERESOLVEエラーを再現

エラーから以下を抽出:
1. 競合パッケージ名（"While resolving:" の行）
2. 要求されているpeerバージョン（"peer ... from ..." の行）
3. 実際にインストールされているバージョン（"Found:" の行）
4. 競合の原因パッケージ（"Conflicting peer dependency:" の行）

### Step 2: 現在のバージョン確認

`package.json` の `dependencies` と `devDependencies` を読み取り、関連パッケージのバージョンを一覧化。

確認ポイント:
- `^` 付き（caret range）か、exact pinか
- コアパッケージとaddonパッケージのバージョン差異

### Step 3: エコシステム分析

競合パッケージを「既知のエコシステム」表と照合:
- **該当あり**: エコシステムの全パッケージを同一バージョンにアップグレード
- **該当なし**: npmレジストリでpeer dependency要件を確認

### Step 4: アップグレード戦略の決定

1. ダウングレードは絶対禁止
2. エコシステム内は一括アップグレード
3. pin方式: exact peer dep要求 → exact pin、semver互換 → caret range可
4. `--force` や `--legacy-peer-deps` は使わない

### Step 5: package.json修正

エコシステム内の全パッケージを同時に変更し、変更前後のdiffを確認。

### Step 6: lock file再生成と検証

```bash
rm package-lock.json
rm -rf node_modules
npm install
npm run type-check
npm run build
```

### Step 7: 再発防止

`.github/dependabot.yml` にエコシステム単位の `groups` 設定を確認・追加。

## Final Report

```
Dependency Conflict Resolution

Errors: {N} ERESOLVE -> 0
Ecosystems: {Vitest, Storybook, ...}
Packages changed: {N}

Version Changes:
- {package}: {old} -> {new}

Verification:
- npm install: PASSED/FAILED
- type-check: PASSED/FAILED
- build: PASSED/FAILED

Prevention:
- dependabot groups: configured/added/not needed
```

## Examples

### Example: Vitest ecosystem conflict

**入力**: `/resolve-dependency-conflict`

**エラー**:
```
npm ERR! ERESOLVE could not resolve
npm ERR! While resolving: @vitest/ui@4.0.17
npm ERR! Found: vitest@4.0.18
```

**解決**:
```diff
- "vitest": "^4.0.17",
- "@vitest/ui": "^4.0.17",
+ "vitest": "4.0.18",
+ "@vitest/ui": "4.0.18",
```

## IMPORTANT

- dependabotはパッケージを個別にアップグレードするため、エコシステム内で競合が発生しやすい
- Vercelは `npm install` を strict mode で実行するため、ローカルで `--legacy-peer-deps` を使っている場合でもVercelでは失敗する
- 競合が複数エコシステムにまたがる場合は、1つのPR/コミットで一括修正する
