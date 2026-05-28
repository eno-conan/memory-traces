'use client';

import { APIProvider } from '@vis.gl/react-google-maps';
import { X } from 'lucide-react';
import Image from 'next/image';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '../hooks/useMediaQuery';

// 地図コンポーネントを遅延ロード
const MapSelector = lazy(() =>
  import('./MapSelector').then((mod) => ({ default: mod.MapSelector }))
);

export interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetLocation: (location: { lat: number; lng: number }, source: 'user') => void;
  initialLocation?: { lat: number; lng: number } | null;
  exifLocation?: { lat: number; lng: number } | null;
  photoPreview?: string;
}

/**
 * レスポンシブ対応の位置設定モーダル
 * - スマホ (768px未満): フルスクリーンモーダル
 * - PC (768px以上): ダイアログモーダル
 */
export default function LocationSelectorModal({
  isOpen,
  onClose,
  onSetLocation,
  initialLocation,
  exifLocation,
  photoPreview,
}: LocationSelectorModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || exifLocation || null
  );

  // Google Maps APIキー
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // モーダルが開いたときに初期位置を設定
  useEffect(() => {
    if (isOpen) {
      setSelectedLocation(initialLocation || exifLocation || null);
    }
  }, [isOpen, initialLocation, exifLocation]);

  // モーダルが開いていない場合は何も表示しない
  if (!isOpen) return null;

  // APIキーが設定されていない場合
  if (!apiKey) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md">
          <p className="text-red-600 dark:text-red-400 font-medium">
            Google Maps APIキーが設定されていません
          </p>
          <Button onClick={onClose} className="mt-4 w-full">
            閉じる
          </Button>
        </div>
      </div>
    );
  }

  const handleConfirm = () => {
    if (selectedLocation) {
      onSetLocation(selectedLocation, 'user');
      onClose();
    }
  };

  const modalContent = (
    <>
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          位置を設定
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          aria-label="閉じる"
        >
          <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </button>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 flex flex-col">
        {/* 画像プレビュー（オプション） */}
        {photoPreview && (
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
            <div className="relative w-full h-32 rounded-lg overflow-hidden">
              <Image
                src={photoPreview}
                alt="写真プレビュー"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* EXIF情報の表示 */}
        {exifLocation && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              📍 写真に位置情報が含まれています（自動取得）
            </p>
          </div>
        )}

        {/* 地図 */}
        <div className="flex-1 relative">
          <APIProvider apiKey={apiKey}>
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                  <p className="text-zinc-500 dark:text-zinc-400">地図を読み込み中...</p>
                </div>
              }
            >
              <MapSelector
                initialLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
              />
            </Suspense>
          </APIProvider>
        </div>

        {/* 選択中の座標表示 */}
        {selectedLocation && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              選択中: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </p>
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 flex gap-2">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          キャンセル
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!selectedLocation}
          className="flex-1"
        >
          この位置を使用
        </Button>
      </div>
    </>
  );

  // モバイル: フルスクリーンモーダル
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 flex flex-col">
        {modalContent}
      </div>
    );
  }

  // PC: ダイアログモーダル
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col">
        {modalContent}
      </div>
    </div>
  );
}
