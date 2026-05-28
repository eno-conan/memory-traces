import { NextRequest, NextResponse } from 'next/server';

interface ClientErrorPayload {
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: {
    fileSize?: number;
    fileType?: string;
    fileName?: string;
    userAgent: string;
    timestamp: string;
    phase: string;
  };
}

/**
 * クライアント側のエラーをサーバーログに記録するエンドポイント
 * スマホでのエラー追跡に必須
 */
export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ClientErrorPayload;

    // クライアントエラーを構造化ログとして出力
    console.error(
      JSON.stringify({
        level: 'CLIENT_ERROR',
        error: payload.error,
        context: payload.context,
        timestamp: new Date().toISOString(),
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log client error:', error);
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
}
