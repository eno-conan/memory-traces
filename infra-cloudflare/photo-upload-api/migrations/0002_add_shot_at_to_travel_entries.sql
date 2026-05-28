-- Migration: Add shot_at column to travel_entries table
-- Date: 2026-02-08

-- shot_at カラムを追加（撮影日時）
ALTER TABLE travel_entries ADD COLUMN shot_at TEXT NOT NULL DEFAULT '';
-- インデックス追加（撮影日での検索・ソート用）
CREATE INDEX IF NOT EXISTS idx_travel_entries_shot
ON travel_entries(shot_at DESC)
WHERE shot_at IS NOT NULL AND shot_at != '';
