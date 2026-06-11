# Login Flow

## 概要

AWS Cognito を使った認証フロー。E2E テストでは実際の Cognito 認証ではなく、`tests/helpers/auth.ts` の `injectCognitoAuth()` でトークンを Cookie に直接注入するモック認証を使用する。

## 前提条件

- `.env.local` に `NEXT_PUBLIC_USER_POOL_CLIENT_ID` が設定されていること
- 開発サーバー (`npm run dev`) が `http://localhost:3000` で起動していること

---

## モック認証（E2E テスト推奨）

実際の認証不要で認証済み状態を作る方法。テスト時間の短縮とCI安定性のため、**この方法を優先する**。

```typescript
import { injectCognitoAuth } from '../../tests/helpers/auth';

test.beforeEach(async ({ page }) => {
  await injectCognitoAuth(page); // page.goto() より前に呼ぶこと
});

test('認証必須ページのテスト', async ({ page }) => {
  await page.goto('/dashboard');
  // ...
});
```

**注意:** `page.goto()` より前に `injectCognitoAuth(page)` を呼ぶこと。後から呼んでも Cookie がページに反映されない。

---

## 実際のログイン操作（手動テスト用）

実際の Cognito 認証フローを辿る場合の手順。

### PC 手順 (Desktop Chrome)

1. `http://localhost:3000` にアクセスする
2. 自動的に `/login` にリダイレクトされることを確認する
3. メールアドレスフィールドに入力する
4. パスワードフィールドに入力する
5. 「ログイン」ボタンをクリックする
6. `/dashboard` にリダイレクトされることを確認する

### SP 手順 (Mobile Safari)

PC と同じ手順。タップ操作でフォームに入力する。

---

## ログアウト手順

1. ヘッダーのユーザーメニューまたはログアウトボタンをクリックする
2. `/login` にリダイレクトされることを確認する

---

## 注意事項

- テストユーザー: `test@example.com` / `test-user`（モック認証のダミーユーザー）
- JWT の `exp` は西暦2286年に設定（期限切れ回避）
- Amplify v6 は `ssr: true` 設定のため localStorage ではなく Cookie にトークン保存
