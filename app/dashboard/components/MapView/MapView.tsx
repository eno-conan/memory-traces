'use client';

import { Button } from '@/components/ui/button';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { TravelEntry } from '../../types';
import { MapDetailContent } from './MapDetailContent';
import { MapDetailPanel } from './MapDetailPanel';
import { MapMarkers } from './MapMarkers';

export interface MapViewProps {
  entries: TravelEntry[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

// 東京駅周辺をデフォルトの中心位置とする
const DEFAULT_CENTER = { lat: 35.6812, lng: 139.7671 };
const DEFAULT_ZOOM = 10;

/**
 * マップの表示範囲を自動調整するコントローラー
 * useMap()は<APIProvider>内から呼び出す必要がある
 */
function MapBoundsController({ entries }: { entries: TravelEntry[] }) {
  const map = useMap();

  const entriesWithLocation = useMemo(
    () => entries.filter((e) => !!e.location),
    [entries]
  );

  useEffect(() => {
    if (!map) return;

    if (entriesWithLocation.length === 0) {
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(DEFAULT_ZOOM);
      return;
    }

    if (entriesWithLocation.length === 1) {
      const loc = entriesWithLocation[0].location!;
      map.setCenter({ lat: loc.latitude, lng: loc.longitude });
      map.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    entriesWithLocation.forEach((entry) => {
      bounds.extend({ lat: entry.location!.latitude, lng: entry.location!.longitude });
    });
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
  }, [map, entriesWithLocation]);

  return null;
}

export default function MapView({ entries, onEdit, onDelete, isLoading = false }: MapViewProps) {
  const [selectedEntry, setSelectedEntry] = useState<TravelEntry | null>(null);

  // Google Maps APIキーの確認
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // ページ遷移時に選択状態をリセット
  useEffect(() => {
    setSelectedEntry(null);
  }, [entries]);

  if (!apiKey) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-12 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">
          Google Maps APIキーが設定されていません
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          .env.localにNEXT_PUBLIC_GOOGLE_MAPS_API_KEYを設定してください
        </p>
      </div>
    );
  }

  // マップの中心位置（現在地があれば使用、なければデフォルト）
  const mapCenter = useMemo(() => {
    return DEFAULT_CENTER;
  }, []);

  // マーカークリックハンドラ
  const handleMarkerClick = (entry: TravelEntry) => {
    setSelectedEntry(entry);
  };

  // パネルを閉じる
  const handleClosePanel = () => {
    setSelectedEntry(null);
  };

  return (
    <APIProvider apiKey={apiKey}>
      {/* 全体をflex-colレイアウトに変更 */}
      <div className="flex flex-col gap-4">
        {/* 地図コンテナ */}
        <div className="relative w-full h-[400px] md:h-[600px] rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
          <Map
            mapId="travel-map"
            defaultCenter={mapCenter}
            defaultZoom={DEFAULT_ZOOM}
            gestureHandling="greedy"
            disableDefaultUI={false}
            className="w-full h-full"
          >
            {/* マップ表示範囲の自動調整 */}
            <MapBoundsController entries={entries} />

            {/* エントリベースのマーカー */}
            <MapMarkers entries={entries} onMarkerClick={handleMarkerClick} />
          </Map>

          {/* ローディングオーバーレイ */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-zinc-600 dark:text-zinc-400 text-sm">
                  データを読み込み中...
                </span>
              </div>
            </div>
          )}

          {/* モバイルモーダル */}
          <MapDetailPanel
            entry={selectedEntry}
            onClose={handleClosePanel}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>

        {/* PC詳細セクション（地図の下） */}
        {selectedEntry && (
          <div
            className="hidden md:block transition-all duration-300 ease-in-out"
          >
            {/* ヘッダー */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-t-lg p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {selectedEntry.title}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClosePanel}
                aria-label="閉じる"
                className="h-9 w-9"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* コンテンツ */}
            <div className="bg-white dark:bg-zinc-900 border-x border-b border-zinc-200 dark:border-zinc-700 rounded-b-lg p-4">
              <MapDetailContent
                entry={selectedEntry}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  );
}
