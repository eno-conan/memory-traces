# Google OAuth セットアップガイド

このガイドでは、旅行写真アップロード機能で使用するGoogle OAuth認証の設定方法を説明します。

## 前提条件

- Googleアカウント
- Google Cloud Platformへのアクセス権限

## 1. Google Cloud Consoleでプロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 画面上部の「プロジェクトを選択」をクリック
3. 「新しいプロジェクト」をクリック
4. プロジェクト名を入力（例: "travel-photo-app"）
5. 「作成」をクリック

## 2. OAuth同意画面の設定

1. 左側のメニューから「APIとサービス」→「OAuth同意画面」を選択
2. ユーザータイプで「外部」を選択し、「作成」をクリック
3. アプリ情報を入力：
   - **アプリ名**: `Travel Photo Uploader`
   - **ユーザーサポートメール**: あなたのメールアドレス
   - **デベロッパーの連絡先情報**: あなたのメールアドレス
4. 「保存して次へ」をクリック
5. スコープの追加：
   - 「スコープを追加または削除」をクリック
   - `.../auth/drive.file` を検索して選択（アプリが作成したファイルのみアクセス可能）
   - 「更新」をクリック
6. 「保存して次へ」をクリック
7. テストユーザー（開発中のみ必要）:
   - 「ユーザーを追加」をクリック
   - テスト用のGoogleアカウントのメールアドレスを入力
   - 「追加」をクリック
8. 「保存して次へ」をクリック

## 3. OAuth 2.0クライアントIDの作成

1. 左側のメニューから「APIとサービス」→「認証情報」を選択
2. 上部の「認証情報を作成」→「OAuth クライアント ID」をクリック
3. アプリケーションの種類で「ウェブアプリケーション」を選択
4. 名前を入力（例: "Travel Photo Web Client"）
5. 承認済みのJavaScript生成元を追加：
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
6. 承認済みのリダイレクトURIを追加：
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
7. 「作成」をクリック
8. 表示された**クライアントID**と**クライアントシークレット**をコピーして保存

## 4. Google Drive APIを有効化

1. 左側のメニューから「APIとサービス」→「ライブラリ」を選択
2. 検索バーで「Google Drive API」を検索
3. 「Google Drive API」をクリック
4. 「有効にする」をクリック

## 5. 環境変数の設定

プロジェクトのルートディレクトリに `.env.local` ファイルを作成し、以下を追加：

```bash
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

`.env.local` は `.gitignore` に含まれているため、機密情報がGitにコミットされることはありません。

## 6. 本番環境での設定

### Vercel

1. Vercelダッシュボードでプロジェクトを選択
2. 「Settings」→「Environment Variables」に移動
3. 以下の環境変数を追加：
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### その他のホスティングサービス

各サービスのドキュメントに従って、環境変数を設定してください。

## 7. OAuth同意画面を本番環境に移行（公開時）

開発中は「テストモード」で動作しますが、一般公開する場合は以下の手順が必要です：

1. Google Cloud Consoleの「OAuth同意画面」に戻る
2. 「アプリを公開」をクリック
3. Googleの審査プロセスに従う（通常1-2週間）

**注意**: テストモードでは追加したテストユーザーのみが認証できます。

## セキュリティのベストプラクティス

1. **最小権限の原則**: `drive.file` スコープのみを使用（全ドライブアクセスではない）
2. **短命なアクセストークン**: サーバー側で即座に処理し、長期保存しない
3. **一時ファイルの削除**: Google Driveの一時フォルダは処理後すぐに削除
4. **HTTPS必須**: 本番環境では必ずHTTPSを使用
5. **環境変数の保護**: `.env.local` を `.gitignore` に追加
6. **定期的なトークンの監査**: Google Cloud Consoleで不要な認証情報を削除

## トラブルシューティング

### エラー: "Access blocked: This app's request is invalid"

- OAuth同意画面の設定が完了していない可能性があります
- 承認済みのリダイレクトURIが正しく設定されているか確認してください

### エラー: "403: access_denied"

- テストモードで、テストユーザーに追加されていないアカウントでログインしようとしています
- OAuth同意画面でテストユーザーを追加してください

### エラー: "invalid_client"

- クライアントIDまたはクライアントシークレットが間違っています
- 環境変数が正しく設定されているか確認してください

## 参考リンク

- [Google OAuth 2.0ドキュメント](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API リファレンス](https://developers.google.com/drive/api/guides/about-sdk)
- [スコープの説明](https://developers.google.com/identity/protocols/oauth2/scopes#drive)
