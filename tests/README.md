# E2E テスト概要

Playwright を使用したエンドツーエンドテスト。
実行には開発サーバー (`npm run dev`) が起動済みであること、または Playwright が自動起動する。

```bash
# 特定ファイルのみ実行
npx playwright test tests/register/title-required.spec.ts --headed

# 全テスト実行
npx playwright test
```

---

## フォルダ構成

```
tests/
├── helpers/          # 機能横断ユーティリティ（テスト間で共有）
├── register/         # あしあと登録画面 (/register) のテスト
└── example.spec.ts   # Playwright デフォルトサンプル（参照用）
```

---

## 機能別テスト

### `register/` — あしあと登録画面 (`/register`)

| ファイル | テスト内容 |
|----------|-----------|
| `title-required.spec.ts` | 画像選択後、タイトル未入力のとき「刻む」ボタンが `disabled` であることを確認 |

---

## ヘルパー・ユーティリティ

### `helpers/auth.ts` — 認証モック

`/register` など認証必須ページのテストで使用する、AWS Cognito 認証バイパスユーティリティ。

```typescript
import { injectCognitoAuth } from '../helpers/auth';

test.beforeEach(async ({ page }) => {
  await injectCognitoAuth(page); // page.goto() より前に呼ぶ
});
```

**仕組み:**

- Amplify v6 は `Amplify.configure(..., { ssr: true })` により Cookie にトークンを保存する
- `page.context().addCookies()` で `CognitoIdentityServiceProvider.{clientId}.*` の Cookie を直接注入
- JWT の `exp` を西暦2286年に設定することで期限切れを回避
- `NEXT_PUBLIC_USER_POOL_CLIENT_ID` は `.env.local` から自動読み込み（dotenv 不要）

**注意:** `page.goto()` より前に呼び出すこと。後から呼んでも Cookie がページに反映されない。
