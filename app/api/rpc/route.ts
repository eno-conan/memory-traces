import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { amplifyConfig } from '@/amplify-config';
import type { DashboardRequestBody } from '@/types/dashboard-request-body';

// Cap'n Web用Lambda関数を実行できるグループ
const ALLOWED_GROUPS = ['lambda-executors', 'capnweb-users'];

// Lambda関数のレスポンス型定義
interface UserInfoResponse {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed';
}

interface UserProjectsResponse {
  userId: string;
  projects: Project[];
}

interface ProjectStatsResponse {
  projectId: string;
  stats: {
    totalTasks: number;
    completedTasks: number;
    activeDevelopers: number;
    lastUpdate: string;
  };
}

interface Activity {
  type: 'commit' | 'pull_request' | 'issue' | 'comment';
  count: number;
}

interface UserActivityResponse {
  userId: string;
  timeRange: string;
  activities: Activity[];
  lastActivity: string;
}

const { runWithAmplifyServerContext } = createServerRunner({
  config: amplifyConfig,
});

/**
 * Cap'n Web風のバッチRPC API
 * プロミス・パイプライニングをシミュレート：
 * - 複数のRPC呼び出しを1回のHTTPリクエストで送信
 * - サーバー側で並列実行して最適化
 * - 依存関係を解決しながら効率的に処理
 */
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Amplifyサーバーコンテキストで認証セッションを取得
    const session = await runWithAmplifyServerContext({
      nextServerContext: { request, cookies },
      operation: async (contextSpec) => {
        return await fetchAuthSession(contextSpec);
      },
    });

    // 認証チェック
    if (!session.tokens?.idToken) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザー情報を取得
    const userId = session.tokens.idToken.payload.sub as string;

    // 認可チェック: lambda-executorsまたはcapnweb-usersグループに所属している必要がある
    const groups = session.tokens.idToken.payload['cognito:groups'] as string[] | undefined;

    const hasPermission = groups && ALLOWED_GROUPS.some(group => groups.includes(group));

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: '実行権限がありません',
          message: `このユーザーは${ALLOWED_GROUPS.join('または')}グループに所属していません`,
        },
        { status: 403 }
      );
    }

    // Lambda クライアントを作成
    const lambdaClient = new LambdaClient({
      region: process.env.AWS_REGION || 'ap-northeast-1',
      credentials: {
        accessKeyId: session.credentials?.accessKeyId || '',
        secretAccessKey: session.credentials?.secretAccessKey || '',
        sessionToken: session.credentials?.sessionToken || '',
      },
    });

    const body = (await request.json()) as DashboardRequestBody;
    const { action } = body;

    if (action === 'getDashboardData') {
      // Cap'n Web方式: すべてのLambda呼び出しを並列実行
      // プロミス・パイプライニングをシミュレート

      // 1. まず独立した呼び出しを並列実行
      const [userInfoResponse, userActivityResponse] = await Promise.all([
        lambdaClient.send(new InvokeCommand({
          FunctionName: process.env.LAMBDA_GET_USER_INFO_NAME,
          Payload: JSON.stringify({ userId }),
        })),
        lambdaClient.send(new InvokeCommand({
          FunctionName: process.env.LAMBDA_GET_USER_ACTIVITY_NAME,
          Payload: JSON.stringify({ userId, timeRange: '7d' }),
        })),
      ]);

      const userInfo = JSON.parse(new TextDecoder().decode(userInfoResponse.Payload)) as UserInfoResponse;
      const userActivity = JSON.parse(new TextDecoder().decode(userActivityResponse.Payload)) as UserActivityResponse;

      // 2. 次に、userInfoに依存するgetUserProjectsを実行
      const userProjectsResponse = await lambdaClient.send(new InvokeCommand({
        FunctionName: process.env.LAMBDA_GET_USER_PROJECTS_NAME,
        Payload: JSON.stringify({ userId: userInfo.userId }),
      }));
      const userProjects = JSON.parse(new TextDecoder().decode(userProjectsResponse.Payload)) as UserProjectsResponse;

      // 3. 最後に、各プロジェクトの統計を並列取得
      const projectStatsPromises = userProjects.projects.map(async (project: Project) => {
        const response = await lambdaClient.send(new InvokeCommand({
          FunctionName: process.env.LAMBDA_GET_PROJECT_STATS_NAME,
          Payload: JSON.stringify({ projectId: project.id }),
        }));
        return JSON.parse(new TextDecoder().decode(response.Payload)) as ProjectStatsResponse;
      });
      const projectStats: ProjectStatsResponse[] = await Promise.all(projectStatsPromises);

      const totalTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        method: 'capnweb-batch',
        executionTime: totalTime,
        data: {
          userInfo,
          userProjects,
          projectStats,
          userActivity,
        },
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error(`Cap'n Web RPC error:`, error);
    return NextResponse.json(
      {
        error: 'RPC呼び出しに失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}
