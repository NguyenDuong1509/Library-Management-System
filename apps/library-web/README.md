# LMS Web — Giao diện quản lý thư viện

React + TypeScript + Vite + Tailwind CSS v4. Tiếng Việt. Design system: `openspec/docs/ui/design-system/`.

## Chạy local

```bash
cd apps/library-web
npm install
npm run dev
```

Mở http://localhost:5173

## Kết nối backend (Spring Boot)

1. Chạy API: `mvn -pl apps/library-api spring-boot:run` (từ gốc repo, sau `install` — xem `apps/library-api/README.md`)
2. Copy env: `cp .env.example .env` (hoặc dùng sẵn `.env`)
3. `VITE_API_URL=http://localhost:8080` — toàn bộ trang thủ thư/admin/độc giả gọi API thật qua `src/lib/api.ts`

Các trang chính: sách (CRUD nâng cao), độc giả, mượn/trả (gia hạn), đặt trước (tạo/hủy), phạt, báo cáo, cấu hình admin, cổng độc giả (tìm sách, đặt trước, gia hạn phiếu mượn).

## Mã nguồn (tên file tiếng Anh)

| Trang | File | Route (tiếng Việt) |
|-------|------|-------------------|
| Danh mục | `BooksPage.tsx` | `/thu-thu/sach` |
| Chi tiết sách | `BookDetailPage.tsx` | `/thu-thu/sach/:slug` |
| Độc giả | `MembersPage.tsx` | `/thu-thu/doc-gia` |
| Mượn/trả | `LoanReturnPage.tsx` | `/thu-thu/muon-tra` |
| Đặt trước (thủ thư) | `ReservationsDeskPage.tsx` | `/thu-thu/dat-truoc` |
| Layout thủ thư | `LibrarianLayout.tsx` | — |

URL slug sách (vd. `nha-gia-kim`) thay UUID trên thanh địa chỉ; bookmark UUID cũ vẫn mở được (fallback).

## Chức năng chính

- **Gia hạn**: `LoanReturnPage` / `MyLoansPage`
- **Catalog**: `BooksPage` — CRUD, slug, tồn kho
- **Tìm nhanh**: `LibrarianLayout` → link sách theo `slug`
- **Cổng độc giả**: `BookSearchPage`, `MemberReservationsPage`, …

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Thủ thư | thuthu@lms.vn | thuthu123 |
| Quản trị | admin@lms.vn | admin123 |
| Độc giả | docgia@lms.vn | docgia123 |

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run preview` — xem bản build

## Cấu trúc

- `src/pages/thu-thu/` — khu vực thủ thư / admin
- `src/pages/doc-gia/` — cổng độc giả
- `src/lib/api.ts` — client REST + JWT
- `src/lib/mock-data.ts` — dữ liệu mẫu cho các trang chưa nối API

## Liên kết

- Thiết kế UI: [openspec/docs/ui/design.md](../../openspec/docs/ui/design.md)
- OpenSpec: [openspec/changes/library-management-system/](../../openspec/changes/library-management-system/)
