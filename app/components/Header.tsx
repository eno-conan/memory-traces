'use client';

import { Button } from '@/components/ui/button';

// SVG Icons
function LogoutIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 10h16M4 14h16M4 18h16"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
}

interface HeaderProps {
  title: string;
  onSignOut: () => void;
  showDashboardButton?: boolean;
  onDashboardClick?: () => void;
  dashboardButtonLabel?: string;
  showRegisterButton?: boolean;
  onRegisterClick?: () => void;
}

export default function Header({
  title,
  onSignOut,
  showDashboardButton = false,
  onDashboardClick,
  dashboardButtonLabel = 'ダッシュボード',
  showRegisterButton = false,
  onRegisterClick,
}: HeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
        {title}
      </h1>
      <div className="flex gap-3">
        {/* 一覧ボタン */}
        {showDashboardButton && onDashboardClick && (
          <Button
            variant="navigation"
            size="responsive"
            onClick={onDashboardClick}
            aria-label={dashboardButtonLabel}
          >
            <span className="md:hidden">
              <ListIcon />
            </span>
            <span className="hidden md:inline">
              {dashboardButtonLabel}
            </span>
          </Button>
        )}

        {/* 刻むボタン */}
        {showRegisterButton && onRegisterClick && (
          <Button
            variant="primary"
            size="responsive"
            onClick={onRegisterClick}
            aria-label="あしあとを刻む"
          >
            <span className="md:hidden">
              <PencilIcon />
            </span>
            <span className="hidden md:inline">
              刻む
            </span>
          </Button>
        )}

        {/* ログアウトボタン */}
        <Button
          variant="navigation"
          size="responsive"
          onClick={onSignOut}
          aria-label="ログアウト"
        >
          <span className="md:hidden">
            <LogoutIcon />
          </span>
          <span className="hidden md:inline">
            ログアウト
          </span>
        </Button>
      </div>
    </div>
  );
}
