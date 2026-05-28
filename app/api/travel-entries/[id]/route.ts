import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { amplifyConfig } from '@/amplify-config';
import { logError, logCheckpoint } from '@/app/utils/logger';

const { runWithAmplifyServerContext } = createServerRunner({
  config: amplifyConfig,
});

/**
 * 旅行エントリー削除APIエンドポイント
 *
 * 認証チェック後、Cloudflare Workers APIに削除リクエストを転送します。
 * Workers側でD1レコード削除とR2オブジェクトクリーンアップを実行します。
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: entryId } = await params;

    // 入力バリデーション
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!entryId || !uuidRegex.test(entryId)) {
      return NextResponse.json(
        { error: 'エントリーIDの形式が不正です' },
        { status: 400 }
      );
    }

    // 認証チェック
    const session = await runWithAmplifyServerContext({
      nextServerContext: { request, cookies },
      operation: async (contextSpec) => {
        return await fetchAuthSession(contextSpec);
      },
    });

    if (!session.tokens?.idToken) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const userId = session.tokens.idToken.payload.sub as string;

    logCheckpoint('DELETE_REQUEST', { userId, entryId });

    // Cloudflare Workers APIへのリクエスト
    const cloudflareApiUrl = process.env.CLOUDFLARE_DELETE_API_URL || process.env.CLOUDFLARE_WORKERS_API_URL;
    const cloudflareApiToken = process.env.CLOUDFLARE_WORKERS_API_TOKEN;

    if (!cloudflareApiUrl || !cloudflareApiToken) {
      logError(
        'Cloudflare API環境変数が設定されていません',
        new Error('CONFIG_MISSING'),
        { userId, timestamp: new Date().toISOString(), phase: 'cloudflare', errorCode: 'CONFIG_MISSING' }
      );
      return NextResponse.json(
        { error: 'サーバー設定エラー' },
        { status: 500 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const workersResponse = await fetch(
        `${cloudflareApiUrl}/travel-entries/${entryId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${cloudflareApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!workersResponse.ok) {
        if (workersResponse.status === 404) {
          return NextResponse.json(
            { error: 'エントリーが見つかりません' },
            { status: 404 }
          );
        }
        if (workersResponse.status === 403) {
          return NextResponse.json(
            { error: 'このエントリーを削除する権限がありません' },
            { status: 403 }
          );
        }

        const errorData = await workersResponse.json().catch(() => ({})) as Record<string, unknown>;
        logError(
          'Cloudflare Workers削除APIエラー',
          new Error(JSON.stringify(errorData)),
          { userId, timestamp: new Date().toISOString(), phase: 'cloudflare', errorCode: 'DELETE_FAILED' }
        );
        return NextResponse.json(
          { error: '削除処理に失敗しました' },
          { status: 500 }
        );
      }

      logCheckpoint('DELETE_SUCCESS', { userId, entryId });

      return NextResponse.json({ success: true });
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        logError(
          'Cloudflare Workers削除APIタイムアウト',
          error,
          { userId, timestamp: new Date().toISOString(), phase: 'cloudflare', errorCode: 'TIMEOUT' }
        );
        return NextResponse.json(
          { error: '削除処理がタイムアウトしました' },
          { status: 504 }
        );
      }
      throw error;
    }
  } catch (error) {
    logError(
      'エントリー削除エラー',
      error,
      { timestamp: new Date().toISOString(), phase: 'cloudflare', errorCode: 'DELETE_ERROR' }
    );
    return NextResponse.json(
      { error: '削除処理に失敗しました' },
      { status: 500 }
    );
  }
}
