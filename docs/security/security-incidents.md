# セキュリティインシデント記録

このドキュメントは、開発中に発見されたセキュリティ問題と、その教訓を記録するものです。

## インシデント #1: ユーザー切り替え時の状態残存（2025-12-28）

### 重大度
**HIGH** - 情報漏洩につながる重大なセキュリティインシデント

### 問題の概要
ユーザーがログアウトして別のアカウントでログインした際、前のユーザーのLambda実行結果やその他の機密情報が画面に残り続ける問題が発見されました。

### 根本原因
React の `useState` で管理されているコンポーネントの状態が、ユーザーの切り替え時にクリアされていませんでした。

**問題のあったコード:**
```typescript
export default function Dashboard() {
  const [lambdaResult, setLambdaResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  return (
    <Authenticator>
      {({ signOut, user }) => (
        // ユーザーが変わっても状態がクリアされない
        <div>...</div>
      )}
    </Authenticator>
  );
}
```

### セキュリティへの影響
1. **情報漏洩**: 前のユーザーの実行結果（ユーザー情報、API レスポンスなど）が新しいユーザーに見える
2. **プライバシー侵害**: 個人を特定できる情報（PII）が他のユーザーに露出
3. **コンプライアンス違反**: GDPR、個人情報保護法などの規制要件に違反する可能性

### 修正内容
ユーザーIDの変更を監視し、ユーザーが切り替わった際に自動的に状態をクリアする `useEffect` を実装しました。

**修正後のコード:**
```typescript
export default function Dashboard() {
  const [lambdaResult, setLambdaResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  return (
    <Authenticator>
      {({ signOut, user }) => {
        // SECURITY: ユーザーが変更された場合、前のユーザーの状態をクリア
        useEffect(() => {
          if (user?.userId && user.userId !== currentUserId) {
            setLambdaResult('');
            setError('');
            setLoading(false);
            setCurrentUserId(user.userId);
          }
        }, [user?.userId]);

        return <div>...</div>;
      }}
    </Authenticator>
  );
}
```

### 教訓と再発防止策

#### 1. 認証状態に依存するデータは必ずクリアする
**原則**: ユーザー固有の情報を保持する状態は、ユーザーの切り替え時に必ずクリアすること

**チェックリスト**:
- [ ] API レスポンスデータ
- [ ] エラーメッセージ（ユーザー情報を含む可能性がある）
- [ ] フォーム入力値
- [ ] 一時的なキャッシュデータ
- [ ] セッション固有の設定

#### 2. useEffect でユーザーIDを監視する
```typescript
useEffect(() => {
  if (user?.userId && user.userId !== currentUserId) {
    // すべてのユーザー固有状態をクリア
    clearUserSpecificState();
    setCurrentUserId(user.userId);
  }
}, [user?.userId]);
```

#### 3. コンポーネントのキー属性を使用する
```typescript
<Dashboard key={user?.userId} />
```
ユーザーIDをキーとして設定することで、ユーザーが変わるとコンポーネントが再マウントされ、状態が自動的にリセットされます。

#### 4. セキュリティレビューの実施
以下の観点でコードレビューを実施すること:
- [ ] 認証/認可フロー
- [ ] 状態管理とライフサイクル
- [ ] ユーザーデータの取り扱い
- [ ] ログアウト時の処理

#### 5. テストケースの追加
```typescript
describe('Dashboard', () => {
  it('ユーザー切り替え時に前のユーザーの状態をクリアする', async () => {
    // Test implementation
  });

  it('ログアウト後に機密情報が画面に残らない', async () => {
    // Test implementation
  });
});
```

### 参考資料
- [OWASP Top 10 - A01:2021 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [CWE-539: Information Exposure Through Persistent Cookies](https://cwe.mitre.org/data/definitions/539.html)
- [React: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

---

**このドキュメントは継続的に更新されます。新しいインシデントや教訓があれば追記してください。**
