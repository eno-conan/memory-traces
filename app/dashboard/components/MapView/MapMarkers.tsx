import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { memo } from 'react';
import type { TravelEntry } from '../../types';
import { CameraIcon } from './CameraIcon';

type EntryWithLocation = TravelEntry & {
  location: NonNullable<TravelEntry['location']>;
};

interface MapMarkersProps {
  entries: TravelEntry[];
  onMarkerClick: (entry: TravelEntry) => void;
}

export const MapMarkers = memo(({ entries, onMarkerClick }: MapMarkersProps) => {
  const entriesWithLocation = entries.filter(
    (e): e is EntryWithLocation => !!e.location
  );

  return (
    <>
      {entriesWithLocation.map((entry) => (
        <AdvancedMarker
          key={entry.id}
          position={{ lat: entry.location.latitude, lng: entry.location.longitude }}
          onClick={() => onMarkerClick(entry)}
          title={entry.title}
        >
          <CameraIcon />
        </AdvancedMarker>
      ))}
    </>
  );
});

MapMarkers.displayName = 'MapMarkers';
