import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { REQUIRED_ROLES_KEY } from './roles.decorator';
import { UserRole, isUserRole } from './user-role';

type RoleRequest = Request & {
  currentUser?: {
    id?: string;
    role: UserRole;
  };
};

function readHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveRole(value: string | string[] | undefined) {
  const role = readHeader(value);

  if (isUserRole(role)) {
    return role;
  }

  return UserRole.Viewer;
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles =
      this.reflector.getAllAndOverride<readonly UserRole[]>(
        REQUIRED_ROLES_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];
    const request = context.switchToHttp().getRequest<RoleRequest>();
    const role = resolveRole(request.headers['x-user-role']);

    request.currentUser = {
      id: readHeader(request.headers['x-user-id']),
      role,
    };

    if (requiredRoles.length === 0 || requiredRoles.includes(role)) {
      return true;
    }

    throw new ForbiddenException(
      `Required role: ${requiredRoles.join(' or ')}`,
    );
  }
}
