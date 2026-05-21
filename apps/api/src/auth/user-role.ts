export enum UserRole {
  Admin = 'admin',
  Researcher = 'researcher',
  Viewer = 'viewer',
}

const userRoles = new Set<string>(Object.values(UserRole));

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && userRoles.has(value);
}
