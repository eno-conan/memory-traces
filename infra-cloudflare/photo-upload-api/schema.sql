-- D1データベーススキーマ
-- Cloudflare D1で実行するためのSQLスクリプト

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  google_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 写真メタデータテーブル
CREATE TABLE IF NOT EXISTS photo_metadata (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  uploaded_at TEXT DEFAULT (datetime('now')),
  entry_id TEXT REFERENCES travel_entries(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_photo_user ON photo_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_uploaded ON photo_metadata(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_photo_location ON photo_metadata(latitude, longitude) WHERE latitude IS NOT NULL;

-- サンプルユーザー（開発用）
INSERT OR IGNORE INTO users (id, email, name) VALUES ('default-user', 'test@example.com', 'Test User');

-- ============================
-- 旅行記録機能の追加
-- ============================

-- 旅行記録テーブル
CREATE TABLE IF NOT EXISTS travel_entries (
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

-- travel_entries インデックス
CREATE INDEX IF NOT EXISTS idx_travel_entries_user_created ON travel_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_travel_entries_updated ON travel_entries(updated_at DESC);

-- photo_metadata 追加インデックス
CREATE INDEX IF NOT EXISTS idx_photo_entry ON photo_metadata(entry_id);
CREATE INDEX IF NOT EXISTS idx_photo_entry_uploaded ON photo_metadata(entry_id, uploaded_at DESC) WHERE entry_id IS NOT NULL;

-- updated_at 自動更新トリガー（travel_entries テーブル用）
CREATE TRIGGER IF NOT EXISTS trg_travel_entries_updated_at
AFTER UPDATE ON travel_entries
FOR EACH ROW
WHEN OLD.updated_at = NEW.updated_at OR NEW.updated_at IS NULL
BEGIN
  UPDATE travel_entries
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;

-- updated_at 自動更新トリガー（users テーブル用）
CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
WHEN OLD.updated_at = NEW.updated_at OR NEW.updated_at IS NULL
BEGIN
  UPDATE users
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;

-- インデックス追加（撮影日での検索・ソート用）
CREATE INDEX IF NOT EXISTS idx_travel_entries_shot
ON travel_entries(shot_at DESC)
WHERE shot_at IS NOT NULL;