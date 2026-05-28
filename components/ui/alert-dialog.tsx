'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { FocusTrap } from '@/components/FocusTrap';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/modal-overflow';

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  variant?: 'destructive' | 'default';
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = '削除',
  cancelLabel = 'キャンセル',
  onConfirm,
  isLoading = false,
  variant = 'default',
}: AlertDialogProps) {
  // body スクロール制御（カウンター方式で複数モーダルとの競合を防ぐ）
  useEffect(() => {
    if (open) {
      lockBodyScroll();
    }
    return () => {
      if (open) {
        unlockBodyScroll();
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-200"
        onClick={() => {
          if (!isLoading) onOpenChange(false);
        }}
        aria-hidden="true"
      />

      {/* ダイアログ */}
      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        {/* FocusTrap: Escapeキー処理とTabフォーカスのループを管理 */}
        <FocusTrap onClose={() => { if (!isLoading) onOpenChange(false); }}>
          <h2
            id="alert-dialog-title"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            {title}
          </h2>
          <p
            id="alert-dialog-description"
            className="mt-2 text-sm text-zinc-600 dark:text-zinc-400"
          >
            {description}
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="animate-spin" />}
              {confirmLabel}
            </Button>
          </div>
        </FocusTrap>
      </div>
    </>
  );
}
