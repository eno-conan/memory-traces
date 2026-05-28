/**
 * Cloudflare Workers API for Travel Entries (Read)
 *
 * 旅行エントリーの一覧取得APIを提供します。
 */

interface Env {
  DB: D1Database;
  API_TOKEN: string;
  R2_PUBLIC_URL: string;
}

interface TravelEntry {
  id: string;
  user_id: string;
  title: string;
  thoughts: string | null;
  shot_at: string | null;
  r2_folder: string;
  created_at: string;
  updated_at: string;
}

interface PhotoMetadata {
  id: string;
  user_id: string;
  r2_key: string;
  latitude?: number;
  longitude?: number;
  uploaded_at: string;
  entry_id?: string | null;
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
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
      if (path === '/travel-entries' && request.method === 'GET') {
        return await handleGetTravelEntries(request, env);
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
 * 旅行エントリー一覧取得（ページング対応）
 */
async function handleGetTravelEntries(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('pageSize') || '10', 10)));

  // ユーザーIDの検証
  if (!userId) {
    return jsonResponse({ error: 'userId is required' }, 400);
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return jsonResponse({ error: 'Invalid userId format' }, 400);
  }

  // 検索パラメータの取得
  const year = url.searchParams.get('year');
  const keyword = url.searchParams.get('keyword');

  // yearバリデーション
  if (year && !/^\d{4}$/.test(year)) {
    return jsonResponse({ error: 'Invalid year format: must be 4 digits' }, 400);
  }
  if (year) {
    const yearNum = parseInt(year, 10);
    if (yearNum < 1900 || yearNum > 2100) {
      return jsonResponse({ error: 'Invalid year: must be between 1900 and 2100' }, 400);
    }
  }

  // keywordのトリム
  const trimmedKeyword = keyword?.trim() || null;

  // WHERE句の動的構築
  const whereClauses: string[] = ['user_id = ?'];
  const bindParams: (string | number)[] = [userId];

  if (year) {
    whereClauses.push("strftime('%Y', created_at) = ?");
    bindParams.push(year);
  }

  if (trimmedKeyword) {
    whereClauses.push('(title LIKE ? OR (thoughts IS NOT NULL AND thoughts LIKE ?))');
    bindParams.push(`%${trimmedKeyword}%`, `%${trimmedKeyword}%`);
  }

  const whereClause = whereClauses.join(' AND ');

  try {
    // 総件数取得
    const countResult = await env.DB.prepare(
      `SELECT COUNT(*) as total FROM travel_entries WHERE ${whereClause}`
    )
      .bind(...bindParams)
      .first<{ total: number }>();

    const totalCount = countResult?.total || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;

    // エントリー取得
    const entriesResult = await env.DB.prepare(
      `SELECT id, user_id, title, shot_at, thoughts, r2_folder, created_at, updated_at
       FROM travel_entries
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...bindParams, pageSize, offset)
      .all<TravelEntry>();

    const entries = entriesResult.results || [];

    if (entries.length === 0) {
      return jsonResponse(
        {
          success: true,
          entries: [],
          pagination: {
            currentPage: page,
            pageSize,
            totalCount,
            totalPages,
            hasMore: false,
          },
        },
        200,
        { 'Cache-Control': 'max-age=5, stale-while-revalidate=30' }
      );
    }

    // 各エントリーの全画像取得（アップロード順）
    const entryIds = entries.map(e => e.id);
    const placeholders = entryIds.map(() => '?').join(', ');

    const photosResult = await env.DB.prepare(
      `SELECT entry_id, id, r2_key, latitude, longitude, uploaded_at
       FROM photo_metadata
       WHERE entry_id IN (${placeholders})
         AND entry_id IS NOT NULL
       ORDER BY uploaded_at ASC`
    )
      .bind(...entryIds)
      .all<PhotoMetadata>();

    const photos = photosResult.results || [];
    const photosByEntryId = new Map<string, { id: string; r2_key: string; latitude?: number; longitude?: number; uploaded_at: string }[]>();
    for (const p of photos) {
      if (!p.entry_id) continue;
      const list = photosByEntryId.get(p.entry_id) || [];
      list.push({ id: p.id, r2_key: p.r2_key, latitude: p.latitude, longitude: p.longitude, uploaded_at: p.uploaded_at });
      photosByEntryId.set(p.entry_id, list);
    }

    // R2 Public Base URL 取得
    const r2PublicBaseUrl = env.R2_PUBLIC_URL;

    // データマージ（Public URL付与）
    const entriesWithPhotos = entries.map(entry => {
      const photoList = photosByEntryId.get(entry.id) || [];

      // 最初の画像の位置情報を使用（既存動作維持）
      const firstPhoto = photoList[0];
      let location: { latitude: number; longitude: number } | undefined;
      if (firstPhoto?.latitude != null && firstPhoto?.longitude != null) {
        location = {
          latitude: firstPhoto.latitude,
          longitude: firstPhoto.longitude,
        };
      }

      return {
        id: entry.id,
        userId: entry.user_id,
        title: entry.title,
        shotAt: entry.shot_at ?? null,
        thoughts: entry.thoughts || '',
        location,
        photos: photoList.map(p => ({
          id: p.id,
          r2_key: p.r2_key,
          url: `${r2PublicBaseUrl}/${p.r2_key}`,
          latitude: p.latitude,
          longitude: p.longitude,
        })),
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      };
    });

    return jsonResponse(
      {
        success: true,
        entries: entriesWithPhotos,
        pagination: {
          currentPage: page,
          pageSize,
          totalCount,
          totalPages,
          hasMore: page < totalPages,
        },
      },
      200,
      { 'Cache-Control': 'max-age=5, stale-while-revalidate=30' }
    );
  } catch (error) {
    console.error('Failed to fetch travel entries:', {
      userId,
      year,
      keyword: trimmedKeyword,
      page,
      pageSize,
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse({ error: 'Failed to fetch travel entries' }, 500);
  }
}

/**
 * JSON レスポンスヘルパー
 */
function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders?: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });
}
