import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { amplifyConfig } from '@/amplify-config';
import type { TravelEntriesResponse, TravelEntry, CloudflareWorkersResponse, CloudflareEntry } from './types';

const { runWithAmplifyServerContext } = createServerRunner({
  config: amplifyConfig,
});

/**
 * 旅行エントリー一覧取得APIエンドポイント
 *
 * Cloudflare Workers APIからエントリーデータを取得し、
 * 各エントリーの画像にR2署名付きURLを付与して返却します。
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await runWithAmplifyServerContext({
      nextServerContext: { request, cookies },
      operation: async (contextSpec) => {
        return await fetchAuthSession(contextSpec);
      },
    });

    if (!session.tokens?.idToken) {
      return NextResponse.json(
        { success: false, error: '認証が必要です', entries: [], pagination: { currentPage: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasMore: false } },
        { status: 401 }
      );
    }

    const userId = session.tokens.idToken.payload.sub as string;

    // リクエストパラメータのバリデーション
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const yearParam = searchParams.get('year');
    const keywordParam = searchParams.get('keyword');

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const pageSize = pageSizeParam
      ? Math.min(50, Math.max(1, parseInt(pageSizeParam, 10)))
      : 10;

    if (isNaN(page) || isNaN(pageSize)) {
      return NextResponse.json(
        { success: false, error: 'ページ番号またはページサイズが不正です', entries: [], pagination: { currentPage: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasMore: false } },
        { status: 400 }
      );
    }

    // Cloudflare Workers APIへのリクエスト
    const cloudflareApiUrl = process.env.CLOUDFLARE_LIST_API_URL || process.env.CLOUDFLARE_WORKERS_API_URL;
    const cloudflareApiToken = process.env.CLOUDFLARE_WORKERS_API_TOKEN;

    if (!cloudflareApiUrl || !cloudflareApiToken) {
      console.error('Cloudflare API環境変数が設定されていません');
      return NextResponse.json(
        { success: false, error: 'サーバー設定エラー', entries: [], pagination: { currentPage: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasMore: false } },
        { status: 500 }
      );
    }

    const apiUrl = new URL('/travel-entries', cloudflareApiUrl);
    apiUrl.searchParams.set('userId', userId);
    apiUrl.searchParams.set('page', page.toString());
    apiUrl.searchParams.set('pageSize', pageSize.toString());

    // 検索パラメータを追加
    if (yearParam) {
      apiUrl.searchParams.set('year', yearParam);
    }
    if (keywordParam) {
      apiUrl.searchParams.set('keyword', keywordParam);
    }

    const workersResponse = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cloudflareApiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!workersResponse.ok) {
      if (workersResponse.status === 401 || workersResponse.status === 403) {
        console.error('Cloudflare API認証エラー');
        return NextResponse.json(
          { success: false, error: 'API認証エラー', entries: [], pagination: { currentPage: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasMore: false } },
          { status: 500 }
        );
      }

      console.error('Cloudflare APIエラー:', workersResponse.status);
      return NextResponse.json(
        { success: false, error: 'データ取得エラー', entries: [], pagination: { currentPage: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasMore: false } },
        { status: 500 }
      );
    }

    const workersData = (await workersResponse.json()) as CloudflareWorkersResponse;

    if (!workersData.success) {
      console.error('Cloudflare API処理エラー:', workersData.error);
      return NextResponse.json(
        { success: false, error: 'データ処理エラー', entries: [], pagination: { currentPage: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasMore: false } },
        { status: 500 }
      );
    }

    // Workers から受け取った Public URL をそのまま返却
    const response: TravelEntriesResponse = {
      success: true,
      entries: workersData.entries.map((entry: CloudflareEntry): TravelEntry => ({
        id: entry.id,
        title: entry.title,
        thoughts: entry.thoughts || '',
        shotAt: entry.shotAt ?? null,
        location: entry.location,
        photos: (entry.photos || []).map(p => ({
          id: p.id,
          url: p.url,
          r2Key: p.r2_key,
          latitude: p.latitude,
          longitude: p.longitude,
        })),
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      })),
      pagination: workersData.pagination,
    };

    // キャッシュ時間延長（CDN直配信により安全）
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('旅行エントリー取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: '旅行エントリーを取得できませんでした',
        entries: [],
        pagination: {
          currentPage: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 0,
          hasMore: false,
        },
      } as TravelEntriesResponse,
      { status: 500 }
    );
  }
}
