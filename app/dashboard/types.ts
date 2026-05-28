import type { TravelEntryPhoto } from '@/app/api/travel-entries/types';

export interface TravelEntry {
  id: string;
  title: string;
  thoughts: string;
  shotAt: string | null;
  location?: {
    latitude: number;
    longitude: number;
  };
  photos: TravelEntryPhoto[];
  createdAt: string;  // ISO 8601形式の文字列
  updatedAt: string;  // ISO 8601形式の文字列
}
