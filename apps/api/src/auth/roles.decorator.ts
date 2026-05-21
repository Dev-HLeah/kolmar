import { SetMetadata } from '@nestjs/common';
import { UserRole } from './user-role';

export const REQUIRED_ROLES_KEY = 'requiredRoles';

export const RequireRoles = (...roles: readonly UserRole[]) =>
  SetMetadata(REQUIRED_ROLES_KEY, roles);
