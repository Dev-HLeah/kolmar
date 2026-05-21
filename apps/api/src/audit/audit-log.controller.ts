import { Controller, Get } from '@nestjs/common';
import { RequireRoles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user-role';
import { AuditLogService } from './audit-log.service';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @RequireRoles(UserRole.Admin)
  findRecentAuditLogs() {
    return this.auditLogService.findRecentAuditLogs();
  }
}
