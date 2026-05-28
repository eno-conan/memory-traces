---
paths:
  - "app/api/**/*.ts"
---

# API エラーハンドリング規約（必須）

## 対象範囲
本ルールは、以下すべての API 実装に適用される。

- Next.js Route Handler（`app/api/**/route.ts`）
- HTTP レスポンスを返す Server Action
- HTTP セマンティクスを持つサーバー処理

---

## 絶対ルール（違反禁止）

### 1. catch でエラーを握りつぶしてはならない
`try-catch` の `catch` 節で、  
**エラーを無視・隠蔽・曖昧なレスポンスで返すことを禁止する。**

❌ 禁止例：
```ts
catch (e) {
  console.error(e);
  return NextResponse.json({ message: "failed" });
}
````

✅ 必須：

```ts
catch (e) {
  console.error("API エラー:", e);
  return NextResponse.json(
    { error: "Internal Server Error" },
    { status: 500 }
  );
}
```

---

### 2. エラーレスポンスでは HTTP ステータスを必ず明示する

エラー経路において
**`NextResponse.json` を status 指定なしで呼び出してはならない。**

❌ 禁止：

```ts
return NextResponse.json({ error: "something went wrong" });
```

✅ 必須：

```ts
return NextResponse.json(
  { error: "something went wrong" },
  { status: 500 }
);
```

---

### 3. catch から 2xx を返してはならない

`catch` 節から以下を返すことは **重大な設計違反**とする。

* 200 OK
* 201 Created
* 204 No Content

判断に迷った場合は **必ず 500 を返すこと。**

---

### 4. 想定内エラーと想定外エラーを混同しない

入力不正・権限不足などの **想定内エラー**は `catch` に入れてはならない。

```ts
if (!isValid(input)) {
  return NextResponse.json(
    { error: "不正なリクエストです" },
    { status: 400 }
  );
}

try {
  const result = await service.execute(input);
  return NextResponse.json(result);
} catch (e) {
  console.error("想定外の API エラー:", e);
  return NextResponse.json(
    { error: "サーバー内部エラー" },
    { status: 500 }
  );
}
```

---

### 5. 空の catch / 何もしない catch を禁止する

以下のパターンは **全面禁止**とする。

* `catch {}`
* `catch (e) { /* 何もしない */ }`
* ログ出力のみで正常レスポンスを返す

---

## 実装前セルフチェック（必須）

* [ ] すべての catch で非 2xx を返している
* [ ] エラーレスポンスに status が明示されている
* [ ] エラーは必ずサーバーログに残る
* [ ] クライアントが成功・失敗を確実に判定できる

---

## このルールの背景

> **「隠されたエラー」は「発生したエラー」より危険である**

エラーの握りつぶしは以下を引き起こす：

* 障害検知不能
* セキュリティ問題の不可視化
* 不正状態の連鎖
* 事故調査の困難化

そのため、本プロジェクトでは
**明示的に失敗させることを正解とする。**

---

## 運用上の扱い

本ルール違反は以下として扱う：

* セキュリティ欠陥
* マージブロッカー
* 修正必須事項