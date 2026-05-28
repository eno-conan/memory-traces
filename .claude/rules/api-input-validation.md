---
paths:
  - "app/api/**/*.ts"
---

# API 入力バリデーション規約（必須）

## 対象範囲
本ルールは、以下すべての外部入力を受け取る API 実装に適用される。

- Request Body（`req.json()`）
- Query Parameters
- Path Parameters
- Headers

---

## 絶対ルール（違反禁止）

### 1. 外部入力を信頼してはならない
API が受け取る入力は **すべて不正である前提**で扱うこと。

❌ 禁止例：
```ts
const body = await req.json();
service.execute(body);
````

✅ 必須：

```ts
const body = await req.json();
const parsed = schema.parse(body);
service.execute(parsed);
```

---

### 2. バリデーションはビジネスロジックより前に行う

以下の順序違反を禁止する。

* DB アクセス前
* 外部 API 呼び出し前
* 副作用発生前（書き込み・送信など）

---

### 3. TypeScript の型はバリデーションではない

TypeScript の型定義は **コンパイル時保証のみ**であり、
ランタイムの入力検証にはならない。

```ts
type Input = { id: string }; // これだけでは不十分
```

---

### 4. 不正な入力は必ず 4xx で拒否する

以下は **成功レスポンスを返してはならない**。

* 必須項目欠落
* 型不一致
* フォーマット不正
* 想定外の値

推奨ステータス：

* **400 Bad Request**（基本）
* **422 Unprocessable Entity**（意味的に不正な場合）

---

### 5. バリデーションエラーを catch に入れてはならない

入力不正は **想定内エラー**であり、`catch` による一括処理を禁止する。

❌ 禁止：

```ts
try {
  const body = await req.json();
  const parsed = schema.parse(body);
} catch {
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
```

---

## 実装前セルフチェック（必須）

* [ ] すべての外部入力を検証している
* [ ] バリデーションは最初に実行されている
* [ ] 型定義に頼っていない
* [ ] 入力不正は 4xx で返している

---

## このルールの背景

> **ネットワーク境界で型安全性は失われる**

入力バリデーション欠如は以下を招く：

* 想定外のクラッシュ
* セキュリティ脆弱性
* データ破壊
* 不正リクエストの温存

---

## 運用上の扱い

本ルール違反は以下として扱う：

* セキュリティ欠陥
* マージブロッカー
* 修正必須
