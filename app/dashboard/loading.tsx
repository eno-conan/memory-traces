export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 animate-pulse">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
            <div className="h-40 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
