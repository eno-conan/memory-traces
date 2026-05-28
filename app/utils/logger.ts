// 構造化ログ用の型定義
interface LogContext {
  userId?: string;
  fileSize?: number;
  fileType?: string;
  fileName?: string;
  userAgent?: string;
  timestamp: string;
  phase: 'validation' | 'compression' | 'upload' | 'cloudflare' | 'client' | 'rate-limit';
  errorCode?: string;
  uploadCount?: number;
  error?: string;
}

interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
}

/**
 * エラーログを構造化形式で出力
 * Vercelログで追跡可能なJSON形式
 */
export function logError(
  message: string,
  error: Error | unknown,
  context: LogContext
): void {
  const errorDetails: ErrorDetails =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause,
        }
      : {
          name: 'UnknownError',
          message: String(error),
        };

  // JSON形式でログ出力（Vercelで構造化ログとして記録される）
  console.error(
    JSON.stringify({
      level: 'ERROR',
      message,
      error: errorDetails,
      context,
    })
  );
}

/**
 * 警告ログを構造化形式で出力
 */
export function logWarning(message: string, context: LogContext): void {
  console.warn(
    JSON.stringify({
      level: 'WARNING',
      message,
      context,
    })
  );
}

/**
 * 情報ログを構造化形式で出力
 */
export function logInfo(message: string, context: LogContext): void {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      level: 'INFO',
      message,
      context,
    })
  );
}

/**
 * チェックポイントログを出力（処理フローの追跡用）
 */
export function logCheckpoint(
  checkpoint: string,
  data: Record<string, unknown>
): void {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      level: 'CHECKPOINT',
      checkpoint,
      data,
      timestamp: new Date().toISOString(),
    })
  );
}
