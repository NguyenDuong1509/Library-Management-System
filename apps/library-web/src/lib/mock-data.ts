import type { CopyStatus } from '../types'

export const DEMO_ACCOUNTS = [
  {
    email: 'thuthu@lms.vn',
    password: 'thuthu123',
    user: {
      id: 'u1',
      email: 'thuthu@lms.vn',
      name: 'Nguyễn Thị Lan',
      role: 'LIBRARIAN' as const,
    },
  },
  {
    email: 'admin@lms.vn',
    password: 'admin123',
    user: {
      id: 'u2',
      email: 'admin@lms.vn',
      name: 'Trần Văn Admin',
      role: 'ADMIN' as const,
    },
  },
  {
    email: 'docgia@lms.vn',
    password: 'docgia123',
    user: {
      id: 'u3',
      email: 'docgia@lms.vn',
      name: 'Lê Minh Anh',
      role: 'MEMBER' as const,
    },
  },
]

export const KPI_STATS = {
  muonHomNay: 24,
  quaHan: 12,
  datTruocCho: 8,
  phatChuaThu: 1_250_000,
}

export const BOOKS = [
  {
    id: 'b1',
    title: 'Clean Code',
    isbn: '978-0132350884',
    authors: 'Robert C. Martin',
    category: 'Công nghệ',
    available: 2,
    total: 5,
  },
  {
    id: 'b2',
    title: 'Sapiens',
    isbn: '978-0062316097',
    authors: 'Yuval Noah Harari',
    category: 'Khoa học',
    available: 0,
    total: 3,
  },
  {
    id: 'b3',
    title: 'Đắc Nhân Tâm',
    isbn: '978-6041234567',
    authors: 'Dale Carnegie',
    category: 'Kỹ năng',
    available: 4,
    total: 6,
  },
]

export const MEMBERS = [
  {
    id: 'm1',
    cardId: 'TV-2024-001',
    name: 'Lê Minh Anh',
    email: 'docgia@lms.vn',
    status: 'ACTIVE' as const,
  },
  {
    id: 'm2',
    cardId: 'TV-2024-002',
    name: 'Phạm Hoàng Nam',
    email: 'nam@example.vn',
    status: 'SUSPENDED' as const,
  },
]

export const LOANS = [
  {
    id: 'l1',
    memberName: 'Lê Minh Anh',
    bookTitle: 'Clean Code',
    copyCode: 'CC-001',
    dueDate: '2026-06-05',
    status: 'ACTIVE' as const,
  },
  {
    id: 'l2',
    memberName: 'Phạm Hoàng Nam',
    bookTitle: 'Sapiens',
    copyCode: 'SP-002',
    dueDate: '2026-05-20',
    status: 'OVERDUE' as const,
  },
]

export const COPY_STATUS_LABEL: Record<CopyStatus, string> = {
  AVAILABLE: 'Còn sẵn',
  ON_LOAN: 'Đang mượn',
  RESERVED: 'Đã đặt trước',
  LOST: 'Mất',
  MAINTENANCE: 'Bảo trì',
}
