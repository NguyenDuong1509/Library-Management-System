# Library API (Spring Boot)

REST API cho hệ thống quản lý thư viện (LMS): xác thực JWT, danh mục sách (slug URL), độc giả, lưu thông, đặt trước, phạt và báo cáo.

## Slug sách & JPA

- `GET /api/books/by-slug/{slug}` — chi tiết sách theo slug (404 nếu không tồn tại).
- `GET /api/books/{id}` — vẫn dùng UUID nội bộ.
- List reservation: `JOIN FETCH` member/book — không map lazy association trong controller.
- Seed UTF-8: xem `db/seed/README.md` (Windows `psql` + Docker exec).

## Yêu cầu

- Java 21
- Maven 3.9+
- Docker (PostgreSQL)

## Chạy nhanh

### Cách A — Không cần Docker (H2, dev nhanh)

Từ `apps/library-api`:

```powershell
cd D:\Ex\apps\library-api
mvn spring-boot:run "-Dspring-boot.run.arguments=--spring.profiles.active=local"
```

Dữ liệu trong RAM (mất khi tắt app). Vẫn có seed tài khoản demo.

### Cách B — PostgreSQL (giống production)

```powershell
# 1. Bật Docker Desktop, rồi:
cd D:\Ex\apps\library-api
docker compose up -d

# 2. Từ gốc repo D:\Ex (không dùng -pl khi đang ở trong library-api)
cd D:\Ex
mvn -pl modules/library-domain,apps/library-api -am install -DskipTests
mvn -pl apps/library-api spring-boot:run
```

Hoặc từ `apps\library-api`: chỉ `mvn spring-boot:run` (không có `-pl`).

> **Lỗi `Could not find artifact vn.lms:library-domain`?**  
> `library-api` phụ thuộc JAR `modules/library-domain`. Lệnh `mvn -pl apps/library-api spring-boot:run` **không** build module đó — phải `install` trước (lệnh trên) hoặc `mvn install -DskipTests` từ gốc repo.

> **Lỗi `Port 8080 was already in use`?**  
> API có thể **đã chạy** từ lần trước. Mở http://localhost:8080/actuator/health — nếu trả `UP` thì không cần chạy lại.  
> Muốn khởi động lại trên Windows (PowerShell):
> ```powershell
> netstat -ano | findstr :8080
> taskkill /PID <PID> /F
> ```
> Hoặc đổi cổng: `mvn -pl apps/library-api spring-boot:run -Dspring-boot.run.arguments=--server.port=8081`

- Health: http://localhost:8080/actuator/health
- Đăng nhập: `POST http://localhost:8080/api/auth/login`

### Tài khoản demo (seed lần đầu)

| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| admin@lms.vn | admin123 | ADMIN |
| thuthu@lms.vn | thuthu123 | LIBRARIAN |
| docgia@lms.vn | docgia123 | MEMBER |

Thêm độc giả mẫu: `pham.hoa@lms.vn`, `tran.duc@lms.vn` (mật khẩu `docgia123`) — xem `db/seed/README.md`.

### DB mẫu (sách, mượn/trả, phạt, đặt trước)

Flyway migration `V3__sample_data.sql` nạp tự động khi khởi động API lần đầu trên Postgres.

Reset toàn bộ và nạp lại:

```powershell
cd apps/library-api
docker compose exec -T postgres psql -U lms -d lms -f - < db/seed/reset_and_sample.sql
```

Chi tiết: `db/seed/README.md`.

Header sau khi login: `Authorization: Bearer <token>`

### API mới (admin + lookup + member)

| Endpoint | Mô tả |
|----------|--------|
| `GET/PUT /api/admin/config` | Cấu hình policy (ADMIN) |
| `GET /api/members/lookup?q=` | Tra cứu độc giả |
| `GET /api/book-copies/lookup?copyCode=` | Tra cứu bản sao |
| `GET /api/loans/active?memberId=` | Phiếu đang mượn |
| `GET /api/loans/me` | Phiếu mượn của member đăng nhập |
| `POST /api/members/register` | Đăng ký độc giả |
| `PATCH /api/members/{id}/status` | Khóa/mở thẻ |
| `GET /api/reports/dashboard-kpis` | KPI dashboard |
| `GET /api/fines/me` | Phạt của member |
| `GET /api/reservations/me` | Đặt trước của member |

### API catalog + đặt trước (feature completion)

| Endpoint | Mô tả |
|----------|--------|
| `GET /api/books?activeOnly=true` | Danh sách sách (lọc đầu sách đang hoạt động) |
| `GET /api/books/{id}` | Chi tiết sách + `availableCount`, `totalCopies` |
| `PUT /api/books/{id}` | Cập nhật metadata (ADMIN/LIBRARIAN) |
| `PATCH /api/books/{id}/active` | Bật/tắt đầu sách |
| `POST /api/books/{id}/copies` | Thêm bản sao AVAILABLE |
| `POST /api/reservations/me` | Member tự đặt trước `{ bookId }` |
| `PATCH /api/reservations/{id}/cancel` | Hủy đặt trước (PENDING/READY) |
| `POST /api/circulation/{loanId}/renew` | Gia hạn (ADMIN/LIBRARIAN/MEMBER — member chỉ own loan) |

List `/api/books` và reservation list trả thêm `availableCount`, `memberName`, `bookTitle` khi có.

### API portal nâng cao (lms-advanced-portal)

| Endpoint | Mô tả |
|----------|--------|
| `GET /api/search?q=&limit=` | Tìm nhanh (ADMIN/LIBRARIAN only; `q` ≥ 2 ký tự → 400 nếu ngắn hơn) |
| `GET /api/books?page=&size=&q=&category=` | Pagination opt-in + lọc ILIKE |
| `GET /api/members?page=&size=&q=` | Pagination opt-in + tìm kiếm |
| `GET /api/books/{id}/copies` | Danh sách bản sao |
| `PATCH /api/book-copies/{id}/status` | Đổi trạng thái bản sao (không khi ON_LOAN) |
| `GET /api/reservations` | PENDING + READY (thủ thư) |
| `POST /api/reservations/{id}/fulfill` | Nhận sách READY → tạo loan |
| `GET /api/notifications/me` | Thông báo member (paginated) |
| `GET /api/notifications` | Thông báo staff (paginated) |
| `GET /api/loans/me/history` | Lịch sử mượn RETURNED |
| `GET /api/reports/*/export` | CSV quá hạn / top sách / phạt |
| `GET/POST/PATCH /api/admin/users` | Quản lý user (ADMIN); POST → 201; `PATCH .../active` body `{ active }` |
| `GET /api/admin/audit-logs` | Nhật ký audit (ADMIN) |

Flyway `V4__audit_logs_and_user_active.sql`: bảng `audit_logs`, cột `users.active`. PUT `/api/admin/config` ghi audit `CONFIG_UPDATE`.

### Hardening (lms-portal-verify-fixes)

- Search: chỉ thủ thư/admin; validation `q` tối thiểu 2 ký tự.
- Admin users: `POST` 201, `PATCH /{id}/active`, alias `deactivate`.
- Config PUT → `audit_logs` action `CONFIG_UPDATE`.

## Cấu hình

Copy env trước khi chạy (bắt buộc cho profile mặc định Postgres):

```powershell
cd apps/library-api
copy .env.example .env
```

Spring Boot đọc `apps/library-api/.env` qua `spring.config.import`. **Không commit file `.env`.**

| Biến | Mô tả |
|------|--------|
| `SPRING_DATASOURCE_URL` | JDBC PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` / `PASSWORD` | User DB |
| `LIBRARY_JWT_SECRET` | Secret ký JWT (≥ 32 ký tự) |
| `SERVER_PORT` | Cổng API (mặc định 8080) |

Docker Compose dùng cùng file `.env` cho `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.

Profile `local` (H2): không cần Postgres, vẫn cần `LIBRARY_JWT_SECRET` trong `.env` nếu chạy profile mặc định trước đó; với `--spring.profiles.active=local` chỉ override datasource — nên vẫn copy `.env` để có JWT.

Chi tiết seed: `db/seed/README.md`.

## Kiểm thử

```bash
mvn clean test
```

## Cấu trúc

- `domain/entity`, `domain/enums` — JPA
- `service` — nghiệp vụ (gọi `modules/library-domain` cho policy thuần)
- `web/controller` — REST
- `db/migration` — Flyway
