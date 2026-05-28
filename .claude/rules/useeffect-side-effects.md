---
paths:
  - "app/**/page.tsx"
  - "components/**/*.tsx"
---

# useEffect 副作用制御規約（必須）

## 対象範囲
本ルールは、以下すべての Client Component に適用される。

- `use client` を含む React Component
- `app/**/page.tsx`
- `components/**`

---

## 絶対ルール（違反禁止）

### 1. useEffect は「1つの責務」しか持ってはならない
1つの `useEffect` に複数の副作用を詰め込むことを禁止する。

❌ 禁止例：
```ts
useEffect(() => {
  fetchUser();
  fetchSecretData();
  logAccess();
}, []);
````

---

### 2. 依存配列を省略・誤魔化してはならない

以下の書き方を **全面禁止**とする。

* 依存配列なし
* 意図的な eslint-disable
* 依存関係の不足

❌ 禁止：

```ts
useEffect(() => {
  loadData();
});
```

---

### 3. 認証・ユーザー依存処理は明示的にガードする

ユーザー情報が未確定の状態で副作用を実行してはならない。

❌ 禁止：

```ts
useEffect(() => {
  fetchUserData(user.id);
}, [user]);
```

✅ 必須：

```ts
useEffect(() => {
  if (!user?.id) return;
  fetchUserData(user.id);
}, [user?.id]);
```

---

### 4. 再実行による情報漏洩・重複実行を防止する

以下の副作用は **無条件実行してはならない**。

* API 呼び出し
* 機密データ取得
* 書き込み処理
* ログ送信

必ず再実行条件を限定すること。

---

### 5. Cleanup を必要とする副作用は必ず解除する

以下を伴う処理では cleanup を必須とする。

* Event Listener
* Subscription
* Timer
* Observer

```ts
useEffect(() => {
  const handler = () => {};
  window.addEventListener("resize", handler);

  return () => {
    window.removeEventListener("resize", handler);
  };
}, []);
```

---

## 実装前セルフチェック（必須）

* [ ] useEffect の責務は単一か
* [ ] 依存配列は正しいか
* [ ] 未確定状態で副作用が走らないか
* [ ] 多重実行で問題が起きないか
* [ ] cleanup は適切か

---

## このルールの背景

> **useEffect は「いつ実行されるか」が最も危険なフックである**

副作用暴発は以下を引き起こす：

* API の多重呼び出し
* 意図しないデータ取得
* 他ユーザー情報の混入
* 本番環境でのみ起きる不具合

---

## 運用上の扱い

本ルール違反は以下として扱う：

* セキュリティ欠陥
* バグ混入
* マージブロッカー
