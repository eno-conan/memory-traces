/**
 * R2 Lambda関数のレスポンス型定義
 *
 * Cloudflare R2操作用Lambda関数のレスポンス型です。
 */

/**
 * R2オブジェクトの基本情報
 */
export interface R2Object {
  key: string;
  size: number;
  lastModified: string;
  etag: string;
}

/**
 * listR2Objects Lambda関数のレスポンス
 */
export interface ListR2ObjectsResponse {
  objects: R2Object[];
  isTruncated: boolean;
  nextContinuationToken?: string;
  count: number;
}

/**
 * 署名付きURL情報
 */
export interface SignedUrlInfo {
  key: string;
  url: string;
}

/**
 * generateSignedUrls Lambda関数のレスポンス
 */
export interface GenerateSignedUrlsResponse {
  signedUrls: SignedUrlInfo[];
  expiresIn: number;
  count: number;
}

/**
 * R2オブジェクトのメタデータ
 */
export interface R2Metadata {
  key: string;
  contentType: string;
  isOptimized: boolean;
  thumbnailAvailable: boolean;
}

/**
 * getR2Metadata Lambda関数のレスポンス
 */
export interface GetR2MetadataResponse {
  metadata: R2Metadata[];
  count: number;
}

/**
 * 完全なR2画像情報（全Lambda関数の結果をマージ）
 */
export interface R2ImageComplete {
  key: string;
  size: number;
  lastModified: string;
  etag: string;
  url: string;
  contentType?: string;
  isOptimized?: boolean;
  thumbnailAvailable?: boolean;
}

/**
 * R2バッチRPC APIのレスポンス
 */
export interface R2BatchResponse {
  success: boolean;
  method: 'capnweb-batch';
  executionTime: number;
  images: R2ImageComplete[];
  pagination: {
    hasMore: boolean;
    continuationToken?: string;
  };
  stats: {
    totalObjects: number;
    imageCount: number;
    lambdaCalls: number;
  };
  error?: string;
  details?: string;
}
