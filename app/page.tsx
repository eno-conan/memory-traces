'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';

export default function Home() {
  const router = useRouter();
  const [isChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        // ユーザーが既にログインしている場合、登録ページにリダイレクト
        router.push('/register');
      } catch {
        // ログインしていない場合はログインページにリダイレクト
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-zinc-600 dark:text-zinc-300">
          リダイレクト中...
        </div>
      </div>
    );
  }

  return null;
}
