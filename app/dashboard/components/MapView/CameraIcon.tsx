import { memo } from 'react';

export const CameraIcon = memo(() => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-8 h-8 text-red-600 drop-shadow-lg transition-transform hover:scale-110 cursor-pointer rotate-8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="旅行エントリーの位置"
    >
      <title>カメラマーカー</title>
      {/* カメラのアイコン */}
      {/* 上部のビューファインダー */}
      <path d="M9 3L7.5 5H4C3.5 5 3 5.5 3 6V18C3 18.5 3.5 19 4 19H20C20.5 19 21 18.5 21 18V6C21 5.5 20.5 5 20 5H16.5L15 3H9Z" fill="currentColor" />
      {/* レンズ */}
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.2" stroke="white" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" fill="white" opacity="0.4" stroke="white" strokeWidth="1" />
      {/* フラッシュ */}
      <circle cx="17.5" cy="8" r="1" fill="white" opacity="0.6" />
    </svg>
  );
});

CameraIcon.displayName = 'CameraIcon';
