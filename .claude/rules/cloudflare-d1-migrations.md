# Cloudflare D1 マイグレーション管理ルール

## スキーマ管理の基本方針

### schema.sql の役割
- **新規環境専用**の完全なスキーマ定義
- すべてのテーブル、カラム、インデックス、トリガーを含む
- `CREATE TABLE` に全カラムを定義する(**ALTER TABLE は使わない**)
- 新規環境では `schema.sql` を1回実行するだけでOK

### migrations/ の役割
- **既存環境への増分変更**用
- 各マイグレーションファイルは1つの変更を含む
- ファイル名は実行順序を保証する命名規則: `0001_*.sql`, `0002_*.sql`, ...
- カラム追加の場合、そのカラムに関連するインデックスも同じファイルに含める

## 既存環境でのスキーマ変更手順

### ❌ 間違った方法
```sql
-- schema.sql に ALTER TABLE を追加してはいけない
ALTER TABLE table_name ADD COLUMN new_column TEXT;
```

### ✅ 正しい方法

1. **マイグレーションファイルを作成**
```bash
# migrations/0002_add_column_name.sql
ALTER TABLE table_name ADD COLUMN new_column TEXT NOT NULL DEFAULT '';

-- 関連するインデックスも同じファイルに含める
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(new_column);
```

2. **schema.sql の CREATE TABLE にカラムを追加**
```sql
CREATE TABLE IF NOT EXISTS table_name (
  id TEXT PRIMARY KEY,
  existing_column TEXT,
  new_column TEXT NOT NULL DEFAULT '',  -- 追加
  ...
);
```

3. **マイグレーションを実行**
```bash
npx wrangler d1 execute <db-name> --remote --file=./migrations/0002_add_column_name.sql
```

## 重要な注意事項

### ⚠️ CREATE TABLE IF NOT EXISTS の挙動
- テーブルが既に存在する場合、**何も実行されない**
- つまり、既存テーブルに新しいカラムは追加されない
- そのため、既存環境では必ずマイグレーションファイルを使う

### ⚠️ schema.sql を既存環境で実行する場合
- `CREATE TABLE IF NOT EXISTS` は既存テーブルをスキップ
- その後の `CREATE INDEX` が存在しないカラムを参照するとエラーになる
- **既存環境では schema.sql を実行しない**

## マイグレーション実行後の確認

マイグレーション実行後は、schema.sql の内容と実際のデータベーススキーマが一致していることを確認する:
- schema.sql: 最新の完全なスキーマ
- 実際のDB: マイグレーションを順次適用した結果

両者は同じ状態になっているべき。
