import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  const prisma: {
    auditLog: {
      findMany: jest.Mock;
    };
  } = {
    auditLog: {
      findMany: jest.fn(),
    },
  };

  let service: AuditLogService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuditLogService(prisma as unknown as PrismaService);
  });

  it('finds recent audit logs newest first', async () => {
    const logs = [
      {
        id: 'log-1',
        action: 'PRODUCT_CREATED',
        targetType: 'Product',
        targetId: 'product-1',
        summary: '제품/처방 생성: 위 건강 정제',
        metadata: { productName: '위 건강 정제' },
        createdAt: new Date('2026-05-21T00:00:00.000Z'),
      },
    ];
    prisma.auditLog.findMany.mockResolvedValue(logs);

    const result = await service.findRecentAuditLogs();

    expect(result).toBe(logs);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });
  });
});
