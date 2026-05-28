'use client';

import { Amplify } from 'aws-amplify';
import { amplifyConfig } from '@/amplify-config';
import { useEffect } from 'react';

// Amplifyの設定を初期化
Amplify.configure(amplifyConfig, { ssr: true });

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // クライアントサイドでの追加設定が必要な場合はここで実行
  }, []);

  return <>{children}</>;
}
