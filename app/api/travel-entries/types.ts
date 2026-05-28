export interface TravelEntriesRequest {
  page?: number;
  pageSize?: number;
  year?: string;
  keyword?: string;
}

export interface TravelEntryPhoto {
  id: string;
  url: string;
  r2Key: string;
  latitude?: number;
  longitude?: number;
}

export interface TravelEntry {
  id: string;
  title: string;
  thoughts: string;
  shotAt: string | null;  // ISO 8601形式の文字列、未設定時は null
  location?: {
    latitude: number;
    longitude: number;
  };
  photos: TravelEntryPhoto[];
  createdAt: string;  // ISO 8601形式の文字列
  updatedAt: string;  // ISO 8601形式の文字列
}

export interface TravelEntriesResponse {
  success: boolean;
  entries: TravelEntry[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface CloudflareEntryPhoto {
  id: string;
  r2_key: string;
  url: string;  // Workers側で生成された Public URL
  latitude?: number;
  longitude?: number;
}

export interface CloudflareEntry {
  id: string;
  title: string;
  thoughts?: string;
  shotAt: string | null;
  location?: {
    latitude: number;
    longitude: number;
  };
  photos: CloudflareEntryPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface CloudflareWorkersResponse {
  success: boolean;
  error?: string;
  entries: CloudflareEntry[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface D1TravelEntry {
  id: string;
  user_id: string;
  title: string;
  thoughts: string | null;
  shot_at: string | null;
  r2_folder: string;
  created_at: string;
  updated_at: string;
}

export interface D1PhotoMetadata {
  entry_id: string;
  id: string;
  r2_key: string;
  uploaded_at: string;
}
