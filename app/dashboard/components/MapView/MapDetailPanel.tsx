import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { TravelEntry } from '../../types';
import { MapDetailContent } from './MapDetailContent';
import { FocusTrap } from '@/components/FocusTrap';

interface MapDetailPanelProps {
  entry: TravelEntry | null;
  onClose: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/**
 * モバイル専用のモーダルパネル
 * 画面中央に表示され、オーバーレイ付き
 */
export function MapDetailPanel({
  entry,
  onClose,
  onEdit,
  onDelete,
}: MapDetailPanelProps) {
  if (!entry) return null;

  return (
    <>
      {/* オーバーレイ（モバイルのみ表示） */}
      <div
        className="fixed inset-0 bg-black/50 md:hidden z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* モーダル（モバイルのみ表示） */}
      <div
        className={`
          fixed md:hidden z-50 bg-white dark:bg-zinc-900 shadow-2xl
          transition-all duration-300 ease-in-out
          ${entry ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}

          /* 中央配置 */
          top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2

          /* サイズ設定 */
          w-[90vw] max-w-md max-h-[80vh]

          /* スタイル */
          rounded-2xl
        `}
        role="dialog"
        aria-labelledby="map-panel-title"
        aria-modal="true"
      >
        {/* FocusTrap: Escapeキー処理とTabフォーカスのループを管理 */}
        <FocusTrap onClose={onClose}>
          {/* ヘッダー */}
          <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 p-4 flex items-center justify-between rounded-t-2xl">
            <h2 id="map-panel-title" className="text-lg font-semibold">
              {entry.title}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="閉じる"
              className="h-9 w-9"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* コンテンツ */}
          <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(80vh - 4rem)' }}>
            <MapDetailContent
              entry={entry}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </FocusTrap>
      </div>
    </>
  );
}
