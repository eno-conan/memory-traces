'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
            ダッシュボードの読み込みに失敗しました
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            問題が発生しました。もう一度お試しください。
          </p>
          <div className="flex gap-4">
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              再試行
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded transition-colors"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
