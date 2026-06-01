export type UserRole = 'ADMIN' | 'LIBRARIAN' | 'MEMBER'

export type CopyStatus =
  | 'AVAILABLE'
  | 'ON_LOAN'
  | 'RESERVED'
  | 'LOST'
  | 'MAINTENANCE'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface AuthSession {
  token: string
  user: User
}
