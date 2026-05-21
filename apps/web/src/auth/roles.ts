export type UserRole = 'admin' | 'researcher' | 'viewer'

export const DEFAULT_USER_ROLE: UserRole = 'researcher'

export const USER_ROLES: UserRole[] = ['admin', 'researcher', 'viewer']

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: '관리자',
  researcher: '연구원',
  viewer: '조회자',
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole)
}
