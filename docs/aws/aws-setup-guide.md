# AWS設定手順ガイド

このドキュメントでは、Next.jsアプリケーションでAWS Amplify認証とLambda連携を設定する手順を説明します。

## 前提条件

- AWSアカウントを持っていること
- AWS CLIがインストールされていること（オプション）

## 手順1: AWS Cognitoユーザープールの作成

### 1.1 AWSマネジメントコンソールにログイン

1. [AWS Management Console](https://console.aws.amazon.com/)にアクセス
2. リージョンを **ap-northeast-1（東京）** に設定

### 1.2 Cognitoユーザープールの作成

1. **Amazon Cognito**サービスに移動
2. **ユーザープールを作成**をクリック
3. 以下の設定で作成：

#### ステップ1: サインインエクスペリエンスの設定

- **Cognitoユーザープールのサインインオプション**
  - ✅ Eメール
- **多要素認証（MFA）**: オプション（必要に応じて）
- **ユーザーアカウントの復旧**: Eメールのみを選択

#### ステップ2: セキュリティ要件の設定

- **パスワードポリシー**: デフォルトのCognitoのパスワードポリシー
- **多要素認証（MFA）の適用**: MFAなし（または必要に応じてオプション）

#### ステップ3: サインアップエクスペリエンスの設定

- **セルフサービスのサインアップ**: 有効
- **必須の属性**: email
- **Eメール検証**: Eメールアドレスで検証

#### ステップ4: メッセージ配信の設定

- **Eメール設定**: Cognitoを使用してEメールを送信
  - 本番環境ではSESの設定を推奨

#### ステップ5: アプリケーションを統合

- **ユーザープール名**: `learn-auth-user-pool`（任意の名前）
- **ホストされたUIの設定**: ホストされたUIを使用しないを選択

##### アプリケーションを定義

- **アプリケーションタイプ**: **シングルページアプリケーション (SPA)** を選択
  - このアプリケーションはAWS Amplify JS SDKを使用し、JavaScript/React（Next.js）で構築されています
  - カスタムログインフォームでUSER_SRP_AUTH認証を使用するため、SPAが適切です
- **アプリクライアント名**: `learn-auth-client`
- **クライアントシークレット**: 生成しない（SPAの場合は自動的に生成されません）
- **リターンURL・ログアウトURL**:
  - **設定不要**です（ホストされたUIを使用しないため）
  - 将来的にホストされたUIを使う場合のみ、`http://localhost:3000/` を設定してください
- **高度な設定 - 認証フロー**:
  - **ALLOW_USER_SRP_AUTH** を有効化（必須）
  - **ALLOW_REFRESH_TOKEN_AUTH** も有効化（推奨）

#### ステップ6: 確認と作成

- 設定を確認して**ユーザープールを作成**

### 1.3 必要な情報を記録

作成後、以下の情報を記録：

- **ユーザープールID**: `ap-northeast-1_xxxxxxxxx`
- **アプリクライアントID**: `xxxxxxxxxxxxxxxxxxxxxx`

## 手順2: Cognito IDプールの作成

### 2.1 IDプールの作成

1. Cognitoコンソールで**IDプール**を選択
2. **新しいIDプールの作成**をクリック
3. 以下の設定：

#### 基本情報
- **IDプール名**: `learn_auth_identity_pool`

#### アクセス設定
- **アクセスタイプ**: **認証されたアクセス** を選択
  - ログインしたユーザーのみがAWSリソース（Lambda関数など）にアクセスできます
  - ゲストアクセスは選択しません（ログインしていないユーザーにはアクセスを許可しません）

#### 認証プロバイダー
- **認証プロバイダー**:
  - **Cognito**タブを選択
  - **ユーザープールID**: 手順1.3で記録したID
  - **アプリクライアントID**: 手順1.3で記録したID

#### アクセスコントロールの属性
- **クレームマッピング**: **デフォルトマッピングを使用** を選択
  - Cognito User Poolの標準属性（sub、emailなど）が自動的にマッピングされます
  - カスタムマッピングは不要です

#### 認証フロー設定
- **基本（クラシック）認証**: **アクティブ化する**
  - 標準的なCognito IDプールの認証フローです
  - AWS Amplify JS SDKと互換性があります

4. **プールの作成**をクリック
5. IAMロールの作成を確認（デフォルト設定でOK）
6. **IDプールID**を記録: `ap-northeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## 手順3: テストユーザーの作成

### 3.1 ユーザーA（実行権限なし）

1. Cognitoユーザープールコンソールで**ユーザー**タブを選択
2. **ユーザーを作成**をクリック
3. 以下の情報を入力：
   - **ユーザー名**: userA
   - **Eメール**: `userA@example.com`
   - **初回サインイン時にパスワードをリセット**: チェックを外す
   - **仮パスワード**: `TempPass123!`（後で変更）

### 3.2 ユーザーB（実行権限なし）

- 上記と同様に作成
- **ユーザー名**: userB
- **Eメール**: `userB@example.com`

### 3.3 ユーザーC（実行権限あり）

- 上記と同様に作成
- **ユーザー名**: userC
- **Eメール**: `userC@example.com`

## 手順4: Lambda関数の作成

### 4.1 Lambda関数の作成

1. **AWS Lambda**サービスに移動
2. **関数の作成**をクリック
3. 以下の設定：
   - **関数名**: `learn-auth-lambda`
   - **ランタイム**: Node.js 20.x（最新の推奨バージョン）
   - **アーキテクチャ**: x86_64
   - **実行ロール**: 新しいロールを作成（基本的なLambdaアクセス権限）

### 4.2 Lambda関数コードの実装

関数コードとして以下を設定：

```javascript
export const handler = async (event) => {
  console.log('受信イベント:', JSON.stringify(event, null, 2));

  const { userId, userEmail, timestamp } = event;

  // 簡単な処理例
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Lambda関数が正常に実行されました！',
      userId: userId,
      userEmail: userEmail,
      timestamp: timestamp,
      processedAt: new Date().toISOString(),
      data: {
        sampleData: 'これはサンプルデータです',
        calculation: Math.random() * 100
      }
    })
  };

  return response;
};
```

4. **Deploy**をクリックして保存

### 4.3 Lambda関数のARNを記録

- 関数の詳細ページで**関数ARN**を記録

## 手順5: IAMロールの権限設定

### 5.1 Cognito IDプールの認証済みロールにLambda実行権限を付与

1. **IAM**サービスに移動
2. **ロール**を選択
3. Cognito IDプールで作成された認証済みロール（例: `Cognito_learn_auth_identity_poolAuth_Role`）を検索
4. **ポリシーをアタッチ**をクリック
5. 以下のカスタムインラインポリシーを追加：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:ap-northeast-1:YOUR_ACCOUNT_ID:function:learn-auth-lambda"
    }
  ]
}
```

**注意**: `YOUR_ACCOUNT_ID`を実際のAWSアカウントIDに置き換えてください。

## 手順6: 環境変数の設定

### 6.1 `.env.local`ファイルの作成

プロジェクトルートに`.env.local`ファイルを作成し、以下の内容を記入：

```env
# AWS Cognito Configuration (Client-side - exposed to browser)
NEXT_PUBLIC_USER_POOL_ID=ap-northeast-1_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_IDENTITY_POOL_ID=ap-northeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# AWS Lambda Configuration (Server-side only - not exposed to browser)
AWS_REGION=ap-northeast-1
LAMBDA_FUNCTION_NAME=learn-auth-lambda
```

各値を手順で記録したIDに置き換えてください。

## 手順7: アプリケーションの起動とテスト

### 7.1 依存関係のインストール

```bash
npm install
```

### 7.2 開発サーバーの起動

```bash
npm run dev
```

### 7.3 アプリケーションのテスト

1. ブラウザで `http://localhost:3000` にアクセス
2. ログイン画面が表示されることを確認
3. 各テストユーザーでログインを試行：

#### ユーザーAまたはBでテスト（権限なし）

- ログイン: `userA@example.com` / 設定したパスワード
- ダッシュボードで「Lambda関数を呼び出す」ボタンをクリック
- **期待結果**: 401エラー「実行権限がありません」

#### ユーザーCでテスト（権限あり）

- ログイン: `userC@example.com` / 設定したパスワード
- ダッシュボードで「Lambda関数を呼び出す」ボタンをクリック
- **期待結果**: Lambda関数が正常に実行され、結果が表示される

## トラブルシューティング

### ログインできない

- Cognitoユーザープールの設定を確認
- `.env.local`の設定値が正しいか確認
- ユーザーが確認済み（CONFIRMED）状態か確認

### Lambda呼び出しでエラー

- IAMロールにLambda実行権限が付与されているか確認
- Lambda関数名が正しいか確認
- Cognito IDプールの設定が正しいか確認

### 認可チェックが動作しない

- `app/api/call-lambda/route.ts`の`AUTHORIZED_USERS`配列にユーザーCのメールアドレスが正しく設定されているか確認

## セキュリティのベストプラクティス

1. **本番環境では**:
   - MFAを有効化
   - SESでメール送信を設定
   - 環境変数を環境変数管理サービス（AWS Secrets Managerなど）で管理
   - Cognitoグループを使用して権限管理を実装

2. **Lambda関数**:
   - 実行ロールを最小権限の原則に従って設定
   - CloudWatch Logsでログを監視

3. **認可機能**:
   - 現在のハードコードされた認可リストを、Cognitoグループやデータベースベースの実装に変更

## 次のステップ

- Cognitoグループを作成して、グループベースの認可を実装
- Lambda関数に実際のビジネスロジックを追加
- エラーハンドリングとロギングを強化
- ユニットテストとE2Eテストの追加

## 参考リンク

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Amazon Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Next.js Documentation](https://nextjs.org/docs)
