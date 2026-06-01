-- Dữ liệu mẫu LMS — idempotent, tương thích DB mới hoặc đã có user demo.
-- Mật khẩu: admin123 / thuthu123 / docgia123

-- ── Users ──────────────────────────────────────────────────────────────────
INSERT INTO users (id, email, password_hash, name, role) VALUES
  ('11111111-1111-1111-1111-111111111001', 'admin@lms.vn',
   '$2a$10$3ym80MTEhCMFCphbgF9AR.6ihUC70JFo9qLUZLElJbLZFmrbc64pa',
   'Trần Văn Admin', 'ADMIN'),
  ('11111111-1111-1111-1111-111111111002', 'thuthu@lms.vn',
   '$2a$10$q5QmH6AKoJ0HBC7aguzt2uqmd654wZrozfQSlDWrgt1ybw8nGfPWO',
   'Nguyễn Thị Lan', 'LIBRARIAN'),
  ('11111111-1111-1111-1111-111111111003', 'docgia@lms.vn',
   '$2a$10$LZWw/RH/vCx1vXVcuTu6vuiigUSKUbQpNim.AsCjr5Kllr78UwPEm',
   'Lê Minh Anh', 'MEMBER'),
  ('11111111-1111-1111-1111-111111111004', 'pham.hoa@lms.vn',
   '$2a$10$LZWw/RH/vCx1vXVcuTu6vuiigUSKUbQpNim.AsCjr5Kllr78UwPEm',
   'Phạm Thu Hòa', 'MEMBER'),
  ('11111111-1111-1111-1111-111111111005', 'tran.duc@lms.vn',
   '$2a$10$LZWw/RH/vCx1vXVcuTu6vuiigUSKUbQpNim.AsCjr5Kllr78UwPEm',
   'Trần Văn Đức', 'MEMBER')
ON CONFLICT (email) DO NOTHING;

-- ── Members (liên kết user theo email) ───────────────────────────────────────
INSERT INTO members (id, user_id, library_card_id, phone, status)
SELECT '22222222-2222-2222-2222-222222222001', u.id, 'TV-2024-001', '0901234567', 'ACTIVE'
FROM users u WHERE u.email = 'docgia@lms.vn'
ON CONFLICT (library_card_id) DO NOTHING;

INSERT INTO members (id, user_id, library_card_id, phone, status)
SELECT '22222222-2222-2222-2222-222222222002', u.id, 'TV-2024-002', '0912345678', 'ACTIVE'
FROM users u WHERE u.email = 'pham.hoa@lms.vn'
ON CONFLICT (library_card_id) DO NOTHING;

INSERT INTO members (id, user_id, library_card_id, phone, status)
SELECT '22222222-2222-2222-2222-222222222003', u.id, 'TV-2024-003', '0923456789', 'SUSPENDED'
FROM users u WHERE u.email = 'tran.duc@lms.vn'
ON CONFLICT (library_card_id) DO NOTHING;

-- ── Books ────────────────────────────────────────────────────────────────────
INSERT INTO books (id, title, isbn, authors, category) VALUES
  ('33333333-3333-3333-3333-333333333001', 'Nhà Giả Kim',
   '978-604-1-00001-1', 'Paulo Coelho', 'Văn học'),
  ('33333333-3333-3333-3333-333333333002', 'Sapiens: Lược sử loài người',
   '978-604-1-00002-8', 'Yuval Noah Harari', 'Khoa học'),
  ('33333333-3333-3333-3333-333333333003', 'Clean Code',
   '978-604-1-00003-5', 'Robert C. Martin', 'Công nghệ'),
  ('33333333-3333-3333-3333-333333333004', 'Đắc Nhân Tâm',
   '978-604-1-00004-2', 'Dale Carnegie', 'Kỹ năng sống'),
  ('33333333-3333-3333-3333-333333333005', 'Harry Potter và Hòn đá Phù thủy',
   '978-604-1-00005-9', 'J.K. Rowling', 'Thiếu nhi'),
  ('33333333-3333-3333-3333-333333333006', 'Truyện Kiều',
   '978-604-1-00006-6', 'Nguyễn Du', 'Văn học cổ điển')
ON CONFLICT (id) DO NOTHING;

-- ── Book copies ──────────────────────────────────────────────────────────────
INSERT INTO book_copies (id, book_id, copy_code, status) VALUES
  ('44444444-4444-4444-4444-444444444001', '33333333-3333-3333-3333-333333333001', 'NGK-001', 'ON_LOAN'),
  ('44444444-4444-4444-4444-444444444002', '33333333-3333-3333-3333-333333333001', 'NGK-002', 'AVAILABLE'),
  ('44444444-4444-4444-4444-444444444003', '33333333-3333-3333-3333-333333333002', 'SAP-001', 'ON_LOAN'),
  ('44444444-4444-4444-4444-444444444004', '33333333-3333-3333-3333-333333333002', 'SAP-002', 'AVAILABLE'),
  ('44444444-4444-4444-4444-444444444005', '33333333-3333-3333-3333-333333333003', 'CLN-001', 'ON_LOAN'),
  ('44444444-4444-4444-4444-444444444006', '33333333-3333-3333-3333-333333333003', 'CLN-002', 'AVAILABLE'),
  ('44444444-4444-4444-4444-444444444007', '33333333-3333-3333-3333-333333333004', 'DNT-001', 'AVAILABLE'),
  ('44444444-4444-4444-4444-444444444008', '33333333-3333-3333-3333-333333333005', 'HP-001', 'ON_LOAN'),
  ('44444444-4444-4444-4444-444444444009', '33333333-3333-3333-3333-333333333005', 'HP-002', 'RESERVED'),
  ('44444444-4444-4444-4444-444444444010', '33333333-3333-3333-3333-333333333006', 'TK-001', 'AVAILABLE')
ON CONFLICT (copy_code) DO NOTHING;

-- ── Loans ────────────────────────────────────────────────────────────────────
INSERT INTO loans (id, member_id, book_copy_id, status, checkout_at, due_at, returned_at, renewal_count)
SELECT '55555555-5555-5555-5555-555555555001', m.id, c.id, 'ACTIVE',
       NOW() - INTERVAL '20 days', NOW() - INTERVAL '6 days', NULL, 0
FROM members m, book_copies c
WHERE m.library_card_id = 'TV-2024-001' AND c.copy_code = 'NGK-001'
ON CONFLICT (id) DO NOTHING;

INSERT INTO loans (id, member_id, book_copy_id, status, checkout_at, due_at, returned_at, renewal_count)
SELECT '55555555-5555-5555-5555-555555555002', m.id, c.id, 'ACTIVE',
       NOW() - INTERVAL '18 days', NOW() - INTERVAL '4 days', NULL, 1
FROM members m, book_copies c
WHERE m.library_card_id = 'TV-2024-002' AND c.copy_code = 'SAP-001'
ON CONFLICT (id) DO NOTHING;

INSERT INTO loans (id, member_id, book_copy_id, status, checkout_at, due_at, returned_at, renewal_count)
SELECT '55555555-5555-5555-5555-555555555003', m.id, c.id, 'ACTIVE',
       NOW() - INTERVAL '2 hours', NOW() + INTERVAL '14 days', NULL, 0
FROM members m, book_copies c
WHERE m.library_card_id = 'TV-2024-001' AND c.copy_code = 'CLN-001'
ON CONFLICT (id) DO NOTHING;

INSERT INTO loans (id, member_id, book_copy_id, status, checkout_at, due_at, returned_at, renewal_count)
SELECT '55555555-5555-5555-5555-555555555004', m.id, c.id, 'ACTIVE',
       NOW() - INTERVAL '5 days', NOW() + INTERVAL '9 days', NULL, 0
FROM members m, book_copies c
WHERE m.library_card_id = 'TV-2024-002' AND c.copy_code = 'HP-001'
ON CONFLICT (id) DO NOTHING;

INSERT INTO loans (id, member_id, book_copy_id, status, checkout_at, due_at, returned_at, renewal_count)
SELECT '55555555-5555-5555-5555-555555555005', m.id, c.id, 'RETURNED',
       NOW() - INTERVAL '60 days', NOW() - INTERVAL '46 days', NOW() - INTERVAL '45 days', 0
FROM members m, book_copies c
WHERE m.library_card_id = 'TV-2024-001' AND c.copy_code = 'NGK-002'
ON CONFLICT (id) DO NOTHING;

INSERT INTO loans (id, member_id, book_copy_id, status, checkout_at, due_at, returned_at, renewal_count)
SELECT '55555555-5555-5555-5555-555555555006', m.id, c.id, 'RETURNED',
       NOW() - INTERVAL '90 days', NOW() - INTERVAL '76 days', NOW() - INTERVAL '75 days', 0
FROM members m, book_copies c
WHERE m.library_card_id = 'TV-2024-001' AND c.copy_code = 'SAP-002'
ON CONFLICT (id) DO NOTHING;

INSERT INTO loans (id, member_id, book_copy_id, status, checkout_at, due_at, returned_at, renewal_count)
SELECT '55555555-5555-5555-5555-555555555007', m.id, c.id, 'RETURNED',
       NOW() - INTERVAL '30 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '15 days', 0
FROM members m, book_copies c
WHERE m.library_card_id = 'TV-2024-002' AND c.copy_code = 'CLN-002'
ON CONFLICT (id) DO NOTHING;

-- ── Reservations ─────────────────────────────────────────────────────────────
INSERT INTO reservations (id, member_id, book_id, status, queue_position)
SELECT '66666666-6666-6666-6666-666666666001', m.id, b.id, 'PENDING', 1
FROM members m, books b
WHERE m.library_card_id = 'TV-2024-001' AND b.title LIKE 'Harry Potter%'
ON CONFLICT (id) DO NOTHING;

INSERT INTO reservations (id, member_id, book_id, status, queue_position)
SELECT '66666666-6666-6666-6666-666666666002', m.id, b.id, 'PENDING', 1
FROM members m, books b
WHERE m.library_card_id = 'TV-2024-002' AND b.title = 'Đắc Nhân Tâm'
ON CONFLICT (id) DO NOTHING;

INSERT INTO reservations (id, member_id, book_id, status, queue_position)
SELECT '66666666-6666-6666-6666-666666666003', m.id, b.id, 'READY', 1
FROM members m, books b
WHERE m.library_card_id = 'TV-2024-001' AND b.title = 'Truyện Kiều'
ON CONFLICT (id) DO NOTHING;

-- ── Fines ────────────────────────────────────────────────────────────────────
INSERT INTO fines (id, loan_id, amount, status, paid_at)
SELECT '77777777-7777-7777-7777-777777777001', l.id, 30000, 'UNPAID', NULL
FROM loans l WHERE l.id = '55555555-5555-5555-5555-555555555001'
ON CONFLICT (id) DO NOTHING;

INSERT INTO fines (id, loan_id, amount, status, paid_at)
SELECT '77777777-7777-7777-7777-777777777002', l.id, 20000, 'UNPAID', NULL
FROM loans l WHERE l.id = '55555555-5555-5555-5555-555555555002'
ON CONFLICT (id) DO NOTHING;

INSERT INTO fines (id, loan_id, amount, status, paid_at)
SELECT '77777777-7777-7777-7777-777777777003', l.id, 5000, 'PAID', NOW() - INTERVAL '44 days'
FROM loans l WHERE l.id = '55555555-5555-5555-5555-555555555005'
ON CONFLICT (id) DO NOTHING;
