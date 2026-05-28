import React, { useId, memo } from "react";

export interface MemoryCardProps {
  /**
   * タイトル（思い出のタイトル）
   */
  title: string;
  /**
   * 説明文
   */
  description: string;
  /**
   * 日付
   */
  date: string;
  /**
   * カードのバリエーション
   */
  variant?: "default" | "compact" | "detailed";
  /**
   * クリック時のハンドラ
   */
  onClick?: () => void;
}

/**
 * 思い出記録アプリ用のカードコンポーネント
 *
 * このコンポーネントは、ユーザーの思い出を美しく表示するために設計されています。
 * Noto Sans JPフォントを使用して、日本語テキストがモダンで読みやすく表示されます。
 */
export const MemoryCard = memo<MemoryCardProps>(function MemoryCard({
  title,
  description,
  date,
  variant = "default",
  onClick,
}) {
  const titleId = useId();
  const baseStyles =
    "rounded-lg shadow-md transition-all duration-200 hover:shadow-lg cursor-pointer";
  const variantStyles = {
    default: "p-6 bg-white dark:bg-gray-800",
    compact: "p-4 bg-white dark:bg-gray-800",
    detailed: "p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.();
        }
      }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <h3 id={titleId} className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <time className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap ml-4">
            {date}
          </time>
        </div>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
});
