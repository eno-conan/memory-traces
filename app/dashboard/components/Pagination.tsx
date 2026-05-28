'use client';

import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const handleFirstPage = () => {
    if (!isFirstPage && !disabled) {
      onPageChange(1);
    }
  };

  const handlePreviousPage = () => {
    if (!isFirstPage && !disabled) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (!isLastPage && !disabled) {
      onPageChange(currentPage + 1);
    }
  };

  const handleLastPage = () => {
    if (!isLastPage && !disabled) {
      onPageChange(totalPages);
    }
  };

  return (
    <nav
      role="navigation"
      aria-label="ページネーション"
      className="flex items-center justify-center gap-2 mt-4 select-none"
      style={{ caretColor: 'transparent' }}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={handleFirstPage}
        disabled={isFirstPage || disabled}
        aria-label="最初のページへ"
        className="h-9 px-3"
      >
        First
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviousPage}
        disabled={isFirstPage || disabled}
        aria-label="前のページへ"
        className="h-9 px-3"
      >
        Previous
      </Button>

      <div
        className="px-4 text-sm font-medium text-zinc-700 dark:text-zinc-300 min-w-20 text-center"
        aria-current="page"
        aria-live="polite"
      >
        {currentPage} / {totalPages}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNextPage}
        disabled={isLastPage || disabled}
        aria-label="次のページへ"
        className="h-9 px-3"
      >
        Next
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleLastPage}
        disabled={isLastPage || disabled}
        aria-label="最後のページへ"
        className="h-9 px-3"
      >
        Last
      </Button>
    </nav>
  );
}
