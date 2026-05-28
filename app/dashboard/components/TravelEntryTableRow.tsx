'use client';

import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { AlertCircle, FileSearchCorner, Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import type { TravelEntry } from '../types';

interface TravelEntryTableRowProps {
  entry: TravelEntry;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TravelEntryTableRow({
  entry,
  onEdit,
  onDelete,
}: TravelEntryTableRowProps) {
  // 画像読み込み状態管理
  const photo = entry.photos?.[0];
  const [imageStatus, setImageStatus] = useState<'loading' | 'success' | 'error'>(
    photo ? 'loading' : 'success'
  );

  // 感想の先頭20文字を取得
  const thoughtsPreview = entry.thoughts
    ? entry.thoughts.length > 20
      ? `${entry.thoughts.slice(0, 20)}...`
      : entry.thoughts
    : '';

  return (
    <TableRow>
      {/* 画像列 */}
      <TableCell>
        <div className="w-48 h-27 relative rounded overflow-hidden bg-zinc-100">
          {photo ? (
            <>
              <Image
                src={photo.url}
                alt={entry.title}
                fill
                className="object-cover"
                sizes="80px"
                onLoad={() => setImageStatus('success')}
                onError={() => setImageStatus('error')}
              />
              {imageStatus === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                </div>
              )}
              {imageStatus === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-100">
                  <AlertCircle className="h-5 w-5 text-zinc-400" />
                  <span className="text-xs text-zinc-400 mt-1">読込失敗</span>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">
              画像なし
            </div>
          )}
        </div>
      </TableCell>

      {/* タイトル・感想列 */}
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">{entry.title}</div>
          {thoughtsPreview && (
            <div className="text-sm text-zinc-500">{thoughtsPreview}</div>
          )}
        </div>
      </TableCell>

      {/* 日付列 */}
      <TableCell>
        <div className="space-y-1">
          {entry.shotAt && entry.shotAt !== '' ? (
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              📷 {new Date(entry.shotAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          ) : (
            <p className="text-sm text-zinc-400">撮影日未設定</p>
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            📝 {new Date(entry.createdAt).toLocaleDateString('ja-JP')}
          </p>
        </div>
      </TableCell>

      {/* 操作ボタン列 */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(entry.id)}
            aria-label="詳細"
            className="hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <FileSearchCorner className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(entry.id)}
            aria-label="削除"
            className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
