'use client';

import type { TravelEntriesResponse } from '@/app/api/travel-entries/types';
import { signOut as amplifySignOut, fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
// import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Header from '../components/Header';
import TravelEntriesTable from './components/TravelEntriesTable';
import Pagination from './components/Pagination';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { TravelEntry } from './types';

// const MFASetup = dynamic(() => import('../components/MFASetup'), {
//   loading: () => <div className="p-4 text-zinc-600 dark:text-zinc-300">MFAセットアップを読み込み中...</div>,
//   ssr: false
// });

// const MFASettings = dynamic(() => import('../components/MFASettings'), {
//   loading: () => <div className="p-4 text-zinc-600 dark:text-zinc-300">MFA設定を読み込み中...</div>,
//   ssr: false
// });

// メモ化されたコンポーネント
// const MemoizedMFASettings = memo(MFASettings);

interface User {
  userId?: string;
  username?: string;
  signInDetails?: {
    loginId?: string;
  };
  'cognito:groups'?: string[];
}

interface DashboardContentProps {
  signOut?: () => Promise<void>;
  user?: User;
  router: ReturnType<typeof useRouter>;
}

function DashboardContent({ signOut, user, router }: DashboardContentProps) {
  // ページング状態管理
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6); // Phase 1: 10件→6件に削減（40%改善）
  const [entries, setEntries] = useState<TravelEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  // 検索条件の状態管理
  const [searchYear, setSearchYear] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>('');

  // URLクエリパラメータから初期値を設定
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const year = params.get('year') || '';
    const keyword = params.get('keyword') || '';
    const page = params.get('page');

    setSearchYear(year);
    setSearchKeyword(keyword);
    setDebouncedKeyword(keyword);
    if (page) {
      setCurrentPage(parseInt(page, 10));
    }
  }, []);

  // キーワードのデバウンス処理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // URLクエリパラメータを構築
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: pageSize.toString(),
        });

        if (searchYear) {
          params.set('year', searchYear);
        }
        if (debouncedKeyword) {
          params.set('keyword', debouncedKeyword);
        }

        // URLを更新(ブラウザ履歴に追加せずに)
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);

        const uploadedFlag = sessionStorage.getItem('travel-entry-uploaded');
        if (uploadedFlag) {
          sessionStorage.removeItem('travel-entry-uploaded');
        }
        const fetchOptions: RequestInit =
          (dataVersion > 0 || uploadedFlag !== null) ? { cache: 'no-store' } : {};
        const response = await fetch(`/api/travel-entries?${params.toString()}`, fetchOptions);

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch entries');
        }

        const data = (await response.json()) as TravelEntriesResponse;

        if (data.success) {
          setEntries(data.entries);
          setTotalCount(data.pagination.totalCount);
        } else {
          console.error('API error:', data.error);
        }
      } catch (error) {
        console.error('Failed to fetch entries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, pageSize, searchYear, debouncedKeyword, router, dataVersion]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // ページ変更ハンドラー
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // 検索条件変更ハンドラー
  const handleYearChange = (year: string) => {
    setSearchYear(year);
    setCurrentPage(1); // 検索条件変更時は1ページ目に戻る
  };

  const handleKeywordChange = (keyword: string) => {
    setSearchKeyword(keyword);
    setCurrentPage(1); // 検索条件変更時は1ページ目に戻る
  };

  const handleSearch = () => {
    // 検索ボタンクリック時は即座に検索(デバウンスをスキップ)
    setDebouncedKeyword(searchKeyword);
    setCurrentPage(1);
  };

  // イベントハンドラー
  const handleEdit = (id: string) => {
    router.push(`/detail/${id}`);
  };

  // 削除機能の状態管理
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeleteError(null);
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTargetId) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/travel-entries/${deleteTargetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        // 404は既に削除済みとみなし成功扱い（冪等性）
        if (response.status === 404) {
          setEntries(prev => prev.filter(e => e.id !== deleteTargetId));
          setTotalCount(prev => Math.max(0, prev - 1));
          setDeleteTargetId(null);
          setDataVersion(prev => prev + 1);
          return;
        }
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? '削除に失敗しました');
      }

      setEntries(prev => prev.filter(e => e.id !== deleteTargetId));
      setTotalCount(prev => Math.max(0, prev - 1));
      setDeleteTargetId(null);
      setDataVersion(prev => prev + 1);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : '削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTargetId, router]);

  const handleDeleteCancel = useCallback(() => {
    if (!isDeleting) {
      setDeleteTargetId(null);
      setDeleteError(null);
    }
  }, [isDeleting]);

  // const router = useRouter();
  // const [currentUserId, setCurrentUserId] = useState<string>('');
  // const [mfaSetupRequired, setMfaSetupRequired] = useState<boolean | null>(null);
  // const [checkingMfa, setCheckingMfa] = useState(true);
  // const [isRequiredMFAUser, setIsRequiredMFAUser] = useState<boolean>(false);

  // // MFAセットアップ状態をチェック
  // useEffect(() => {
  //   const checkMFAStatus = async () => {
  //     try {
  //       setCheckingMfa(true);

  //       // Check if user is in lambda-executors group
  //       const mfaRequired = await isMFARequired();
  //       setIsRequiredMFAUser(mfaRequired);

  //       const mfaPreference = await fetchMFAPreference();

  //       // TOTPがPREFERREDまたはENABLEDになっていない場合はセットアップが必要
  //       const needsSetup = mfaPreference.preferred !== 'TOTP' &&
  //         mfaPreference.enabled?.includes('TOTP') !== true;

  //       // Only require setup if:
  //       // 1. User is in lambda-executors group (always required), OR
  //       // 2. User previously enabled MFA (preserve their choice)
  //       const shouldShowSetup = needsSetup && (
  //         mfaRequired || // Required for lambda-executors
  //         mfaPreference.enabled?.includes('TOTP') === true // Previously enabled
  //       );

  //       setMfaSetupRequired(shouldShowSetup);
  //     } catch (err) {
  //       console.error('MFA status check error:', err);
  //       // On error, check if MFA is required for this user
  //       const mfaRequired = await isMFARequired();
  //       setIsRequiredMFAUser(mfaRequired);
  //       setMfaSetupRequired(mfaRequired); // Only force setup for required users
  //     } finally {
  //       setCheckingMfa(false);
  //     }
  //   };

  //   if (user) {
  //     checkMFAStatus();
  //   }
  // }, [user]);

  // // SECURITY: ユーザーが変更された場合、前のユーザーの状態をクリア
  // useEffect(() => {
  //   const userId = user?.userId || user?.username || '';
  //   if (userId && userId !== currentUserId) {
  //     // 新しいユーザーに切り替わったため、状態をクリア
  //     setCurrentUserId(userId);
  //     // MFAチェックも再実行
  //     setMfaSetupRequired(null);
  //     setCheckingMfa(true);
  //     setIsRequiredMFAUser(false); // Clear group membership flag
  //   }
  // }, [user?.userId, user?.username, currentUserId]);

  // MFAチェック中
  // if (checkingMfa) {
  //   return (
  //     <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
  //       <div className="text-zinc-600 dark:text-zinc-300">
  //         MFA設定を確認中...
  //       </div>
  //     </div>
  //   );
  // }

  // // MFAセットアップが必要な場合
  // if (mfaSetupRequired) {
  //   return (
  //     <MFASetup
  //       onComplete={() => setMfaSetupRequired(false)}
  //       isRequired={isRequiredMFAUser}
  //     />
  //   );
  // }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Header
          title="あしあと一覧"
          onSignOut={signOut || (() => { })}
          showRegisterButton={true}
          onRegisterClick={() => router.push('/register')}
        />

        {/* MFA Settings Section */}
        {/* <div className="mb-6">
            <MemoizedMFASettings isRequired={isRequiredMFAUser} />
          </div> */}

        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
          <div className="mb-6 p-4 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              ユーザー情報
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              <span className="font-medium">ユーザー名:</span> {user?.username || user?.userId}
            </p>
          </div>

          {/* 検索セクション */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <label htmlFor="year-select" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                  年：
                </label>
                <select
                  id="year-select"
                  value={searchYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-32"
                >
                  <option value="">全て</option>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 w-full md:min-w-75">
                <input
                  type="text"
                  placeholder="キーワード検索..."
                  value={searchKeyword}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors flex items-center gap-2 whitespace-nowrap w-full md:w-auto justify-center"
              >
                <span className="md:hidden">
                  <SearchIcon />
                </span>
                <span className="hidden md:inline">
                  検索
                </span>
              </button>
            </div>
          </div>

          {/* ページング（検索条件とタブの間） */}
          {totalPages > 1 && (
            <div className="mb-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                disabled={isLoading}
              />
            </div>
          )}

          {/* 旅行記録セクション */}
          <div className="mb-6">
            <TravelEntriesTable
              entries={entries}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => { if (!open) handleDeleteCancel(); }}
        title="あしあとの削除"
        description="この記録を削除しますか？この操作は取り消せません。関連する写真も削除されます。"
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        variant="destructive"
      />

      {/* 削除エラー通知 */}
      {deleteError && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg max-w-sm">
          <p className="text-sm text-red-800 dark:text-red-200">{deleteError}</p>
          <button
            onClick={() => setDeleteError(null)}
            className="mt-2 text-xs text-red-600 dark:text-red-400 underline"
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // 🆕 認証セッションのプリロード（スマホSafari対策）
  useEffect(() => {
    const preloadSession = async () => {
      try {
        await fetchAuthSession({ forceRefresh: true });
        console.warn('[SessionPreload] Amplify認証セッションをプリロードしました');
      } catch (error) {
        console.error('[SessionPreload] セッションプリロードエラー:', error);
        // エラーでも処理は継続（後続のセッション確認で対応）
      }
    };

    preloadSession();
  }, []); // マウント時のみ実行

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        const session = await fetchAuthSession();

        // Get user groups from token
        const groups = session.tokens?.accessToken?.payload['cognito:groups'] as string[] | undefined;

        const userData: User = {
          userId: currentUser.userId,
          username: currentUser.username,
          signInDetails: currentUser.signInDetails,
          // Add groups to user object for compatibility with existing code
          ...(groups && { 'cognito:groups': groups }),
        };

        setUser(userData);
      } catch {
        // ユーザーがログインしていない場合、ログインページにリダイレクト
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // SECURITY: ユーザーが変更された場合の検出と状態クリア
  useEffect(() => {
    if (user?.userId && user.userId !== currentUserId) {
      setCurrentUserId(user.userId);
    }
  }, [user?.userId, currentUserId]);

  const handleSignOut = async () => {
    try {
      await amplifySignOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">
          読み込み中...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <DashboardContent signOut={handleSignOut} user={user} router={router} />;
}
