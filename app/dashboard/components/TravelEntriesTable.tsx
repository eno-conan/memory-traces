'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { TravelEntry } from '../types';
import { TravelEntryTableRow } from './TravelEntryTableRow';
import { TravelEntryCard } from './TravelEntryCard';

// MapViewコンポーネントを動的インポート（SSR無効化）
const MapView = dynamic(() => import('./MapView/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="text-zinc-600 dark:text-zinc-400">
          地図を読み込み中...
        </span>
      </div>
    </div>
  ),
});

interface TravelEntriesTableProps {
  entries: TravelEntry[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export default function TravelEntriesTable({
  entries,
  onEdit = () => { },
  onDelete = () => { },
  isLoading = false,
}: TravelEntriesTableProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'map')}>
        <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
          <TabsTrigger value="list" className="h-12">List View</TabsTrigger>
          <TabsTrigger value="map" className="h-12">Map View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none">
          {/* デスクトップ: テーブル表示 */}
          <div className="hidden md:block rounded-lg border border-zinc-200 dark:border-zinc-700">
            <Table className="text-base">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/5 text-center">Photo</TableHead>
                  <TableHead className="w-2/5 text-center">Title / Note</TableHead>
                  <TableHead className="w-2/5 text-center">Captured / Recorded</TableHead>
                  <TableHead className="w-1/5 text-center">Edit / Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="text-zinc-600 dark:text-zinc-400">
                          データを読み込み中...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                      旅行記録がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TravelEntryTableRow
                      key={entry.id}
                      entry={entry}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* モバイル: カード表示 */}
          <div className="md:hidden">
            {isLoading ? (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-12 flex flex-col items-center justify-center gap-2 min-h-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-zinc-600 dark:text-zinc-400">
                  データを読み込み中...
                </span>
              </div>
            ) : entries.length === 0 ? (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-12 text-center text-zinc-500">
                旅行記録がありません
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {entries.map((entry) => (
                  <TravelEntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </div>

        </TabsContent>

        <TabsContent value="map" className="mt-6 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none">
          <MapView
            entries={entries}
            onEdit={onEdit}
            onDelete={onDelete}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
