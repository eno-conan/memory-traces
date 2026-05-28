'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
      <div className="max-w-md p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
          エラーが発生しました
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          問題が発生しました。もう一度お試しください。
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          再試行
        </button>
      </div>
    </div>
  );
}
