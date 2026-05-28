import { test, expect } from '@playwright/test';
import { injectCognitoAuth } from '../helpers/auth';

// 最小有効 JPEG (1×1 白画素) の base64 表現
const DUMMY_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkS' +
  'Ew8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAAB' +
  'AAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAA' +
  'AAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/' +
  'aAAwDAQACEQMRAD8AJQAB/9k=';

test.describe('あしあと登録 - タイトルバリデーション', () => {
  test.beforeEach(async ({ page }) => {
    // page.goto() より前にトークンを注入する
    await injectCognitoAuth(page);
  });

  test('画像アップロード後、タイトル未入力の場合「刻む」ボタンが非活性である', async ({
    page,
  }) => {
    // ページに移動（認証チェック完了まで待機）
    await page.goto('/register');
    await page.waitForSelector('input[type="file"]', { state: 'attached' });

    // ダミー画像をファイル入力にセット
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'dummy.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from(DUMMY_JPEG_BASE64, 'base64'),
    });

    // photos.length > 0 になると「刻む」ボタンが DOM に現れる
    const uploadButton = page.getByRole('button', { name: '刻む' });
    await uploadButton.waitFor({ state: 'visible' });

    // タイトルが空であること（初期状態: useState('')）を確認
    const titleInput = page.locator('#title');
    await expect(titleInput).toHaveValue('');

    // 検証: タイトル未入力の場合「刻む」ボタンが disabled であること
    await expect(uploadButton).toBeDisabled();
  });
});
