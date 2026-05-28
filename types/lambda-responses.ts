// Lambda関数のレスポンス型定義
// このファイルは `.claude/rules/lambda-type-safety.md` のガイドラインに従い、
// すべてのLambda関数のレスポンスに適切な型定義を提供します

// ユーザー情報
export interface UserInfoResponse {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

// プロジェクト
export interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed';
}

export interface UserProjectsResponse {
  userId: string;
  projects: Project[];
}

// プロジェクト統計
export interface ProjectStatsResponse {
  projectId: string;
  stats: {
    totalTasks: number;
    completedTasks: number;
    activeDevelopers: number;
    lastUpdate: string;
  };
}

// ユーザーアクティビティ
export interface Activity {
  type: 'commit' | 'pull_request' | 'issue' | 'comment';
  count: number;
}

export interface UserActivityResponse {
  userId: string;
  timeRange: string;
  activities: Activity[];
  lastActivity: string;
}

// ダッシュボードデータ（全てのレスポンスを組み合わせたもの）
export interface DashboardData {
  userInfo: UserInfoResponse;
  userProjects: UserProjectsResponse;
  projectStats: ProjectStatsResponse[];
  userActivity: UserActivityResponse;
}

// API レスポンス（ダッシュボードAPIの完全なレスポンス）
export interface DashboardApiResponse {
  success: boolean;
  method: string;
  executionTime: number;
  data: DashboardData;
}

// /api/call-lambda API のレスポンス型定義

// 成功レスポンス (200 OK)
export interface CallLambdaSuccessResponse {
  success: true;
  message: string;
  userId: string;
  userEmail: string;
  lambdaResponse: unknown; // Lambda関数の戻り値（構造が動的）
}

// エラーレスポンス (403 Forbidden)
export interface CallLambdaForbiddenResponse {
  error: string;
  message: string;
  userId: string;
  userEmail: string;
}

// エラーレスポンス (500 Internal Server Error)
export interface CallLambdaErrorResponse {
  error: string;
  details: string;
}

// エラーレスポンス (401 Unauthorized)
export interface CallLambdaUnauthorizedResponse {
  error: string;
}

// すべてのレスポンスのユニオン型
export type CallLambdaResponse =
  | CallLambdaSuccessResponse
  | CallLambdaForbiddenResponse
  | CallLambdaErrorResponse
  | CallLambdaUnauthorizedResponse;
