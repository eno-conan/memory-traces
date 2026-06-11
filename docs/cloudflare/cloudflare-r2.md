# Cloudflare R2

## Authentication
https://developers.cloudflare.com/r2/api/tokens/

## rclone
ストレージ操作を簡単にしてくれるみたい
- [rclone](https://github.com/rclone/rclone)
- [R2における使い方](https://rclone.org/s3/#cloudflare-r2)

### setup
```sh
choco install rclone

Storage> s3
Provider> Cloudflare
Access Key ID> xxxx
Secret Access Key> yyyy
Endpoint> https://<accountid>.r2.cloudflarestorage.com
Region> auto
```

### commands
```sh
rclone ls r2:travel-photos

# delete
rclone delete r2:travel-photos/16dbc959-25fc-4cdc-be53-2ed30b654e20/ --verbose

# empty
rclone delete r2:travel-photos
```

## object lifecycle rules
- https://github.com/cloudflare/terraform-provider-cloudflare/issues/5186
- https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/r2_bucket_lif
ecycle
- https://developers.cloudflare.com/r2/buckets/object-lifecycles/