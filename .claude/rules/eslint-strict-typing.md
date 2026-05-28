---
paths:
  - "**/*.{ts,tsx}"
  - "eslint.config.mjs"
---

# ESLint厳格モード & 型安全ガイドライン

本プロジェクトでは ESLint ルールをすべて `error` レベルで運用する。
`npm run lint` で 0 errors / 0 warnings がマージ条件。

## 本番コードのルール

### `any` 型の禁止

`any` 型の使用は一切禁止。以下のルールがすべて `error`:

- `@typescript-eslint/no-explicit-any` - 明示的な `any` 禁止
- `@typescript-eslint/no-unsafe-assignment` - `any` からの代入禁止
- `@typescript-eslint/no-unsafe-member-access` - `any` へのメンバーアクセス禁止
- `@typescript-eslint/no-unsafe-call` - `any` の関数呼び出し禁止
- `@typescript-eslint/no-unsafe-return` - `any` の返却禁止

### `any` を返すAPIへの対処法

`response.json()`, `JSON.parse()`, 外部ライブラリなど `any` を返す箇所には、必ず `as` 型アサーションを付ける。

```typescript
// NG: any が伝播する
const data = await response.json();
const parsed = JSON.parse(text);

// OK: 明示的に型を指定
const data = (await response.json()) as MyResponseType;
const parsed = JSON.parse(text) as MyDataType;
```

### 型定義の原則

- 外部APIのレスポンスには必ずインターフェースを定義する
- ネストしたオブジェクトも個別にインターフェースを切る
- 列挙値が明確な場合はユニオン型を使用（`'active' | 'completed'`）
- 配列の要素型を必ず指定する（`(item: MyType) =>` not `(item: any) =>`）

### `console.log` の禁止

`no-console` は `error` レベル。許可されるのは `console.warn` と `console.error` のみ。

```typescript
// NG
console.log('debug:', data);

// OK
console.warn('位置情報取得成功:', location);
console.error('API呼び出し失敗:', error);
```

ロガーユーティリティ（`app/utils/logger.ts`）など、意図的に `console.log` を使用する必要がある場合のみ、行単位の `eslint-disable-next-line` を許可する。

```typescript
// OK: ロガー関数内での意図的な使用
// eslint-disable-next-line no-console
console.log(JSON.stringify({ level: 'INFO', message, context }));
```

## テストファイルのルール

`eslint.config.mjs` でテストファイル（`**/__tests__/**`, `**/*.test.*`, `**/*.spec.*`）には以下3ルールを `off` に設定している:

- `@typescript-eslint/no-unsafe-assignment`
- `@typescript-eslint/no-unsafe-member-access`
- `@typescript-eslint/no-unsafe-call`

### 理由

vitest/jest のモック機構では以下のパターンが構造的に `any` を返す:

- `response.json()` (NextResponseのモック)
- `spy.mock.calls` (スパイの呼び出し記録)
- `JSON.parse()` (ログ出力の検証)
- `expect.objectContaining()` (マッチャー)

全箇所に型アサーションを追加するとテストの可読性が大きく低下するため、設定レベルで緩和する。

### テストファイルでも守るべきルール

テストファイルであっても以下は `error` のまま:

- `@typescript-eslint/no-explicit-any` - コールバック引数の `any` は具体的な型を使う
- `@typescript-eslint/no-unsafe-return` - テスト関数の戻り値は型安全に
- `@typescript-eslint/no-unused-vars` - 未使用変数は削除
- `no-console` - テスト内でも `console.log` は使わない
- `prefer-const` - `let` より `const`

## `eslint-disable` の使用基準

### ファイルレベルの `eslint-disable` は原則禁止

テストファイルのモック起因ルールは `eslint.config.mjs` のオーバーライドで対応済み。
個別テストファイルに `/* eslint-disable */` を追加する必要はない。

### 行レベルの `eslint-disable-next-line` は限定的に許可

以下のケースのみ許可:

1. **ロガーユーティリティでの `console.log`**: `eslint-disable-next-line no-console`
2. **型定義が不可能な外部ライブラリ**: コメントで理由を明記すること

```typescript
// OK: 理由が明確
// eslint-disable-next-line no-console -- ロガー関数の中核機能
console.log(JSON.stringify({ level: 'INFO', ... }));

// NG: 理由なしの抑制
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = getSomething();
```
