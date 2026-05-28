'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { fetchAuthSession } from 'aws-amplify/auth';
import Image from 'next/image';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import LocationSelectorModal from './LocationSelectorModal';
import { extractExifLocation } from '../utils/exif-utils';

interface PhotoUploaderProps { }

interface UploadedPhoto {
  id: string;
  photoId: string; // サーバー送信用のUUID
  fileId: string; // File Map参照用のID
  preview: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  retryCount?: number; // リトライ回数
  location?: { lat: number; lng: number }; // 最終的な位置情報（アップロード時に送信）
  locationSource?: 'user' | 'exif' | null; // 位置情報の出所
  exifLocation?: { lat: number; lng: number } | null; // EXIF情報（参照用）
  exifExtracted?: boolean; // EXIF抽出済みフラグ
}

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB


// 成功メッセージコンポーネント
const SuccessMessage = ({ message }: { message: string }) => (
  <div
    role="status"
    className="mb-4 p-4 rounded-lg border-2
      bg-green-50 dark:bg-green-900/20
      border-green-300 dark:border-green-700
      text-green-800 dark:text-green-200"
  >
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <p className="font-medium">{message}</p>
    </div>
  </div>
);

// 警告メッセージコンポーネント
const WarningMessage = ({ message }: { message: string }) => (
  <div
    role="alert"
    className="mb-4 p-4 rounded-lg border-2
      bg-yellow-50 dark:bg-yellow-900/20
      border-yellow-300 dark:border-yellow-700
      text-yellow-800 dark:text-yellow-200"
  >
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <p className="font-medium whitespace-pre-line">{message}</p>
    </div>
  </div>
);

export default function PhotoUploader({ }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [titleError, setTitleError] = useState<string>('');
  const [thoughts, setThoughts] = useState<string>('');
  const [shotAt, setShotAt] = useState<Date>(new Date());
  const [shotAtError, setShotAtError] = useState<string>('');
  const [allUploadsCompleted, setAllUploadsCompleted] = useState(false);

  // 位置設定モーダル状態
  const [locationModalState, setLocationModalState] = useState<{
    isOpen: boolean;
    photoId: string | null;
  }>({ isOpen: false, photoId: null });

  // Fileオブジェクトを参照で管理（Safari対策）
  const fileMapRef = useRef<Map<string, File>>(new Map());

  // 二重送信防止フラグ(同期的にチェック可能)
  const isSubmittingRef = useRef<boolean>(false);

  // // タイトルに日付時刻のデフォルト値を設定（マウント時のみ実行）
  // useEffect(() => {
  //   const now = new Date();
  //   const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  //   setTitle(formatted);
  // }, []);

  // 全アップロード完了を検知
  useEffect(() => {
    if (photos.length > 0 && photos.every(p => p.status === 'completed')) {
      setAllUploadsCompleted(true);
      sessionStorage.setItem('travel-entry-uploaded', '1');

      // 3秒後に配列とフォームをクリア
      setTimeout(() => {
        // プレビューURLを解放（メモリリーク防止）
        photos.forEach(photo => {
          URL.revokeObjectURL(photo.preview);
          // FileオブジェクトもMapから削除
          fileMapRef.current.delete(photo.fileId);
        });
        setPhotos([]);
        setAllUploadsCompleted(false);

        // 新しい日時でタイトルを設定
        const now = new Date();
        const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setTitle(formatted);
        setThoughts('');
      }, 3000);
    }
  }, [photos]);

  // リトライ可能なエラーかを判定
  const isRetryableError = (error: unknown): boolean => {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return true; // ネットワークエラー
    }
    if (error instanceof Error && error.name === 'AbortError') {
      return true; // タイムアウトエラー
    }
    return false;
  };

  // エクスポネンシャルバックオフでリトライ付きfetch
  const fetchWithTimeout = async (
    url: string,
    options: RequestInit,
    timeoutMs: number = 45000,
    onRetry?: (attempt: number, maxRetries: number) => void
  ): Promise<Response> => {
    const maxRetries = 3;
    const retryDelays = [0, 1000, 2000]; // 初回即座、2回目1秒後、3回目2秒後

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // リトライ時は待機
        if (attempt > 0) {
          console.warn(`リトライ ${attempt + 1}/${maxRetries} を ${retryDelays[attempt]}ms 後に実行...`);
          if (onRetry) {
            onRetry(attempt, maxRetries);
          }
          await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
        }

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        // サーバー側5xxエラーはリトライ対象
        if (response.status >= 500 && attempt < maxRetries - 1) {
          console.warn(`サーバーエラー(${response.status})が発生しました。リトライします...`);
          continue;
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);

        // タイムアウトエラーの処理
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn(`タイムアウトエラー(${timeoutMs}ms)が発生しました`);
          if (attempt < maxRetries - 1) {
            console.warn('リトライします...');
            continue;
          }
          throw new Error(`アップロードがタイムアウトしました（${timeoutMs / 1000}秒）`);
        }

        // リトライ可能なエラーかチェック
        if (isRetryableError(error) && attempt < maxRetries - 1) {
          console.warn('リトライ可能なエラーが発生しました:', error);
          continue;
        }

        // リトライ不可能、または最終試行で失敗
        throw error;
      }
    }

    throw new Error('予期しないエラー: リトライループを抜けました');
  };


  // ファイルドロップ処理
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (photos.length + acceptedFiles.length > MAX_PHOTOS) {
        setWarningMessage(`最大${MAX_PHOTOS}枚までアップロードできます`);

        // 3秒後に警告メッセージをクリア
        setTimeout(() => {
          setWarningMessage(null);
        }, 3000);

        return;
      }

      // 警告メッセージをクリア（新しいファイルが正常に追加される場合）
      setWarningMessage(null);
      setSuccessMessage(null);
      setAllUploadsCompleted(false);

      // ファイルをMapに保存し、stateには参照IDのみ保持（Safari対策）
      const newPhotos: UploadedPhoto[] = acceptedFiles.map((file) => {
        const fileId = crypto.randomUUID();
        const photoId = crypto.randomUUID(); // サーバー送信用のUUID生成

        // FileオブジェクトをMapに保存
        fileMapRef.current.set(fileId, file);

        return {
          id: `${Date.now()}-${Math.random()}`,
          photoId,
          fileId, // file参照用のID
          preview: URL.createObjectURL(file),
          status: 'pending' as const,
        };
      });

      setPhotos((prev) => [...prev, ...newPhotos]);
    },
    [photos.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.heic'],
    },
    maxFiles: MAX_PHOTOS,
    maxSize: MAX_FILE_SIZE, // 2MB制限
    disabled: uploading,
    onDropRejected: (fileRejections) => {
      const errors = fileRejections.map((rejection) => {
        const fileSizeMB = (rejection.file.size / 1024 / 1024).toFixed(2);
        if (rejection.errors.some((e) => e.code === 'file-too-large')) {
          return `${rejection.file.name}: ${fileSizeMB}MBは大きすぎます（最大2MB）`;
        }
        return `${rejection.file.name}: アップロードできません`;
      });
      setWarningMessage(errors.join('\n'));
      setTimeout(() => setWarningMessage(null), 5000);
    },
  });

  // 写真削除
  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
        // FileオブジェクトもMapから削除
        fileMapRef.current.delete(photo.fileId);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  // EXIF位置情報抽出（初回のみ実行）
  const extractPhotoExifLocation = async (photo: UploadedPhoto) => {
    const file = fileMapRef.current.get(photo.fileId);
    if (!file || photo.exifExtracted) return;

    const exifLocation = await extractExifLocation(file);

    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photo.id
          ? {
            ...p,
            exifLocation,
            exifExtracted: true,
            location: exifLocation || p.location,
            locationSource: exifLocation ? 'exif' : p.locationSource,
          }
          : p
      )
    );
  };

  // 位置設定モーダルを開く
  const handleOpenLocationModal = async (photoId: string) => {
    const photo = photos.find((p) => p.photoId === photoId);
    if (photo && !photo.exifExtracted) {
      await extractPhotoExifLocation(photo);
    }
    setLocationModalState({ isOpen: true, photoId });
  };

  // 位置設定ハンドラ
  const handleSetLocation = (
    location: { lat: number; lng: number },
    source: 'user'
  ) => {
    if (!locationModalState.photoId) return;

    setPhotos((prev) =>
      prev.map((p) =>
        p.photoId === locationModalState.photoId
          ? { ...p, location, locationSource: source }
          : p
      )
    );
  };

  // 位置設定モーダルを閉じる
  const handleCloseLocationModal = () => {
    setLocationModalState({ isOpen: false, photoId: null });
  };

  // タイトルバリデーション
  const validateTitle = () => {
    if (!title.trim()) {
      setTitleError('タイトルは必須です');
      return false;
    }
    setTitleError('');
    return true;
  };

  // 撮影日バリデーション
  const validateShotAt = () => {
    if (!shotAt) {
      setShotAtError('撮影日は必須です');
      return false;
    }
    setShotAtError('');
    return true;
  };

  // 写真をアップロード
  const handleUpload = async () => {
    // 二重送信防止: 即座チェック
    if (isSubmittingRef.current || uploading) {
      console.warn('[DoubleSubmit] 処理中のため送信をブロックしました');
      return;
    }

    // フラグを即座に立てる(同期的)
    isSubmittingRef.current = true;
    // ボタンを即座に無効化（UI反映）
    setUploading(true);

    // メッセージクリア
    setSuccessMessage(null);
    setWarningMessage(null);

    // タイトルバリデーション
    if (!validateTitle()) {
      setWarningMessage('タイトルを入力してください');
      isSubmittingRef.current = false;
      setUploading(false);
      return;
    }

    // 撮影日バリデーション
    if (!validateShotAt()) {
      setWarningMessage('撮影日を選択してください');
      isSubmittingRef.current = false;
      setUploading(false);
      return;
    }

    if (photos.length === 0) {
      isSubmittingRef.current = false;
      setUploading(false);
      return;
    }

    // 🆕 認証セッションの確認（スマホSafari対策）
    try {
      const session = await fetchAuthSession();
      if (!session.tokens?.idToken) {
        console.error('[SessionCheck] 認証セッションが確立されていません');
        setWarningMessage('認証セッションが確立されていません。ページを再読み込みしてください。');
        isSubmittingRef.current = false;
        setUploading(false);
        return;
      }
      console.warn('[SessionCheck] 認証セッション確認成功');
    } catch (error) {
      console.error('[SessionCheck] 認証セッション確認エラー:', error);
      setWarningMessage('認証エラーが発生しました。ページを再読み込みしてください。');
      isSubmittingRef.current = false;
      setUploading(false);
      return;
    }

    // entryIdを1回だけ生成（全ファイル共通）
    const entryId = crypto.randomUUID();

    // JSTで日時フォルダ生成
    const now = new Date();
    const jstOffset = 9 * 60 * 60 * 1000; // +9時間
    const jstDate = new Date(now.getTime() + jstOffset);

    const yyyyMMdd = jstDate.toISOString().slice(0, 10).replace(/-/g, '');
    const hhMMssSSS = jstDate.toISOString().slice(11, 23).replace(/:/g, '').replace('.', '');

    try {
      for (const photo of photos) {
        try {
          // アップロード中に設定
          setPhotos((prev) =>
            prev.map((p) => (p.id === photo.id ? { ...p, status: 'uploading' } : p))
          );

          // MapからFileオブジェクトを取得（Safari対策）
          const file = fileMapRef.current.get(photo.fileId);
          if (!file) {
            throw new Error('ファイルが見つかりません');
          }

          // EXIF位置情報の解析はサーバー側で実行されます（Safari対策）

          // サーバーに直接アップロード（圧縮なし）
          const uploadForm = new FormData();
          uploadForm.append('image', file, file.name);
          uploadForm.append('photoId', photo.photoId); // photoIdを追加
          uploadForm.append('title', title.trim());
          if (thoughts.trim()) {
            uploadForm.append('thoughts', thoughts.trim());
          }
          // 撮影日を ISO 8601 形式で送信（日付のみ、時刻は00:00:00）
          const shotAtDate = new Date(shotAt.getFullYear(), shotAt.getMonth(), shotAt.getDate());
          const shotAtISO = shotAtDate.toISOString();
          uploadForm.append('shotAt', shotAtISO);
          // 全ファイル共通のentryId、日時フォルダを送信
          uploadForm.append('entryId', entryId);
          uploadForm.append('dateFolder', yyyyMMdd);
          uploadForm.append('timeFolder', hhMMssSSS);

          // 画像ごとの位置情報を送信
          if (photo.location) {
            uploadForm.append('latitude', photo.location.lat.toString());
            uploadForm.append('longitude', photo.location.lng.toString());
          }

          const result = await fetchWithTimeout(
            '/api/upload-photo',
            {
              method: 'POST',
              body: uploadForm,
            },
            45000,
            (attempt) => {
              // リトライ時にステータスを更新
              setPhotos((prev) =>
                prev.map((p) =>
                  p.id === photo.id
                    ? { ...p, retryCount: attempt }
                    : p
                )
              );
            }
          );

          // エラーレスポンスをチェック
          if (!result.ok) {
            const errorData = (await result.json().catch(() => ({}))) as { error?: string };
            const errorMessage = errorData.error || 'サーバー処理に失敗しました';
            throw new Error(errorMessage);
          }

          const data = (await result.json()) as { location?: { lat: number; lng: number } };

          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photo.id
                ? {
                  ...p,
                  status: 'completed',
                  location: data.location,
                }
                : p
            )
          );
        } catch (error) {
          // エラーログの強化
          const file = fileMapRef.current.get(photo.fileId);
          console.error('=== アップロードエラー詳細 ===');
          if (file) {
            console.error('ファイル名:', file.name);
            console.error('ファイルサイズ:', file.size, 'bytes');
          }
          console.error('エラー内容:', error);
          if (error instanceof TypeError) {
            console.error('ネットワークエラーの可能性があります');
          }
          if (error instanceof Error) {
            console.error('エラーメッセージ:', error.message);
            console.error('エラー名:', error.name);
          }
          console.error('===========================');

          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photo.id
                ? {
                  ...p,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'アップロードに失敗しました',
                }
                : p
            )
          );
        }
      }
    } catch (error) {
      console.error('アップロード処理エラー:', error);
    } finally {
      setUploading(false);
      isSubmittingRef.current = false; // フラグをリセット
    }
  };

  // ステータス表示
  const getStatusText = (status: UploadedPhoto['status'], retryCount?: number) => {
    switch (status) {
      case 'pending':
        return '待機中';
      case 'uploading':
        if (retryCount && retryCount > 0) {
          return `再試行中... (${retryCount + 1}/3)`;
        }
        return 'アップロード中...';
      case 'completed':
        return '完了';
      case 'error':
        return 'エラー';
      default:
        return '';
    }
  };

  const getStatusColor = (status: UploadedPhoto['status']) => {
    switch (status) {
      case 'pending':
        return 'text-zinc-500';
      case 'uploading':
        return 'text-blue-600';
      case 'completed':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return '';
    }
  };

  // アップロード可能かチェック（2MBを超えるファイルがあるかチェック）
  const hasOversizedFile = photos.some((photo) => {
    const file = fileMapRef.current.get(photo.fileId);
    return file && file.size > MAX_FILE_SIZE;
  });
  const canUpload = !uploading && !isSubmittingRef.current && title.trim() && photos.length > 0 && !hasOversizedFile;

  return (
    <div className="space-y-6">
      {/* メッセージ表示エリア */}
      {successMessage && <SuccessMessage message={successMessage} />}
      {warningMessage && <WarningMessage message={warningMessage} />}

      {/* タイトル・感想入力フォーム */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
            タイトル <span className="text-red-600">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError && e.target.value.trim()) {
                setTitleError('');
              }
            }}
            onBlur={validateTitle}
            disabled={uploading}
            className={`w-full px-4 py-2 rounded-lg border transition-colors
              ${titleError
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900'
              }
              text-zinc-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500/50
              disabled:opacity-50 disabled:cursor-not-allowed`}
            placeholder="例: 2026-01-27 15:30"
          />
          {titleError && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{titleError}</p>
          )}
        </div>

        {/* 撮影日入力フィールド */}
        <div>
          <label htmlFor="shot-at" className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
            撮影日 <span className="text-red-600">*</span>
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="shot-at"
                variant="ghost"
                disabled={uploading}
                className={`w-full justify-start text-left font-normal h-11 px-4 rounded-lg border transition-colors
                  ${shotAtError
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900'
                  }
                  text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {shotAt ? format(shotAt, 'PPP', { locale: ja }) : <span>日付を選択</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" side="top" collisionPadding={8}>
              <Calendar
                mode="single"
                selected={shotAt}
                onSelect={(date) => {
                  if (date) {
                    setShotAt(date);
                    if (shotAtError) setShotAtError('');
                  }
                }}
                disabled={(date) =>
                  date > new Date() || date < new Date('1900-01-01')
                }
              />
            </PopoverContent>
          </Popover>
          {shotAtError && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{shotAtError}</p>
          )}
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            写真を撮影した日付を選択してください
          </p>
        </div>

        <div>
          <label htmlFor="thoughts" className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
            感想
          </label>
          <textarea
            id="thoughts"
            value={thoughts}
            onChange={(e) => setThoughts(e.target.value)}
            disabled={uploading}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600
              bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500/50
              disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            placeholder="この旅の思い出を記録しましょう..."
          />
        </div>
        {/* ドラッグ&ドロップエリア */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
          ${isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-zinc-300 dark:border-zinc-600 hover:border-blue-400'
            }
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          bg-white dark:bg-zinc-800`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-zinc-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-zinc-600 dark:text-zinc-400">
              {isDragActive ? (
                <p className="text-lg font-medium">ここにドロップしてください</p>
              ) : (
                <>
                  <p className="text-lg font-medium">
                    写真を選択、またはドラッグ&ドロップ
                  </p>
                  <p className="text-sm mt-2">
                    JPEG, PNG, HEIC形式 (最大{MAX_PHOTOS}枚)
                  </p>
                </>
              )}
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              {photos.length} / {MAX_PHOTOS} 枚選択中
            </p>
          </div>
        </div>
      </div>


      {/* 全アップロード完了メッセージ */}
      {allUploadsCompleted && (
        <SuccessMessage message="すべての写真のアップロードが完了しました" />
      )}

      {photos.length > 0 && !allUploadsCompleted && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
            アップロードする写真
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo) => {
              const file = fileMapRef.current.get(photo.fileId);
              if (!file) return null;

              return (
                <div
                  key={photo.id}
                  className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden"
                >
                  <div className="relative aspect-video">
                    <Image
                      src={photo.preview}
                      alt={file.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {!uploading && photo.status === 'pending' && (
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className={`text-xs ${file.size > MAX_FILE_SIZE ? 'text-red-600 dark:text-red-400 font-bold' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                      {file.size > MAX_FILE_SIZE && ' (サイズ超過)'}
                    </p>

                    {/* 位置設定ボタン */}
                    {!uploading && photo.status === 'pending' && (
                      <button
                        onClick={() => handleOpenLocationModal(photo.photoId)}
                        className="w-full px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <span>📍</span>
                        {photo.location ? (
                          photo.locationSource === 'exif' ? (
                            <span>位置情報確認（自動取得）</span>
                          ) : (
                            <span>位置情報変更</span>
                          )
                        ) : (
                          <span>位置を設定する</span>
                        )}
                      </button>
                    )}

                    {/* 位置情報表示 */}
                    {photo.location && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <span>📍</span>
                        <span>
                          {photo.location.lat.toFixed(4)}, {photo.location.lng.toFixed(4)}
                          {photo.locationSource === 'exif' && ' (自動取得)'}
                          {photo.locationSource === 'user' && ' (手動設定)'}
                        </span>
                      </div>
                    )}

                    {/* ステータス表示 */}
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${getStatusColor(photo.status)}`}>
                        {getStatusText(photo.status, photo.retryCount)}
                      </span>
                    </div>

                    {photo.error && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {photo.error}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* アップロードボタン */}
          <div className="flex flex-col items-center gap-2">
            {hasOversizedFile && (
              <p className="text-sm text-red-600 dark:text-red-400">
                2MBを超えるファイルがあります。削除してください。
              </p>
            )}
            <button
              onClick={handleUpload}
              disabled={!canUpload}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg"
            >
              {uploading || isSubmittingRef.current ? 'アップロード中...' : '刻む'}
            </button>
          </div>
        </div>
      )}

      {/* 位置設定モーダル */}
      <LocationSelectorModal
        isOpen={locationModalState.isOpen}
        onClose={handleCloseLocationModal}
        onSetLocation={handleSetLocation}
        initialLocation={
          locationModalState.photoId
            ? photos.find((p) => p.photoId === locationModalState.photoId)?.location
            : null
        }
        exifLocation={
          locationModalState.photoId
            ? photos.find((p) => p.photoId === locationModalState.photoId)?.exifLocation
            : null
        }
        photoPreview={
          locationModalState.photoId
            ? photos.find((p) => p.photoId === locationModalState.photoId)?.preview
            : undefined
        }
      />
    </div>
  );
}