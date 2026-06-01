# Dữ liệu mẫu LMS

## Tài khoản đăng nhập


| Email                                     | Mật khẩu  | Vai trò   | Mã thẻ                  |
| ----------------------------------------- | --------- | --------- | ----------------------- |
| [admin@lms.vn](mailto:admin@lms.vn)       | admin123  | ADMIN     | —                       |
| [thuthu@lms.vn](mailto:thuthu@lms.vn)     | thuthu123 | LIBRARIAN | —                       |
| [docgia@lms.vn](mailto:docgia@lms.vn)     | docgia123 | MEMBER    | TV-2024-001             |
| [pham.hoa@lms.vn](mailto:pham.hoa@lms.vn) | docgia123 | MEMBER    | TV-2024-002             |
| [tran.duc@lms.vn](mailto:tran.duc@lms.vn) | docgia123 | MEMBER    | TV-2024-003 (SUSPENDED) |


## Nội dung mẫu


| Bảng           | Số lượng | Ghi chú                           |
| -------------- | -------- | --------------------------------- |
| books          | 6        | Có `slug` URL (vd. `nha-gia-kim`) |
| book_copies    | 10       | Mã: NGK-001, SAP-001, CLN-001, …  |
| loans ACTIVE   | 4        | 2 quá hạn, 1 checkout hôm nay     |
| loans RETURNED | 3        | Lịch sử cho báo cáo top-books     |
| reservations   | 3        | PENDING + READY                   |
| fines          | 3        | 50.000₫ chưa thu, 5.000₫ đã thu   |


### Docker (khuyến nghị)

Postgres trong container dùng UTF-8; client `psql` trong container khớp server:

```powershell
cd apps/library-api
docker compose exec -T postgres psql -U lms -d lms -f - < db/seed/reset_and_sample.sql
```

### Windows — `psql` trên host

1. Code page UTF-8 (một lần mỗi terminal):

```powershell
chcp 65001
```

1. Biến môi trường cho phiên hiện tại:

```powershell
$env:PGCLIENTENCODING = "UTF8"
```

1. Chạy seed:

```powershell
cd apps/library-api
psql -h localhost -U lms -d lms -f db/seed/reset_and_sample.sql
```

### DB mới (Flyway)

Khởi động Postgres rồi chạy API — migration `V3__sample_data.sql` và `V5__book_slug.sql` nạp schema + dữ liệu:

```powershell
cd apps/library-api
docker compose up -d
mvn -pl apps/library-api spring-boot:run
```



