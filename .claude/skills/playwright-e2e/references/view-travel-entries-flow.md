# View Travel Entries Flow（あしあと一覧・詳細）

## 概要

ダッシュボード画面 (`/dashboard`) であしあと一覧を表示し、絞り込み・詳細確認・削除などを操作する。

## 前提条件

- Cognito 認証済みであること（`injectCognitoAuth()` またはログイン済み）
- 開発サーバー (`npm run dev`) が `http://localhost:3000` で起動していること

---

## 一覧表示

### PC 手順 (Desktop Chrome)

1. `/dashboard` にアクセスする
2. あしあと一覧テーブルまたはカードが表示されることを確認する
3. ページネーションが表示されていることを確認する（件数が多い場合）

### SP 手順 (Mobile Safari)

PC と同じ手順。SP ではカード表示になる場合がある。

---

## 絞り込み（検索）

1. 年フィルターのドロップダウンを操作する
2. キーワード検索フィールドに入力する
3. 一覧が絞り込まれることを確認する

---

## ページネーション

1. 「次のページ」ボタンをクリックする
2. 次のページのデータが表示されることを確認する
3. URL のクエリパラメータが変化することを確認する（`?page=2` 等）

---

## 地図表示 (MapView)

1. 「地図」タブまたはボタンをクリックする
2. 地図コンポーネントが表示されることを確認する
3. マーカーが表示されることを確認する（データが存在する場合）

---

## エントリー削除

1. 削除対象のエントリーの削除ボタンをクリックする
2. 確認ダイアログが表示されることを確認する
3. 「削除」を確定する
4. 一覧から該当エントリーが消えることを確認する

---

## テストコード例（Playwright）

```typescript
import { test, expect } from '@playwright/test';
import { injectCognitoAuth } from '../../tests/helpers/auth';

test.beforeEach(async ({ page }) => {
  await injectCognitoAuth(page);
});

test('ダッシュボード - あしあと一覧が表示される', async ({ page }) => {
  await page.goto('/dashboard');

  // テーブルまたはカードが表示されるまで待機
  await page.waitForSelector('[data-testid="travel-entries"]', { timeout: 10000 });

  // 少なくとも1件のエントリーが表示されることを確認
  const entries = page.locator('[data-testid="travel-entry-row"]');
  await expect(entries.first()).toBeVisible();
});
```

---

## 注意事項

- API は `/api/travel-entries` (Next.js BFF) → Cloudflare Workers 経由でデータ取得
- ローカル環境ではデータが存在しない場合、空の一覧が表示される
- `data-testid` 属性が実装されていない場合は、代替セレクタ（role, text 等）を使用すること
- 削除操作は確認ダイアログが表示されるため、`page.on('dialog', ...)` または shadcn AlertDialog の操作が必要
