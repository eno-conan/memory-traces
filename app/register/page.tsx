'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser, signOut as amplifySignOut } from 'aws-amplify/auth';
import PhotoUploader from '../components/PhotoUploader';
import Header from '../components/Header';

export default function RegisterPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
        setIsChecking(false);
      } catch {
        // 認証されていない場合はログインページにリダイレクト
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    await amplifySignOut();
    router.push('/login');
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Header
          title="あしあとを刻む"
          onSignOut={handleSignOut}
          showDashboardButton={true}
          onDashboardClick={() => router.push('/dashboard')}
          dashboardButtonLabel="一覧"
        />

        {/* PhotoUploader コンポーネント */}
        <PhotoUploader />
      </div>
    </div>
  );
}
