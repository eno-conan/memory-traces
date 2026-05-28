---
paths:
  - "app/api/**/*.ts"
  - "types/**/*.ts"
---

# Lambda関数の型安全ガイドライン

このドキュメントは、AWS Lambda関数を呼び出す際の型安全性を確保するためのガイドラインです。

## 原則

**すべてのLambda関数のレスポンスには、適切なTypeScript型定義を作成すること**

Lambda関数の戻り値を `any` 型のまま使用すると、以下の問題が発生します：
- 型安全性の喪失（コンパイル時にエラーを検出できない）
- IDEの補完が効かず、開発効率が低下
- リファクタリング時に影響範囲が把握できない
- ランタイムエラーのリスクが増加

## 実装手順

### 1. Lambda関数の実装を確認する

Lambda関数のソースコードを確認して、正確なレスポンス構造を把握します。

**確認先:**
- `infra/modules/lambda/main.tf` - Lambda関数の実装がTerraformに埋め込まれている
- 別途Lambda関数のソースコードディレクトリ（プロジェクトによって異なる）

**例: getUserProjects関数の確認**
```javascript
// infra/modules/lambda/main.tf の getUserProjects
export const handler = async (event) => {
  const { userId } = event;

  return {
    userId: userId || 'user-123',
    projects: [
      { id: 'proj-1', name: 'Project Alpha', status: 'active' },
      { id: 'proj-2', name: 'Project Beta', status: 'active' },
      { id: 'proj-3', name: 'Project Gamma', status: 'completed' }
    ]
  };
};
```

### 2. TypeScript型定義を作成する

Lambda関数のレスポンス構造に基づいて、TypeScript のインターフェースを定義します。

**型定義の原則:**
- プリミティブ型は具体的に指定（string, number, boolean）
- 列挙型が明確な場合は、ユニオン型を使用（例: `'active' | 'completed'`）
- ネストしたオブジェクトは、明示的に型定義する
- 配列の要素型を必ず指定する

**例: getUserProjects関数の型定義**
```typescript
// プロジェクトオブジェクトの型
interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed';  // 列挙型を明示
}

// getUserProjects関数のレスポンス型
interface UserProjectsResponse {
  userId: string;
  projects: Project[];
}
```

### 3. 型を適用する

Lambda関数の呼び出し結果に、定義した型を適用します。

**方法1: 型アサーション（推奨）**
```typescript
const userProjects: UserProjectsResponse = JSON.parse(
  new TextDecoder().decode(response.Payload)
);
```

**方法2: asキャスト（返り値の途中で使う場合）**
```typescript
return JSON.parse(new TextDecoder().decode(response.Payload)) as UserProjectsResponse;
```

### 4. 型を使用する

定義した型を使って、安全にデータにアクセスします。

```typescript
// 型安全なアクセス（IDEの補完が効く）
userProjects.projects.map((project: Project) => {
  console.log(project.id);      // OK: string型
  console.log(project.status);  // OK: 'active' | 'completed'型
});
```

## 新しいLambda関数を追加する場合

新しいLambda関数を追加する際は、以下の手順に従ってください：

### 1. Lambda関数の実装
```javascript
// infra/modules/lambda/main.tf
getNewFeature = <<-EOT
  export const handler = async (event) => {
    const { featureId } = event;

    return {
      featureId: featureId,
      name: 'Feature Name',
      enabled: true,
      config: {
        maxRetries: 3,
        timeout: 5000
      }
    };
  };
EOT
```

### 2. TypeScript型定義の作成
```typescript
// app/api/your-route/route.ts

// ネストしたオブジェクトも型定義する
interface FeatureConfig {
  maxRetries: number;
  timeout: number;
}

interface NewFeatureResponse {
  featureId: string;
  name: string;
  enabled: boolean;
  config: FeatureConfig;
}
```

### 3. 型の適用
```typescript
const newFeatureResponse = await lambdaClient.send(new InvokeCommand({
  FunctionName: process.env.LAMBDA_GET_NEW_FEATURE_NAME,
  Payload: JSON.stringify({ featureId }),
}));
const newFeature: NewFeatureResponse = JSON.parse(
  new TextDecoder().decode(newFeatureResponse.Payload)
);
```

## 型の共通化（推奨）

複数のAPIルートで同じLambda関数を呼び出す場合、型定義を共通化することを推奨します。

### 共通型定義ファイルの作成

**ファイル: `types/lambda-responses.ts`**
```typescript
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
```

### 共通型の使用
```typescript
// app/api/your-route/route.ts
import {
  UserInfoResponse,
  UserProjectsResponse,
  ProjectStatsResponse,
  UserActivityResponse,
} from '@/types/lambda-responses';

// 型を使用
const userInfo: UserInfoResponse = JSON.parse(...);
const userProjects: UserProjectsResponse = JSON.parse(...);
```

## チェックリスト

新しいLambda関数を追加した際は、以下を確認してください：

- [ ] Lambda関数の実装を確認した
- [ ] TypeScript型定義を作成した（インターフェース）
- [ ] すべてのプロパティの型を明示的に指定した
- [ ] 列挙型が明確な場合、ユニオン型を使用した
- [ ] Lambda呼び出し結果に型を適用した
- [ ] 型が複数の場所で使われる場合、共通化を検討した
- [ ] `any` 型を使用していない
- [ ] IDEの補完が正しく動作することを確認した

## ベストプラクティス

### 1. 常に具体的な型を使用する
```typescript
// ❌ 悪い例
const result: any = JSON.parse(...);

// ✅ 良い例
const result: UserInfoResponse = JSON.parse(...);
```

### 2. ネストしたオブジェクトも型定義する
```typescript
// ❌ 悪い例
interface ProjectStatsResponse {
  projectId: string;
  stats: any;  // これはダメ
}

// ✅ 良い例
interface ProjectStatsResponse {
  projectId: string;
  stats: {
    totalTasks: number;
    completedTasks: number;
    activeDevelopers: number;
    lastUpdate: string;
  };
}
```

### 3. 配列の要素型を明示する
```typescript
// ❌ 悪い例
projects.map((project: any) => {...});

// ✅ 良い例
projects.map((project: Project) => {...});
```

### 4. オプショナルなプロパティは `?` を使う
```typescript
interface UserInfoResponse {
  userId: string;
  username: string;
  email: string;
  phoneNumber?: string;  // オプショナル
}
```

## 参考資料

- [TypeScript Handbook - Interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [TypeScript Handbook - Type Assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)
- [AWS SDK for JavaScript v3 - Lambda Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-lambda/)

---

**このガイドラインは必須です。すべての Lambda 関数呼び出しで適用してください。**
