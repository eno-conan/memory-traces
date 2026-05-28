/**
 * R2画像ギャラリーのレスポンス型定義
 *
 * Cloudflare R2からの画像取得に使用する型定義です。
 */

/**
 * R2バケット内の画像オブジェクト
 */
export interface R2Image {
  /** ファイル名（キー） */
  key: string;
  /** ファイルサイズ（バイト） */
  size: number;
  /** 最終更新日時 */
  lastModified: string;
  /** 署名付きURL（一時的なアクセス用） */
  url: string;
}

/**
 * R2画像リストAPIのレスポンス
 */
export interface R2ImagesResponse {
  /** 成功フラグ */
  success: boolean;
  /** 画像リスト */
  images: R2Image[];
  /** エラーメッセージ（エラー時） */
  error?: string;
}
