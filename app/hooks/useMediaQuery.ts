'use client';

import { useEffect, useState } from 'react';

/**
 * メディアクエリの状態を監視するカスタムフック
 * @param query メディアクエリ文字列（例: '(max-width: 768px)'）
 * @returns メディアクエリがマッチしているかどうか
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // SSR対策：windowが存在しない場合は何もしない
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // 初期値を設定
    setMatches(mediaQuery.matches);

    // メディアクエリの変更を監視
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // イベントリスナーを登録
    mediaQuery.addEventListener('change', handleChange);

    // クリーンアップ
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}
