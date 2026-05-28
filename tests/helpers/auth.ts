import * as fs from 'fs';
import * as path from 'path';
import type { Page } from '@playwright/test';

/**
 * .env.local を手動パースして指定キーの値を返す (dotenv 不要)
 */
function readEnvLocal(key: string): string | undefined {
  try {
    const envPath = path.resolve(__dirname, '../../.env.local');
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const k = trimmed.slice(0, eqIdx).trim();
      if (k === key) {
        return trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {
    // .env.local が存在しない場合は無視
  }
  return undefined;
}

/**
 * ダミー JWT を生成する (署名なし、Amplify はブラウザ側で署名検証しない)
 */
function makeDummyJwt(extraPayload: Record<string, unknown> = {}): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'test-user-sub-12345',
      iat: Math.floor(Date.now() / 1000),
      exp: 9999999999, // 西暦2286年 — 十分に未来
      ...extraPayload,
    })
  ).toString('base64url');
  return `${header}.${payload}.dummysignature`;
}

/**
 * Amplify v6 の認証を通り抜けるダミートークンを注入する。
 *
 * 【重要】AmplifyProvider が `{ ssr: true }` で configure しているため、
 * Amplify v6 はトークンを localStorage ではなく Cookie に保存する。
 * そのため page.context().addCookies() を使って Cookie に直接注入する。
 *
 * page.goto() を呼ぶ前に実行すること。
 */
export async function injectCognitoAuth(page: Page): Promise<void> {
  const clientId =
    readEnvLocal('NEXT_PUBLIC_USER_POOL_CLIENT_ID') ??
    process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ??
    'dummy-client-id';

  const username = 'test-user';
  const prefix = `CognitoIdentityServiceProvider.${clientId}`;

  // idToken: token_use=id, email, cognito:username が必要
  const idToken = makeDummyJwt({
    email: 'test@example.com',
    'cognito:username': username,
    token_use: 'id',
  });

  // accessToken: token_use=access, username (または cognito:username) が必要
  // Amplify v6 の getCurrentUser() は accessToken.payload['username'] を読む
  const accessToken = makeDummyJwt({
    username,
    'cognito:username': username,
    token_use: 'access',
    client_id: clientId,
    scope: 'openid email profile',
  });

  const baseUrl = 'http://localhost:3000';

  await page.context().addCookies([
    { name: `${prefix}.LastAuthUser`, value: username, url: baseUrl },
    { name: `${prefix}.${username}.idToken`, value: idToken, url: baseUrl },
    { name: `${prefix}.${username}.accessToken`, value: accessToken, url: baseUrl },
    { name: `${prefix}.${username}.refreshToken`, value: 'dummy-refresh-token', url: baseUrl },
    { name: `${prefix}.${username}.clockDrift`, value: '0', url: baseUrl },
  ]);
}
