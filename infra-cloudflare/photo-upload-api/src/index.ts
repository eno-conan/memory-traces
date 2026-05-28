/**
 * Cloudflare Workers API for Photo Upload
 *
 * R2バケットへの画像アップロードとD1データベースへのメタデータ保存を提供します。
 */

import { retryWithExponentialBackoff, isR2RetryableError, isD1RetryableError } from './retry-utils';

interface Env {
  PHOTO_BUCKET: R2Bucket;
  DB: D1Database;
  API_TOKEN: string;
}

/**
 * タイミングセーフな文字列比較
 * タイミングアタック対策のため、crypto.subtle.timingSafeEqual() を使用
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufA = new TextEncoder().encode(a);
  const bufB = new TextEncoder().encode(b);

  return crypto.subtle.timingSafeEqual(bufA, bufB);
}

/**
 * Content-Typeから安全な拡張子をマッピング
 * クライアントから送られたファイル名に依存せず、検証済みのContent-Typeから拡張子を決定
 */
const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS対応
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    if (!timingSafeEqual(token, env.API_TOKEN)) {
      return jsonResponse({ error: 'Invalid token' }, 403);
    }

    try {
      // ルーティング
      if (path === '/upload' && request.method === 'POST') {
        return await handleUpload(request, env);
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
 * 画像アップロード処理
 */
async function handleUpload(request: Request, env: Env): Promise<Response> {
  const formData = await request.formData();
  const image = formData.get('image') as unknown as File;
  const userId = formData.get('userId') as string | null;
  const entryId = formData.get('entryId') as string | null;
  const photoId = formData.get('photoId') as string | null;
  const dateFolder = formData.get('dateFolder') as string | null;
  const timeFolder = formData.get('timeFolder') as string | null;
  const latitude = formData.get('latitude') as string | null;
  const longitude = formData.get('longitude') as string | null;
  const title = formData.get('title') as string | null;
  const thoughts = formData.get('thoughts') as string | null;
  const shotAt = formData.get('shotAt') as string | null;

  // 入力バリデーション
  if (!image) {
    return jsonResponse({ error: 'Image file is required' }, 400);
  }

  if (!userId || !entryId || !photoId || !dateFolder || !timeFolder) {
    return jsonResponse(
      { error: 'userId, entryId, photoId, dateFolder, timeFolder are required' },
      400
    );
  }

  if (!title || !title.trim()) {
    return jsonResponse({ error: 'title is required' }, 400);
  }

  // UUID形式のバリデーション
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId) || !uuidRegex.test(entryId) || !uuidRegex.test(photoId)) {
    return jsonResponse({ error: 'userId, entryId, and photoId must be valid UUIDs' }, 400);
  }

  // 日時フォルダ形式のバリデーション
  const dateFolderRegex = /^\d{8}$/;
  const timeFolderRegex = /^\d{9}$/;
  if (!dateFolderRegex.test(dateFolder) || !timeFolderRegex.test(timeFolder)) {
    return jsonResponse(
      { error: 'dateFolder must be yyyyMMdd, timeFolder must be hhMMssSSS' },
      400
    );
  }

  // ユーザー自動登録
  try {
    await ensureUserExists(env.DB, userId);
  } catch (error) {
    console.error('Failed to ensure user exists:', {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return jsonResponse({ error: 'Failed to register user' }, 500);
  }

  // ユニークなキーを生成（photoIdはフロントエンドから受け取る）
  // Content-Typeから拡張子を決定（ファイル名偽装対策）
  const timestamp = Date.now();
  const extension = EXTENSION_MAP[image.type] || 'jpg';
  const r2Key = `${userId}/${dateFolder}/${timeFolder}/${timestamp}-${photoId}.${extension}`;
  const r2Folder = `${userId}/${dateFolder}/${timeFolder}`;

  // R2にアップロード（リトライ処理適用）
  let imageBuffer: ArrayBuffer;
  try {
    imageBuffer = await retryWithExponentialBackoff(
      async () => {
        const buffer = await image.arrayBuffer();
        await env.PHOTO_BUCKET.put(r2Key, buffer, {
          httpMetadata: {
            contentType: image.type,
          },
          customMetadata: {
            photoId,
            userId,
            entryId,
            latitude: latitude || '',
            longitude: longitude || '',
            uploadedAt: new Date().toISOString(),
          },
        });
        return buffer;
      },
      { maxAttempts: 4, delays: [1000, 2000, 4000] },
      isR2RetryableError
    );
  } catch (error) {
    console.error('Failed to upload to R2 after retries:', {
      photoId,
      r2Key,
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse({ error: 'Failed to upload image' }, 500);
  }

  // travel_entries レコード作成（リトライ処理適用）
  try {
    await retryWithExponentialBackoff(
      async () => {
        await createTravelEntry(env.DB, entryId, userId, r2Folder, title.trim(), thoughts?.trim() || null, shotAt?.trim() || null);
      },
      { maxAttempts: 4, delays: [1000, 2000, 4000] },
      isD1RetryableError
    );
  } catch (error) {
    console.error('Failed to create travel entry after retries:', {
      entryId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    // R2からロールバック
    await env.PHOTO_BUCKET.delete(r2Key);
    return jsonResponse({ error: 'Failed to create travel entry' }, 500);
  }

  // D1にメタデータを保存（リトライ処理適用 + べき等性保証）
  try {
    await retryWithExponentialBackoff(
      async () => {
        // 存在チェック（べき等性保証）
        const existing = await env.DB.prepare('SELECT id FROM photo_metadata WHERE id = ?')
          .bind(photoId)
          .first();

        if (!existing) {
          const insertResult = await env.DB.prepare(
            `INSERT INTO photo_metadata (id, user_id, r2_key, latitude, longitude, entry_id, uploaded_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              photoId,
              userId,
              r2Key,
              latitude ? parseFloat(latitude) : null,
              longitude ? parseFloat(longitude) : null,
              entryId,
              new Date().toISOString()
            )
            .run();

          if (!insertResult.success) {
            throw new Error('D1 insert failed');
          }
        } else {
          console.log('Photo metadata already exists (idempotent operation):', { photoId });
        }
      },
      { maxAttempts: 4, delays: [1000, 2000, 4000] },
      isD1RetryableError
    );
  } catch (error) {
    console.error('Failed to save metadata after retries:', {
      photoId,
      entryId,
      error: error instanceof Error ? error.message : String(error),
    });
    // R2からロールバック
    await env.PHOTO_BUCKET.delete(r2Key);
    // travel_entriesから削除
    await env.DB.prepare('DELETE FROM travel_entries WHERE id = ?').bind(entryId).run();
    return jsonResponse({ error: 'Failed to save metadata' }, 500);
  }

  return jsonResponse({
    success: true,
    photoId,
    entryId,
    r2Key,
    location: latitude && longitude ? { lat: parseFloat(latitude), lng: parseFloat(longitude) } : null,
  });
}

/**
 * ユーザー自動登録
 * ユーザーが存在しない場合は自動的に登録する
 */
async function ensureUserExists(db: D1Database, userId: string): Promise<void> {
  // ユーザーの存在確認
  const existingUser = await db
    .prepare('SELECT id FROM users WHERE id = ?')
    .bind(userId)
    .first();

  if (!existingUser) {
    // ユーザーが存在しない場合は登録
    const insertResult = await db
      .prepare(
        `INSERT INTO users (id, email)
         VALUES (?, ?)`
      )
      .bind(userId, `${userId}@temp.local`)
      .run();

    if (!insertResult.success) {
      throw new Error('Failed to insert user');
    }
  }
}

/**
 * travel_entries レコード作成
 * 同じentryIdのレコードが既に存在する場合はtitleとthoughtsを更新
 */
async function createTravelEntry(
  db: D1Database,
  entryId: string,
  userId: string,
  r2Folder: string,
  title: string,
  thoughts: string | null,
  shotAt: string | null
): Promise<void> {
  // エントリーの存在確認
  const existingEntry = await db
    .prepare('SELECT id FROM travel_entries WHERE id = ?')
    .bind(entryId)
    .first();

  if (!existingEntry) {
    // エントリーが存在しない場合は作成
    const insertResult = await db
      .prepare(
        `INSERT INTO travel_entries (id, user_id, title, thoughts, r2_folder, shot_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        entryId,
        userId,
        title,
        thoughts,
        r2Folder,
        shotAt,
        new Date().toISOString(),
        new Date().toISOString()
      )
      .run();

    if (!insertResult.success) {
      throw new Error('Failed to insert travel entry');
    }
  } else {
    // エントリーが存在する場合はtitleとthoughtsとshot_atを更新
    const updateResult = await db
      .prepare(
        `UPDATE travel_entries
         SET title = ?, thoughts = ?, shot_at = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(
        title,
        thoughts,
        shotAt,
        new Date().toISOString(),
        entryId
      )
      .run();

    if (!updateResult.success) {
      throw new Error('Failed to update travel entry');
    }
  }
}

/**
 * JSON レスポンスヘルパー
 * セキュリティヘッダ（X-Content-Type-Options, X-Frame-Options）を含む
 */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  });
}
