'use client';

import { useEffect, useRef, memo } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  onClose: () => void;
  /** コンテナdivに適用するTailwindクラス（スタイルの継承が必要な場合） */
  className?: string;
}

export const FocusTrap = memo<FocusTrapProps>(function FocusTrap({ children, onClose, className }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // モーダル内のfocusable要素を取得
    const getFocusableElements = () => {
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors)
      );
    };

    // 最初の要素に自動フォーカス
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // キーボードイベントハンドラ
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escキーでモーダルを閉じる
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      // Tabキーでフォーカスをループ
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        if (event.shiftKey) {
          // Shift+Tab: 最初の要素から最後の要素へループ
          if (activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: 最後の要素から最初の要素へループ
          if (activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return <div ref={containerRef} className={className}>{children}</div>;
});
