# Cloudflare D1

## [インストール/アップデート](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
```sh
npm i -D wrangler@latest
```

## [DB作成](https://developers.cloudflare.com/workers/wrangler/commands/#d1)
```sh
npx wrangler d1 create travel_photo_management
```
## D1に対してSQLファイル実行
### localの場合
wrangler d1 execute travel_photo_management --file=infra-cloudflare/photo-upload-api/dummy_data.sql
### remoteの場合
npx wrangler d1 execute travel_photo_management --remote --file=infra-cloudflare/photo-upload-api/dummy_data.sql

## DB操作

```sql
# テーブルのカラム情報取得
PRAGMA **table_info**(photo_metadata);
PRAGMA table_info(travel_entries);
# データ取得
select * FROM photo_metadata;
select * FROM travel_entries;
# データ削除（**注意**）
DELETE FROM photo_metadata;
DELETE FROM travel_entries;
```

## GUI Viewer
- https://github.com/JacobLinCool/d1-manager
- https://dbcode.io/docs/supported-databases/d1/d1