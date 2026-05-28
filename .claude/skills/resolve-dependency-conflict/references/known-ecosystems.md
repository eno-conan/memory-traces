# 既知のエコシステム詳細

以下のパッケージグループは**バージョン同期が必須**です。個別にアップグレードすると競合が発生します。

## Vitest

| パッケージ | pin方式 | 備考 |
|-----------|---------|------|
| `vitest` | exact pin | コアパッケージ。完全一致のpeer depを要求 |
| `@vitest/ui` | exact pin | vitest と完全一致が必要 |
| `@vitest/coverage-v8` | exact pin | vitest と完全一致が必要 |
| `@vitest/browser-playwright` | exact pin | vitest と完全一致が必要 |

**例**:
```json
{
  "vitest": "4.0.18",
  "@vitest/ui": "4.0.18",
  "@vitest/coverage-v8": "4.0.18"
}
```

## Storybook

| パッケージ | pin方式 | 備考 |
|-----------|---------|------|
| `storybook` | exact pin | コアパッケージ |
| `@storybook/react` | caret可 | コアとメジャーが一致していればOK |
| `@storybook/nextjs` | caret可 | |
| `@storybook/addon-*` | caret可 | |
| `eslint-plugin-storybook` | caret可 | Storybook本体とは独立 |
| `@chromatic-com/storybook` | caret可 | |

**例**:
```json
{
  "storybook": "8.5.0",
  "@storybook/react": "^8.5.0",
  "@storybook/nextjs": "^8.5.0"
}
```

## AWS SDK v3

| パッケージ | pin方式 | 備考 |
|-----------|---------|------|
| `@aws-sdk/*` | caret可 | メジャーバージョン内で互換性あり |

**例**:
```json
{
  "@aws-sdk/client-s3": "^3.700.0",
  "@aws-sdk/client-lambda": "^3.700.0"
}
```

## Playwright

| パッケージ | pin方式 | 備考 |
|-----------|---------|------|
| `playwright` | 同一バージョン推奨 | ブラウザバイナリとの互換性 |
| `@playwright/test` | 同一バージョン推奨 | playwright と一致が必要 |

**例**:
```json
{
  "playwright": "1.50.0",
  "@playwright/test": "1.50.0"
}
```

## dependabot.yml グループ設定例

```yaml
groups:
  vitest:
    patterns:
      - "vitest"
      - "@vitest/*"
  storybook:
    patterns:
      - "storybook"
      - "@storybook/*"
      - "eslint-plugin-storybook"
      - "@chromatic-com/storybook"
  aws-sdk:
    patterns:
      - "@aws-sdk/*"
  playwright:
    patterns:
      - "playwright"
      - "@playwright/*"
```
