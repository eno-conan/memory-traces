/**
 * Cloudflare Workers API for Travel Entry Deletion
 *
 * 旅行エントリーの削除APIを提供します。
 * D1レコード削除とR2オブジェクトのクリーンアップを実行します。
 */

import { retryWithExponentialBackoff, isR2RetryableError, isD1RetryableError } from './retry-utils';

interface Env {
  PHOTO_BUCKET: R2Bucket;
  DB: D1Database;
  API_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS対応
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== env.API_TOKEN) {
      return jsonResponse({ error: 'Invalid token' }, 403);
    }

    try {
      // ルーティング
      if (path.startsWith('/travel-entries/') && path !== '/travel-entries/' && request.method === 'DELETE') {
        return await handleDeleteTravelEntry(request, env);
      } else if (path === '/health' && request.method === 'GET') {
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
      } else {
        return jsonResponse({ error: 'Not found' }, 404);
      }
    } catch (error) {
      console.error('Error:', error);
      return jsonResponse(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  },
};

/**
 * 旅行エントリー削除処理
 *
 * 削除順序（DB先行 + R2ベストエフォートクリーンアップ）:
 * 1. エントリーの存在確認と所有権チェック
 * 2. 関連するphoto_metadataレコードを取得（R2キーの収集）
 * 3. D1バッチでphoto_metadata削除 + travel_entries削除（アトミック）
 * 4. R2オブジェクトのクリーンアップ（ベストエフォート）
 */
async function handleDeleteTravelEntry(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const entryId = pathSegments[pathSegments.length - 1];

  if (!entryId) {
    return jsonResponse({ error: 'Entry ID is required' }, 400);
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(entryId)) {
    return jsonResponse({ error: 'Invalid entry ID format' }, 400);
  }

  // リクエストBodyからuserId取得（所有権検証用）
  let userId: string;
  try {
    const body = await request.json() as { userId?: string };
    if (!body.userId || !uuidRegex.test(body.userId)) {
      return jsonResponse({ error: 'Valid userId is required' }, 400);
    }
    userId = body.userId;
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  // Step 1: エントリーの存在確認と所有権チェック
  const entry = await env.DB.prepare(
    'SELECT id, user_id FROM travel_entries WHERE id = ?'
  )
    .bind(entryId)
    .first<{ id: string; user_id: string }>();

  if (!entry) {
    return jsonResponse({ error: 'Entry not found' }, 404);
  }

  if (entry.user_id !== userId) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  // Step 2: 関連するphoto_metadataレコードを取得
  const photosResult = await env.DB.prepare(
    'SELECT id, r2_key FROM photo_metadata WHERE entry_id = ?'
  )
    .bind(entryId)
    .all<{ id: string; r2_key: string }>();

  const photos = photosResult.results || [];

  // Step 3: D1バッチでアトミック削除
  try {
    const batchStatements: D1PreparedStatement[] = [];

    if (photos.length > 0) {
      batchStatements.push(
        env.DB.prepare('DELETE FROM photo_metadata WHERE entry_id = ?').bind(entryId)
      );
    }

    batchStatements.push(
      env.DB.prepare('DELETE FROM travel_entries WHERE id = ? AND user_id = ?').bind(entryId, userId)
    );

    await retryWithExponentialBackoff(
      async () => {
        await env.DB.batch(batchStatements);
      },
      { maxAttempts: 3, delays: [1000, 2000] },
      isD1RetryableError
    );
  } catch (error) {
    console.error('Failed to delete entry from D1:', {
      entryId,
      userId,
      photoCount: photos.length,
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse({ error: 'Failed to delete entry' }, 500);
  }

  // Step 4: R2オブジェクトのベストエフォートクリーンアップ
  if (photos.length > 0) {
    const r2Errors: Array<{ r2Key: string; error: string }> = [];

    await Promise.allSettled(
      photos.map(async (photo) => {
        try {
          await retryWithExponentialBackoff(
            async () => {
              await env.PHOTO_BUCKET.delete(photo.r2_key);
            },
            { maxAttempts: 2, delays: [500] },
            isR2RetryableError
          );
        } catch (error) {
          r2Errors.push({
            r2Key: photo.r2_key,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })
    );

    if (r2Errors.length > 0) {
      console.error('R2 cleanup partially failed (orphaned objects):', {
        entryId,
        userId,
        failedKeys: r2Errors,
        successCount: photos.length - r2Errors.length,
        totalCount: photos.length,
      });
    }
  }

  return jsonResponse({
    success: true,
    deletedPhotos: photos.length,
  });
}

/**
 * JSON レスポンスヘルパー
 */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
