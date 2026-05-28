---
paths:
  - "app/api/**/*.ts"
---

# API 認可（Authorization）規約（必須）

## 対象範囲
本ルールは、以下すべての API 実装に適用される。

- Next.js Route Handler（`app/api/**/route.ts`）
- Server Action などのサーバーサイド処理
- ユーザー・組織・テナントに紐づくデータを扱う API

---

## 絶対ルール（違反禁止）

### 1. 認証と認可を混同してはならない
**ログインしていること（認証）と、アクセス可能であること（認可）は別である。**

❌ 禁止例：
```ts
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// ログインしている → OK ❌
const data = await getResourceById(params.id);
return NextResponse.json(data);
````

✅ 必須：

```ts
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const data = await getResourceById(params.id);

if (data.ownerId !== user.id) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

return NextResponse.json(data);
```

---

### 2. ID 指定での取得は必ず所有権・スコープを検証する

以下の情報のいずれかによる **明示的な検証が必須**とする。

* ユーザーID
* 組織ID
* テナントID
* プロジェクトID

**ID が分かるだけでアクセスできる設計は禁止。**

---

### 3. 認可チェックなしの直接取得を禁止する

以下のパターンは **全面禁止**とする。

```ts
const item = await db.item.findById(params.id);
return NextResponse.json(item);
```

---

### 4. 認可エラーは 403 を返す

* 未認証 → **401 Unauthorized**
* 認証済みだが権限なし → **403 Forbidden**

**404 で隠す判断は、意図が明確な場合のみ許可する。**

---

## 実装前セルフチェック（必須）

* [ ] 認証チェックと認可チェックが分離されている
* [ ] リソースの所有者・スコープを検証している
* [ ] ID ベースアクセスに認可がある
* [ ] 権限不足時に 403 を返している

---

## このルールの背景

> **「ID を知っている」ことは「アクセスできる」理由にならない**

認可漏れは以下を引き起こす：

* 他ユーザーのデータ閲覧
* 権限昇格
* 情報漏洩インシデント

---

## 運用上の扱い

本ルール違反は以下として扱う：

* 高リスクなセキュリティ欠陥
* マージブロッカー
* 即時修正対象

