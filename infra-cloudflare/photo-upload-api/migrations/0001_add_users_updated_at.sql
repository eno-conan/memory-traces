-- Migration: Add updated_at column to users table (Fixed)
-- Date: 2026-01-26

-- 1. カラムを追加（関数を使わず、一時的に NULL 許容で追加）
ALTER TABLE users ADD COLUMN updated_at TEXT;

-- 2. 既存の行を更新（created_at の値を入れる）
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;

-- 3. トリガーを作成（今後、更新があった際に自動で現在時刻が入るようにする）
CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
WHEN OLD.updated_at = NEW.updated_at OR NEW.updated_at IS NULL
BEGIN
  UPDATE users
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;