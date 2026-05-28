-- 不要なインデックスを削除
-- idx_travel_entries_user_created (user_id, created_at DESC) で代替済み
DROP INDEX IF EXISTS idx_travel_entries_created;

-- user_id 単独インデックスは複合インデックスで代替済み
DROP INDEX IF EXISTS idx_travel_entries_user;
