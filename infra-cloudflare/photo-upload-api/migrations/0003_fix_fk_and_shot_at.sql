-- マイグレーション #0003
-- 1. travel_entries.shot_at を NOT NULL DEFAULT '' → NULL 許可に変更（空文字を NULL に変換）
-- 2. photo_metadata.user_id 外部キーに ON DELETE CASCADE を追加
--
-- SQLite は ALTER TABLE MODIFY COLUMN / ADD CONSTRAINT 非対応のため
-- テーブル再作成方式（rename trick）を使用する

-- ============================================================
-- 1. travel_entries テーブル再作成
-- ============================================================

CREATE TABLE travel_entries_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thoughts TEXT,
  r2_folder TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  shot_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 空文字を NULL に変換しながらデータ移行
INSERT INTO travel_entries_new (id, user_id, title, thoughts, r2_folder, created_at, updated_at, shot_at)
SELECT id, user_id, title, thoughts, r2_folder, created_at, updated_at, NULLIF(shot_at, '')
FROM travel_entries;

-- 旧インデックス・トリガー・テーブルを削除
DROP INDEX IF EXISTS idx_travel_entries_user;
DROP INDEX IF EXISTS idx_travel_entries_created;
DROP INDEX IF EXISTS idx_travel_entries_user_created;
DROP INDEX IF EXISTS idx_travel_entries_updated;
DROP INDEX IF EXISTS idx_travel_entries_shot;
DROP TRIGGER IF EXISTS trg_travel_entries_updated_at;
DROP TABLE travel_entries;

ALTER TABLE travel_entries_new RENAME TO travel_entries;

-- インデックス再作成（shot_at の WHERE 条件を簡略化）
CREATE INDEX idx_travel_entries_user ON travel_entries(user_id);
CREATE INDEX idx_travel_entries_created ON travel_entries(created_at DESC);
CREATE INDEX idx_travel_entries_user_created ON travel_entries(user_id, created_at DESC);
CREATE INDEX idx_travel_entries_updated ON travel_entries(updated_at DESC);
CREATE INDEX idx_travel_entries_shot ON travel_entries(shot_at DESC) WHERE shot_at IS NOT NULL;

-- トリガー再作成
CREATE TRIGGER trg_travel_entries_updated_at
AFTER UPDATE ON travel_entries
FOR EACH ROW
WHEN OLD.updated_at = NEW.updated_at OR NEW.updated_at IS NULL
BEGIN
  UPDATE travel_entries SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================
-- 2. photo_metadata テーブル再作成
-- ============================================================

CREATE TABLE photo_metadata_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  uploaded_at TEXT DEFAULT (datetime('now')),
  entry_id TEXT REFERENCES travel_entries(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO photo_metadata_new SELECT * FROM photo_metadata;

DROP INDEX IF EXISTS idx_photo_user;
DROP INDEX IF EXISTS idx_photo_uploaded;
DROP INDEX IF EXISTS idx_photo_location;
DROP INDEX IF EXISTS idx_photo_entry;
DROP INDEX IF EXISTS idx_photo_entry_uploaded;
DROP TABLE photo_metadata;

ALTER TABLE photo_metadata_new RENAME TO photo_metadata;

-- インデックス再作成
CREATE INDEX idx_photo_user ON photo_metadata(user_id);
CREATE INDEX idx_photo_uploaded ON photo_metadata(uploaded_at DESC);
CREATE INDEX idx_photo_location ON photo_metadata(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_photo_entry ON photo_metadata(entry_id);
CREATE INDEX idx_photo_entry_uploaded ON photo_metadata(entry_id, uploaded_at DESC) WHERE entry_id IS NOT NULL;
