'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import CustomLogin from '../components/CustomLogin';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      // OAuthエラーをURLパラメータから確認
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setOauthError(errorDescription || 'Google認証に失敗しました');
        setIsChecking(false);
        return;
      }

      try {
        await getCurrentUser();
        // ログイン済み（メール/パスワードまたはOAuth経由）
        router.push('/register');
      } catch {
        // 未ログイン、ログインフォームを表示
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router, searchParams]);

  const handleLoginSuccess = () => {
    router.push('/register');
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-zinc-600 dark:text-zinc-300">
          認証中...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-md px-4">
        {oauthError && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700">
            <p className="text-red-800 dark:text-red-200 font-medium">
              {oauthError}
            </p>
          </div>
        )}
        <CustomLogin onSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
}
