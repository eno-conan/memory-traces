'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, FileSearchCorner, Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import type { TravelEntry } from '../types';

interface TravelEntryCardProps {
  entry: TravelEntry;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TravelEntryCard({
  entry,
  onEdit,
  onDelete,
}: TravelEntryCardProps) {
  // 画像読み込み状態管理
  const photo = entry.photos?.[0];
  const [imageStatus, setImageStatus] = useState<'loading' | 'success' | 'error'>(
    photo ? 'loading' : 'success'
  );

  return (
    <Card className="overflow-hidden">
      {/* 画像 */}
      <div className="relative w-full aspect-video bg-zinc-100">
        {photo ? (
          <>
            <Image
              src={photo.url}
              alt={entry.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              onLoad={() => setImageStatus('success')}
              onError={() => setImageStatus('error')}
            />
            {imageStatus === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              </div>
            )}
            {imageStatus === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-100">
                <AlertCircle className="h-8 w-8 text-zinc-400" />
                <span className="text-sm text-zinc-400 mt-2">読込失敗</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            画像なし
          </div>
        )}
      </div>

      {/* コンテンツ */}
      <CardContent className="pt-4 space-y-2">
        <h3 className="text-lg font-medium line-clamp-2">{entry.title}</h3>
        <div className="space-y-1">
          {entry.shotAt && entry.shotAt !== '' ? (
            <p className="text-xs font-medium text-zinc-900 dark:text-white">
              📷 {new Date(entry.shotAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          ) : (
            <p className="text-xs text-zinc-400">撮影日未設定</p>
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            📝 {new Date(entry.createdAt).toLocaleDateString('ja-JP')}
          </p>
        </div>
      </CardContent>

      {/* フッター（アイコンボタン） */}
      <CardFooter className="flex justify-end gap-2 pt-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(entry.id)}
          aria-label="編集"
          className="h-11 w-11 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
        >
          <FileSearchCorner className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(entry.id)}
          aria-label="削除"
          className="h-11 w-11 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
