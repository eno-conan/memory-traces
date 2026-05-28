'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser, signOut as amplifySignOut } from 'aws-amplify/auth';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Image from 'next/image';
import Header from '@/app/components/Header';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, Maximize, X } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel';
import { FocusTrap } from '@/components/FocusTrap';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/modal-overflow';
import type { TravelEntry } from '@/app/dashboard/types';
import type { TravelEntriesResponse } from '@/app/api/travel-entries/types';

export default function DetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [entry, setEntry] = useState<TravelEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フォームの状態管理
  const [shotAt, setShotAt] = useState<Date | undefined>(undefined);
  const [thoughts, setThoughts] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // 認証チェック
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
      } catch {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  // データ取得
  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 一覧APIからデータを取得
        const response = await fetch('/api/travel-entries');

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('データの取得に失敗しました');
        }

        const data = (await response.json()) as TravelEntriesResponse;

        if (data.success) {
          // IDで該当エントリーを検索
          const foundEntry = data.entries.find((e) => e.id === id);

          if (!foundEntry) {
            setError('記録が見つかりません');
            return;
          }

          setEntry(foundEntry);
          setShotAt(foundEntry.shotAt ? new Date(foundEntry.shotAt) : undefined);
          setThoughts(foundEntry.thoughts || '');
        } else {
          throw new Error(data.error || 'データの取得に失敗しました');
        }
      } catch (err) {
        console.error('Failed to fetch entry:', err);
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntry();
  }, [id, router]);

  // ログアウト処理
  const handleSignOut = async () => {
    try {
      await amplifySignOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">読み込み中...</div>
      </div>
    );
  }

  // エラー表示（記録が見つからない場合）
  if (error || !entry) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            {error || '記録が見つかりません'}
          </h2>
          <Button onClick={() => router.push('/dashboard')}>ダッシュボードに戻る</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Header
          title="あしあとの詳細"
          onSignOut={handleSignOut}
          showDashboardButton={true}
          onDashboardClick={() => router.push('/dashboard')}
          dashboardButtonLabel="一覧へ戻る"
        />

        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
          {/* タイトル（読み取り専用） */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              タイトル
            </label>
            <input
              type="text"
              value={entry.title}
              disabled
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed focus:outline-none"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              ※ タイトルは現在編集できません
            </p>
          </div>

          {/* 撮影日 */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              撮影日 <span className="text-red-600">*</span>
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {shotAt ? (
                    format(shotAt, 'PPP', { locale: ja })
                  ) : (
                    <span className="text-zinc-400">日付を選択</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={shotAt}
                  onSelect={setShotAt}
                  disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                  locale={ja}
                />
              </PopoverContent>
            </Popover>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              ※ 編集機能は今後実装予定です
            </p>
          </div>

          {/* 感想 */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              感想
            </label>
            <textarea
              rows={3}
              value={thoughts}
              onChange={(e) => setThoughts(e.target.value)}
              placeholder="この旅の思い出を記録..."
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              ※ 編集機能は今後実装予定です
            </p>
          </div>

          {/* 画像表示（カルーセル） */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              画像
            </label>
            {entry.photos.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  アップロード済み: {entry.photos.length}枚
                </p>
                <PhotoCarousel photos={entry.photos} title={entry.title} onSlideChange={setCurrentPhotoIndex} />
              </div>
            ) : (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                画像がアップロードされていません
              </div>
            )}
          </div>

          {/* メタ情報 */}
          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">作成日時:</span>
                <span className="ml-2 text-zinc-600 dark:text-zinc-400">
                  {format(new Date(entry.createdAt), 'PPP HH:mm', { locale: ja })}
                </span>
              </div>
              <div>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">更新日時:</span>
                <span className="ml-2 text-zinc-600 dark:text-zinc-400">
                  {format(new Date(entry.updatedAt), 'PPP HH:mm', { locale: ja })}
                </span>
              </div>
              {(() => {
                const currentPhoto = entry.photos[currentPhotoIndex];
                const lat = currentPhoto?.latitude;
                const lng = currentPhoto?.longitude;
                if (lat == null || lng == null) return null;
                return (
                  <div className="md:col-span-2">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">位置情報:</span>
                    <a
                      href={`https://www.google.com/maps?q=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <MapPin className="h-4 w-4" />
                      緯度 {lat.toFixed(6)}, 経度 {lng.toFixed(6)}
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 画像カルーセルコンポーネント（全画面表示対応）
 */
function PhotoCarousel({
  photos,
  title,
  onSlideChange,
}: {
  photos: TravelEntry['photos'];
  title: string;
  onSlideChange?: (index: number) => void;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenApi, setFullscreenApi] = useState<CarouselApi>();
  const [fullscreenCurrent, setFullscreenCurrent] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    const index = api.selectedScrollSnap();
    setCurrent(index);
    onSlideChange?.(index);
  }, [api, onSlideChange]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api, onSelect]);

  // 全画面カルーセルの位置同期
  useEffect(() => {
    if (!fullscreenApi) return;

    const updateCurrent = () => {
      setFullscreenCurrent(fullscreenApi.selectedScrollSnap());
    };

    updateCurrent();
    fullscreenApi.on('select', updateCurrent);

    return () => {
      fullscreenApi.off('select', updateCurrent);
    };
  }, [fullscreenApi]);

  // 全画面モーダル表示時の初期位置設定
  useEffect(() => {
    if (!fullscreenApi || !isFullscreen) return;

    // startIndex が効かなかった場合のフォールバック
    fullscreenApi.scrollTo(fullscreenCurrent, true);
  }, [fullscreenApi, isFullscreen, fullscreenCurrent]);

  // body overflow制御（全画面表示時はスクロールを無効化）
  // カウンター方式でAlertDialog等との競合を防ぐ
  useEffect(() => {
    if (isFullscreen) {
      lockBodyScroll();
    }
    return () => {
      if (isFullscreen) {
        unlockBodyScroll();
      }
    };
  }, [isFullscreen]);

  // 1枚のみの場合はシンプル表示
  if (photos.length === 1) {
    return (
      <>
        <div className="relative rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-600 group">
          <Image
            src={photos[0].url}
            alt={title}
            width={800}
            height={600}
            className="w-full h-auto object-cover cursor-pointer"
            priority
            onClick={() => {
              setFullscreenCurrent(current);
              setIsFullscreen(true);
            }}
          />
          {/* 拡大アイコン */}
          <button
            onClick={() => {
              setFullscreenCurrent(current);
              setIsFullscreen(true);
            }}
            className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            aria-label="全画面表示"
          >
            <Maximize className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* 全画面モーダル */}
        {isFullscreen && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setIsFullscreen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="画像全画面表示"
          >
            {/* FocusTrap: Escapeキー処理とTabフォーカスのループを管理 */}
            <FocusTrap
              onClose={() => setIsFullscreen(false)}
              className="relative w-full h-full md:max-w-7xl md:max-h-[90vh] md:p-8 flex items-center justify-center"
            >
              {/* 閉じるボタン */}
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                aria-label="閉じる"
              >
                <X className="h-6 w-6 text-white" />
              </button>

              {/* 全画面画像 */}
              <div
                className="relative w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={photos[0].url}
                  alt={title}
                  width={1920}
                  height={1080}
                  className="max-h-[90vh] w-auto object-contain"
                  priority
                />
              </div>
            </FocusTrap>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {photos.map((photo, index) => (
              <CarouselItem key={photo.id}>
                <div className="relative rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-600 group">
                  <Image
                    src={photo.url}
                    alt={`${title} (${index + 1}/${photos.length})`}
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover cursor-pointer"
                    priority={index === 0}
                    onClick={() => {
                      setFullscreenCurrent(current);
                      setIsFullscreen(true);
                    }}
                  />
                  {/* 拡大アイコン */}
                  <button
                    onClick={() => {
                      setFullscreenCurrent(current);
                      setIsFullscreen(true);
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="全画面表示"
                  >
                    <Maximize className="h-5 w-5 text-white" />
                  </button>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          {current + 1} / {photos.length} 枚
        </p>
      </div>

      {/* 全画面モーダル（カルーセル対応） */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="画像全画面表示"
        >
          {/* FocusTrap: Escapeキー処理とTabフォーカスのループを管理 */}
          <FocusTrap
            onClose={() => setIsFullscreen(false)}
            className="relative w-full h-full md:max-w-7xl md:max-h-[90vh] md:p-8 flex items-center justify-center"
          >
            {/* 閉じるボタン */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              aria-label="閉じる"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* 全画面カルーセル */}
            <div
              className="w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Carousel
                setApi={setFullscreenApi}
                opts={{ startIndex: fullscreenCurrent }}
                className="w-full h-full"
              >
                <CarouselContent className="h-full">
                  {photos.map((photo, index) => (
                    <CarouselItem key={photo.id} className="h-full flex items-center justify-center">
                      <Image
                        src={photo.url}
                        alt={`${title} (${index + 1}/${photos.length})`}
                        width={1920}
                        height={1080}
                        className="max-h-[90vh] w-auto object-contain"
                        priority={index === 0}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4 md:left-8" />
                <CarouselNext className="right-4 md:right-8" />
              </Carousel>
            </div>

            {/* ページ表示 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full">
              <p className="text-sm text-white">
                {fullscreenCurrent + 1} / {photos.length}
              </p>
            </div>
          </FocusTrap>
        </div>
      )}
    </>
  );
}
