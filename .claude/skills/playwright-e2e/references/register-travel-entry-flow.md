# Register Travel Entry Flow（あしあと登録）

## 概要

あしあと登録画面 (`/register`) で画像をアップロードし、タイトルを入力して「刻む」ボタンで登録する操作。

## 前提条件

- Cognito 認証済みであること（`injectCognitoAuth()` またはログイン済み）
- 開発サーバー (`npm run dev`) が `http://localhost:3000` で起動していること

---

## PC 手順 (Desktop Chrome)

1. `/register` にアクセスする
2. `input[type="file"]` の表示を待機する
3. ファイル選択ボタン（または画像アップロードエリア）をクリックする
4. 画像ファイルを選択する（または `setInputFiles()` でプログラム的にセット）
5. 画像プレビューが表示されることを確認する
6. `#title` フィールドにタイトルを入力する
7. 「刻む」ボタンがアクティブ（disabled でない）になることを確認する
8. 「刻む」ボタンをクリックする
9. 登録成功メッセージまたは `/dashboard` へのリダイレクトを確認する

## SP 手順 (Mobile Safari)

PC と同じ手順。タップ操作でフォームに入力する。
ファイル選択時はカメラロールまたはファイルアプリが表示される場合があるが、テストではプログラム的に `setInputFiles()` を使う。

---

## バリデーション確認

### タイトル未入力時
- 「刻む」ボタンが `disabled` であることを確認
- `await expect(page.getByRole('button', { name: '刻む' })).toBeDisabled()`

### 画像未選択時
- 「刻む」ボタンが表示されないことを確認

### 正常登録
- 「刻む」ボタンが活性化した後にクリック
- 成功レスポンスまたはリダイレクトを確認

---

## テストコード例（Playwright）

```typescript
import { test, expect } from '@playwright/test';
import { injectCognitoAuth } from '../../tests/helpers/auth';

const DUMMY_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDB' +
  'kSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wA' +
  'ARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAA' +
  'AAAAAAAAAAAAAAAAAAAAADf/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAA' +
  'AAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';

test.beforeEach(async ({ page }) => {
  await injectCognitoAuth(page);
});

test('あしあと登録 - タイトル入力後に刻むボタンが活性化する', async ({ page }) => {
  await page.goto('/register');
  await page.waitForSelector('input[type="file"]', { state: 'attached' });

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'test.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from(DUMMY_JPEG_BASE64, 'base64'),
  });

  const submitButton = page.getByRole('button', { name: '刻む' });
  await submitButton.waitFor({ state: 'visible' });

  // タイトル未入力: disabled
  await expect(submitButton).toBeDisabled();

  // タイトル入力: active
  await page.locator('#title').fill('テスト登録');
  await expect(submitButton).not.toBeDisabled();
});
```

---

## 注意事項

- `page.goto('/register')` は `injectCognitoAuth()` の後に呼ぶこと
- 「刻む」ボタンは画像選択後に DOM に表示される（それ以前は非表示）
- ファイルアップロードの完了を待ってから次の操作を行うこと
