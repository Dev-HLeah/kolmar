import { REQUIRED_ROLES_KEY } from '../auth/roles.decorator';
import { UserRole } from '../auth/user-role';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';

describe('AuditLogController', () => {
  const auditLogService: {
    findRecentAuditLogs: jest.Mock;
  } = {
    findRecentAuditLogs: jest.fn(),
  };

  let controller: AuditLogController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuditLogController(
      auditLogService as unknown as AuditLogService,
    );
  });

  it('returns recent audit logs', async () => {
    const logs = [{ id: 'log-1', action: 'PRODUCT_CREATED' }];
    auditLogService.findRecentAuditLogs.mockResolvedValue(logs);

    await expect(controller.findRecentAuditLogs()).resolves.toBe(logs);
  });

  it('requires admin role for audit log access', () => {
    const handler = Object.getOwnPropertyDescriptor(
      AuditLogController.prototype,
      'findRecentAuditLogs',
    )?.value;

    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, handler)).toEqual([
      UserRole.Admin,
    ]);
  });
});
