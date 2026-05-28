// AWS Amplify ユーザー型定義
// Authenticatorコンポーネントから提供されるユーザーオブジェクトの型

export interface AmplifyUser {
  userId?: string;
  username?: string;
  signInDetails?: {
    loginId?: string;
  };
  signInUserSession?: {
    idToken?: {
      payload: {
        'cognito:groups'?: string[];
        [key: string]: unknown;
      };
    };
  };
}
