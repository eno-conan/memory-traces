import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import type { TravelEntry } from '../../types';

interface MapDetailContentProps {
  entry: TravelEntry;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/**
 * マーカー詳細情報の共通コンテンツコンポーネント
 * PC詳細セクションとモバイルモーダルの両方で使用される
 */
export function MapDetailContent({
  entry,
  onEdit,
  onDelete,
}: MapDetailContentProps) {
  return (
    <Card className="overflow-hidden">
      {/* 写真 */}
      <div className="relative w-full aspect-video bg-zinc-100 dark:bg-zinc-800">
        {entry.photos?.[0] ? (
          <Image
            src={entry.photos[0].url}
            alt={entry.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 90vw, 600px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            画像なし
          </div>
        )}
      </div>

      {/* コンテンツ */}
      <CardContent className="pt-4 space-y-4">
        <div>
          <h3 className="text-base font-medium">{entry.title}</h3>
          {entry.thoughts && (
            <p className="text-sm text-zinc-500 mt-1 line-clamp-3">
              {entry.thoughts}
            </p>
          )}
        </div>

        {/* 日付情報 */}
        <div className="space-y-1">
          {entry.shotAt && entry.shotAt !== '' ? (
            <p className="text-xs font-medium text-zinc-900 dark:text-white">
              📷 {new Date(entry.shotAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          ) : (
            <p className="text-xs text-zinc-400">撮影日未設定</p>
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            📝 {new Date(entry.createdAt).toLocaleDateString('ja-JP')}
          </p>
        </div>

        {/* 編集・削除ボタン */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onEdit?.(entry.id)}
            className="flex-1 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            disabled={!onEdit}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            編集
          </Button>
          <Button
            variant="outline"
            onClick={() => onDelete?.(entry.id)}
            className="flex-1 hover:text-red-600 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
            disabled={!onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            削除
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
