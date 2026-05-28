import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { amplifyConfig } from '@/amplify-config';
import exifr from 'exifr';
import { logError, logWarning, logCheckpoint } from '@/app/utils/logger';
import { Redis } from '@upstash/redis';

const { runWithAmplifyServerContext } = createServerRunner({
  config: amplifyConfig,
});

// Upstash Redis クライアントを初期化
const redis = Redis.fromEnv();

/**
 * マジックバイト検証関数
 * Content-Type偽装を防ぐため、ファイルの実際の内容を検証
 */
function isValidImageFile(buffer: Buffer): boolean {
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }

  // HEIC/HEIF: "ftyp" at offset 4
  if (buffer.length >= 12) {
    const ftypCheck = buffer.slice(4, 8).toString('ascii');
    if (ftypCheck === 'ftyp') {
      const brand = buffer.slice(8, 12).toString('ascii');
      if (brand.startsWith('heic') || brand.startsWith('heif') || brand.startsWith('mif1')) {
        return true;
      }
    }
  }

  return false;
}

/**
 * セキュリティレスポンスヘッダを作成
 * MIME Sniffing攻撃とClickjacking攻撃を防止
 */
function createSecureHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
}

export async function POST(req: NextRequest) {
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    logCheckpoint('REQUEST_START', {
      userAgent,
      contentType: req.headers.get('content-type'),
    });

    // Amplifyサーバーコンテキストで認証セッションを取得
    const session = await runWithAmplifyServerContext({
      nextServerContext: { request: req, cookies },
      operation: async (contextSpec) => {
        return await fetchAuthSession(contextSpec);
      },
    });

    // 認証チェック
    if (!session.tokens?.idToken) {
      logWarning('認証失敗', {
        userAgent,
        timestamp: new Date().toISOString(),
        phase: 'validation',
        errorCode: 'UNAUTHORIZED',
      });
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401, headers: createSecureHeaders() }
      );
    }

    // ユーザーID取得(Cognito sub)
    const userId = session.tokens.idToken.payload.sub as string;

    logCheckpoint('AUTH_SUCCESS', { userId });

    // レート制限チェック（1分間に10リクエストまで）
    try {
      const rateLimitKey = `rate-limit:upload:${userId}`;
      const uploadCount = await redis.incr(rateLimitKey);

      if (uploadCount === 1) {
        // 初回リクエストの場合、TTLを設定（60秒）
        await redis.expire(rateLimitKey, 60);
      }

      const RATE_LIMIT = 10; // 1分間に10リクエストまで
      if (uploadCount > RATE_LIMIT) {
        logWarning('レート制限超過', {
          userId,
          uploadCount,
          timestamp: new Date().toISOString(),
          phase: 'rate-limit',
          errorCode: 'RATE_LIMIT_EXCEEDED',
        });
        return NextResponse.json(
          { error: 'アップロード回数が上限を超えました。しばらく待ってから再試行してください。' },
          { status: 429, headers: createSecureHeaders() }
        );
      }
    } catch (redisError) {
      // Redis接続エラーの場合、警告を出すが処理は続行
      logWarning('レート制限Redisエラー', {
        userId,
        error: redisError instanceof Error ? redisError.message : String(redisError),
        timestamp: new Date().toISOString(),
        phase: 'rate-limit',
        errorCode: 'REDIS_CONNECTION_ERROR',
      });
      // 本番環境ではエラーを返すべきだが、開発環境では続行を許可
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'レート制限サービスが利用できません' },
          { status: 503, headers: createSecureHeaders() }
        );
      }
    }

    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const photoId = formData.get('photoId') as string;
    const title = formData.get('title') as string;
    const thoughts = formData.get('thoughts') as string;
    const shotAt = formData.get('shotAt') as string;
    const clientLatitude = formData.get('latitude') as string | null;
    const clientLongitude = formData.get('longitude') as string | null;

    // フロントエンドから受け取ったentryIdと日時フォルダ
    const entryId = formData.get('entryId') as string;
    const dateFolder = formData.get('dateFolder') as string;
    const timeFolder = formData.get('timeFolder') as string;

    // バリデーション
    if (!entryId || !photoId || !dateFolder || !timeFolder) {
      return NextResponse.json(
        { error: 'entryId, photoId, dateFolder, timeFolderは必須です' },
        { status: 400, headers: createSecureHeaders() }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(entryId) || !uuidRegex.test(photoId)) {
      return NextResponse.json(
        { error: 'entryIdとphotoIdはUUID形式である必要があります' },
        { status: 400, headers: createSecureHeaders() }
      );
    }

    const dateFolderRegex = /^\d{8}$/;
    const timeFolderRegex = /^\d{9}$/;
    if (!dateFolderRegex.test(dateFolder) || !timeFolderRegex.test(timeFolder)) {
      return NextResponse.json(
        { error: 'dateFolder/timeFolderの形式が不正です' },
        { status: 400, headers: createSecureHeaders() }
      );
    }

    if (!imageFile) {
      return NextResponse.json(
        { error: '画像ファイルが必要です' },
        { status: 400, headers: createSecureHeaders() }
      );
    }

    // ファイルサイズチェック（10MB制限）
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (imageFile.size > MAX_FILE_SIZE) {
      logWarning('ファイルサイズ超過', {
        fileSize: imageFile.size,
        fileName: imageFile.name,
        fileType: imageFile.type,
        userId,
        timestamp: new Date().toISOString(),
        phase: 'validation',
        errorCode: 'FILE_TOO_LARGE',
      });
      return NextResponse.json(
        { error: `ファイルサイズが大きすぎます（最大10MB）` },
        { status: 400, headers: createSecureHeaders() }
      );
    }

    // Content-Type検証
    const ALLOWED_IMAGE_TYPES = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/heic',
      'image/heif',
    ];

    if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
      logWarning('不正なContent-Type', {
        fileType: imageFile.type,
        fileName: imageFile.name,
        userId,
        timestamp: new Date().toISOString(),
        phase: 'validation',
        errorCode: 'INVALID_CONTENT_TYPE',
      });
      return NextResponse.json(
        { error: `サポートされていない画像形式です（${imageFile.type}）` },
        { status: 400, headers: createSecureHeaders() }
      );
    }

    // 画像ファイルをBufferに変換（マジックバイト検証のため早期に実行）
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    // マジックバイト検証（Content-Type偽装対策）
    if (!isValidImageFile(imageBuffer)) {
      logWarning('マジックバイト検証失敗', {
        fileType: imageFile.type,
        fileName: imageFile.name,
        fileSize: imageFile.size,
        userId,
        timestamp: new Date().toISOString(),
        phase: 'validation',
        errorCode: 'INVALID_FILE_SIGNATURE',
      });
      return NextResponse.json(
        { error: '無効な画像ファイルです' },
        { status: 400, headers: createSecureHeaders() }
      );
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'タイトルは必須です' },
        { status: 400, headers: createSecureHeaders() }
      );
    }

    if (!shotAt || !shotAt.trim()) {
      return NextResponse.json(
        { error: '撮影日は必須です' },
        { status: 400, headers: createSecureHeaders() }
      );
    }

    // ISO 8601形式の検証
    const shotAtDate = new Date(shotAt);
    if (isNaN(shotAtDate.getTime())) {
      return NextResponse.json(
        { error: '撮影日の形式が不正です' },
        { status: 400, headers: createSecureHeaders() }
      );
    }

    // 未来日付の検証
    if (shotAtDate > new Date()) {
      return NextResponse.json(
        { error: '撮影日は未来の日付にできません' },
        { status: 400, headers: createSecureHeaders() }
      );
    }

    // 位置情報の取得（クライアント側のデータを優先）
    let location: { lat: number; lng: number } | null = null;

    if (clientLatitude && clientLongitude) {
      // クライアント側で抽出した位置情報を使用
      location = {
        lat: parseFloat(clientLatitude),
        lng: parseFloat(clientLongitude),
      };
      logCheckpoint('LOCATION_FROM_CLIENT', { location });
    } else {
      // フォールバック: サーバー側でEXIF情報を抽出
      try {
        const exifData = (await exifr.parse(imageBuffer)) as { latitude?: number; longitude?: number } | undefined;
        if (exifData?.latitude && exifData?.longitude) {
          location = {
            lat: exifData.latitude,
            lng: exifData.longitude,
          };
          logCheckpoint('LOCATION_FROM_EXIF', { location });
        } else {
          logWarning('EXIF位置情報なし', {
            userId,
            fileSize: imageFile.size,
            fileType: imageFile.type,
            timestamp: new Date().toISOString(),
            phase: 'upload',
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (exifError) {
        logWarning('EXIF抽出エラー', {
          userId,
          fileSize: imageFile.size,
          fileType: imageFile.type,
          timestamp: new Date().toISOString(),
          phase: 'upload',
        });
      }
    }

    // Cloudflare Workers APIにアップロード
    const workersApiUrl = process.env.CLOUDFLARE_UPLOAD_API_URL || process.env.CLOUDFLARE_WORKERS_API_URL;
    const workersApiToken = process.env.CLOUDFLARE_WORKERS_API_TOKEN;

    if (!workersApiUrl || !workersApiToken) {
      logWarning('Cloudflare Workers API設定が見つかりません', {
        userId,
        timestamp: new Date().toISOString(),
        phase: 'cloudflare',
        errorCode: 'CONFIG_MISSING',
      });

      // 本番環境では設定が必須
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          {
            error: 'アップロード設定が不完全です',
          },
          { status: 500, headers: createSecureHeaders() }
        );
      }
    } else {
      const uploadForm = new FormData();
      uploadForm.append('image', new Blob([imageBuffer]), imageFile.name);
      uploadForm.append('userId', userId);
      uploadForm.append('entryId', entryId);
      uploadForm.append('photoId', photoId);
      uploadForm.append('dateFolder', dateFolder);
      uploadForm.append('timeFolder', timeFolder);
      uploadForm.append('title', title.trim());
      if (thoughts && thoughts.trim()) {
        uploadForm.append('thoughts', thoughts.trim());
      }
      uploadForm.append('shotAt', shotAt.trim());
      if (location) {
        uploadForm.append('latitude', location.lat.toString());
        uploadForm.append('longitude', location.lng.toString());
      }

      // タイムアウト設定（40秒）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000);

      try {
        const workersResponse = await fetch(`${workersApiUrl}/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${workersApiToken}`,
          },
          body: uploadForm,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!workersResponse.ok) {
          const errorText = await workersResponse.text();
          logError(
            'Cloudflare Workers APIエラー',
            new Error(errorText),
            {
              userId,
              fileSize: imageFile.size,
              fileType: imageFile.type,
              timestamp: new Date().toISOString(),
              phase: 'cloudflare',
              errorCode: 'API_ERROR',
            }
          );
          throw new Error(
            'Cloudflare Workers APIへのアップロードに失敗しました'
          );
        }

        logCheckpoint('CLOUDFLARE_UPLOAD_SUCCESS', {
          userId,
          fileSize: imageFile.size,
        });
      } catch (error) {
        clearTimeout(timeoutId);

        // タイムアウトエラーの処理
        if (error instanceof Error && error.name === 'AbortError') {
          logError('Cloudflare Workers APIタイムアウト', error, {
            userId,
            fileSize: imageFile.size,
            timestamp: new Date().toISOString(),
            phase: 'cloudflare',
            errorCode: 'TIMEOUT',
          });
          throw new Error(
            'Cloudflare Workers APIへのリクエストがタイムアウトしました（40秒）'
          );
        }

        throw error;
      }
    }

    return NextResponse.json(
      {
        success: true,
        location,
        message: location
          ? '位置情報付きでアップロードが完了しました'
          : '位置情報なしでアップロードが完了しました',
      },
      { headers: createSecureHeaders() }
    );
  } catch (error) {
    logError('アップロード処理エラー', error, {
      userAgent,
      timestamp: new Date().toISOString(),
      phase: 'upload',
      errorCode: 'UPLOAD_FAILED',
    });

    return NextResponse.json(
      { error: 'アップロード処理に失敗しました' },
      { status: 500, headers: createSecureHeaders() }
    );
  }
}
