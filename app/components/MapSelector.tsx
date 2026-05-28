/// <reference types="@types/google.maps" />
'use client';

import { Map, AdvancedMarker, MapMouseEvent } from '@vis.gl/react-google-maps';
import { useCallback, useState } from 'react';

export interface MapSelectorProps {
  initialLocation?: { lat: number; lng: number } | null;
  onLocationChange: (location: { lat: number; lng: number }) => void;
}

// 東京駅をデフォルト位置とする
const DEFAULT_LOCATION = { lat: 35.6812, lng: 139.7671 };
const DEFAULT_ZOOM = 14;

/**
 * 地図上でマーカーをドラッグ&クリックで位置を選択するコンポーネント
 */
export function MapSelector({ initialLocation, onLocationChange }: MapSelectorProps) {
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number }>(
    initialLocation || DEFAULT_LOCATION
  );

  // 地図クリック時の処理
  const handleMapClick = useCallback(
    (event: MapMouseEvent) => {
      if (!event.detail.latLng) return;

      const newPosition = {
        lat: event.detail.latLng.lat,
        lng: event.detail.latLng.lng,
      };

      setMarkerPosition(newPosition);
      onLocationChange(newPosition);
    },
    [onLocationChange]
  );

  // マーカードラッグ時の処理
  const handleMarkerDragEnd = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;

      const newPosition = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };

      setMarkerPosition(newPosition);
      onLocationChange(newPosition);
    },
    [onLocationChange]
  );

  return (
    <div className="w-full h-full">
      <Map
        mapId="location-selector-map"
        defaultCenter={initialLocation || DEFAULT_LOCATION}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        onClick={handleMapClick}
        className="w-full h-full"
      >
        <AdvancedMarker
          position={markerPosition}
          draggable
          onDragEnd={handleMarkerDragEnd}
        />
      </Map>
    </div>
  );
}
