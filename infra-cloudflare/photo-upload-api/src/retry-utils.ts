/**
 * リトライ処理のユーティリティ関数
 *
 * 一時的なネットワークエラーに対して指数バックオフでリトライを実行する
 */

export interface RetryConfig {
  maxAttempts: number; // 最大試行回数（初回 + リトライ回数）
  delays: number[]; // 各リトライ前の待機時間（ミリ秒）
}

/**
 * 指数バックオフでリトライを実行する
 *
 * @param operation リトライ対象の操作
 * @param config リトライ設定
 * @param shouldRetry エラーがリトライ可能かどうかを判定する関数
 * @returns 操作の結果
 * @throws 最終試行でも失敗した場合はエラーをそのまま投げる
 */
export async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  shouldRetry: (error: Error) => boolean
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // リトライすべきでないエラーの場合は即座に投げる
      if (!shouldRetry(lastError)) {
        console.error('Non-retryable error encountered:', {
          attempt: attempt + 1,
          error: lastError.message,
        });
        throw lastError;
      }

      // 最終試行の場合はリトライせずに投げる
      if (attempt === config.maxAttempts - 1) {
        console.error('Max retry attempts reached:', {
          maxAttempts: config.maxAttempts,
          error: lastError.message,
        });
        throw lastError;
      }

      // リトライ前の待機
      const delay = config.delays[attempt] || config.delays[config.delays.length - 1];
      console.warn('Retrying operation:', {
        attempt: attempt + 1,
        maxAttempts: config.maxAttempts,
        delayMs: delay,
        error: lastError.message,
      });

      await sleep(delay);
    }
  }

  // TypeScriptの型チェックを満たすため（実際にはここには到達しない）
  throw lastError!;
}

/**
 * R2エラーがリトライ可能かどうかを判定する
 *
 * リトライすべき一時的エラー:
 * - ネットワークタイムアウト（ETIMEDOUT, ECONNRESET）
 * - HTTPステータス 503 (Service Unavailable)
 * - HTTPステータス 429 (Too Many Requests)
 * - timeout, network キーワードを含むエラー
 *
 * @param error エラーオブジェクト
 * @returns リトライすべき場合は true
 */
export function isR2RetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const errorString = error.toString().toLowerCase();

  // ネットワークタイムアウト関連
  if (
    message.includes('timeout') ||
    message.includes('etimedout') ||
    message.includes('econnreset') ||
    message.includes('network')
  ) {
    return true;
  }

  // HTTPステータスコード関連
  if (message.includes('503') || message.includes('429')) {
    return true;
  }

  // R2特有のエラー
  if (errorString.includes('service unavailable') || errorString.includes('too many requests')) {
    return true;
  }

  // それ以外は恒久的エラーと判断
  return false;
}

/**
 * D1エラーがリトライ可能かどうかを判定する
 *
 * リトライすべき一時的エラー:
 * - D1_ERROR（一時的なロック）
 * - SQLITE_BUSY
 * - timeout, lock, busy キーワードを含むエラー
 *
 * @param error エラーオブジェクト
 * @returns リトライすべき場合は true
 */
export function isD1RetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const errorString = error.toString().toLowerCase();

  // D1特有のエラー
  if (
    message.includes('d1_error') ||
    message.includes('sqlite_busy') ||
    message.includes('database is locked') ||
    message.includes('lock') ||
    message.includes('busy')
  ) {
    return true;
  }

  // タイムアウト関連
  if (message.includes('timeout')) {
    return true;
  }

  // それ以外は恒久的エラーと判断（制約違反、NOT NULL違反など）
  return false;
}

/**
 * 指定したミリ秒だけ待機する
 *
 * @param ms 待機時間（ミリ秒）
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
