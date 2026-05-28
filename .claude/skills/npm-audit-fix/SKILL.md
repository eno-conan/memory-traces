---
name: npm-audit-fix
description: |
  npm audit で検出された脆弱性を、破壊的変更なしに overrides で修正します。
  「npm audit」「脆弱性」「vulnerability」「セキュリティ修正」などの発話で使用。
  Use when npm audit reports vulnerabilities that cannot be fixed with npm audit fix.
compatibility: |
  npm, package.json が存在する環境。
metadata:
  author: learn-auth-nextjs-aws
  version: 1.0.0
---

# npm audit 脆弱性修正（overrides 方式）

`npm audit fix --force` による破壊的ダウングレードを避け、`package.json` の `overrides` で子孫依存を強制上書きして修正します。

## CRITICAL

1. **`npm audit fix --force` は絶対に使わない** - メジャーバージョンのダウングレードを引き起こす
2. **`overrides` で修正バージョンを固定する** - 直接依存していない子孫パッケージも上書き可能
3. **修正後は必ず `npm audit` で `found 0 vulnerabilities` を確認する**

## 基本方針

`npm audit` で脆弱性が検出された場合、根本原因パッケージに対して以下を行う：

```json
// package.json
"overrides": {
  "脆弱性のあるパッケージ名": "修正済みバージョン"
}
```

## Instructions

### Step 1: 脆弱性の把握

```bash
npm audit
```

以下を確認する：
- **severity**: moderate / high / critical
- **根本原因パッケージ**（"fix available via ..." の行に記載）
- **影響を受けるバージョン範囲**
- **修正済みバージョン**（"fix available via npm audit fix --force" に記載のバージョンを参考に、npmレジストリで安全な最小バージョンを調べる）

### Step 2: 修正バージョンの確認

```bash
npm show <package-name> versions --json
```

脆弱性範囲外で最小の安定バージョンを選ぶ（不必要に最新にしない）。

### Step 3: package.json の overrides を更新

```json
"overrides": {
  "既存の設定はそのまま残す": "...",
  "新たに固定するパッケージ": "修正済みバージョン"
}
```

### Step 4: npm install と検証

```bash
npm install
npm audit
```

`found 0 vulnerabilities` を確認する。

## 既知の修正履歴

このプロジェクトで過去に対応した脆弱性と overrides 設定の例：

| パッケージ | 脆弱性種別 | 影響を受けるバージョン | 修正バージョン | 経由パッケージ |
|---|---|---|---|---|
| `fast-xml-parser` | Entity Expansion (high) | 4.0.0-beta.3〜5.5.6 | `5.5.8` | `aws-amplify` など |
| `flatted` | Prototype Pollution (high) | <=3.4.1 | `3.4.2` | `@vitest/ui` |

### 現在の overrides 設定（2026-03-21 時点）

```json
"overrides": {
  "@xstate/react": {
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "fast-xml-parser": "5.5.8",
  "flatted": "3.4.2",
  "minimatch": "10.2.3"
}
```

## なぜ --force を使わないか

```
# npm audit fix --force の危険な例
aws-amplify@6.x.x → aws-amplify@5.3.33（メジャーダウングレード）
@vitest/ui@4.1.0  → @vitest/ui@4.0.18（ダウングレード）
```

直接の依存先（aws-amplify, @vitest/ui）ではなく、**その子孫**（fast-xml-parser, flatted）だけを上書きするのが正しい対処。

## IMPORTANT

- `overrides` は npm v8.3+ で使用可能（yarn は `resolutions`）
- `overrides` は完全一致で適用されるため、semver range は使えない（正確なバージョン番号を指定）
- 将来 dependabot が `fast-xml-parser` や `flatted` を直接依存として更新した場合は `overrides` は不要になる
