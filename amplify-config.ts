import { ResourcesConfig } from 'aws-amplify';

/**
 * Cognito domainからプロトコルを除去
 * AWS Amplifyはdomainパラメータにプロトコルなしの値を期待する
 */
function normalizeCognitoDomain(domain: string | undefined): string {
  if (!domain) return '';
  // https:// または http:// を除去（大文字小文字区別なし）
  return domain.replace(/^https?:\/\//i, '');
}

/**
 * 開発環境用のリダイレクトURL生成
 * ブラウザの現在のオリジンを自動検出（localhost, 192.168.x.x など）
 */
function getRedirectUrls(): string[] {
  // サーバーサイドレンダリング時はデフォルト値
  if (typeof window === 'undefined') {
    return [
      process.env.NEXT_PUBLIC_OAUTH_REDIRECT_SIGNIN || 'http://localhost:3000/login',
    ];
  }

  // クライアントサイドでは現在のオリジンを使用
  const currentOrigin = window.location.origin;
  return [`${currentOrigin}/login`];
}

export const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
      identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || '',
      loginWith: {
        email: true,
        oauth: {
          domain: normalizeCognitoDomain(process.env.NEXT_PUBLIC_COGNITO_DOMAIN),
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: getRedirectUrls(),
          redirectSignOut: getRedirectUrls(),
          responseType: 'code',
        },
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
      },
      allowGuestAccess: false,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
};
