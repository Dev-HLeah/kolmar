import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { TryMarkType } from '@prisma/client';

describe('ProjectsService', () => {
  const prisma = {
    developmentProject: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    experimentGroup: {
      create: jest.fn(),
    },
    formulaTry: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
    tryTestResult: {
      create: jest.fn(),
    },
    tryMark: {
      create: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;

  let service: ProjectsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProjectsService(prisma);
  });

  it('creates a project that can start from an existing product formula', async () => {
    const createdProject = { id: 'project-1', name: '신물 억제 정제' };
    prisma.developmentProject.create.mockResolvedValue(createdProject);

    const result = await service.createProject({
      name: '신물 억제 정제',
      goal: '기존 제품 개선',
      sourceProductId: 'product-1',
      sourceFormulaId: 'formula-1',
    });

    expect(result).toBe(createdProject);
    expect(prisma.developmentProject.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: '신물 억제 정제',
          goal: '기존 제품 개선',
          sourceProductId: 'product-1',
          sourceFormulaId: 'formula-1',
        }),
        include: expect.any(Object),
      }),
    );
  });

  it('creates a formula try with only group id and try number required', async () => {
    const createdTry = { id: 'try-1', groupId: 'group-1', tryNumber: 1 };
    prisma.formulaTry.create.mockResolvedValue(createdTry);

    const result = await service.createFormulaTry('group-1', {
      tryNumber: 1,
    });

    expect(result).toBe(createdTry);
    expect(prisma.formulaTry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          groupId: 'group-1',
          tryNumber: 1,
          status: 'DRAFT',
        }),
        include: expect.any(Object),
      }),
    );
  });

  it('deletes one formula try when the user removes it from a group', async () => {
    const deletedTry = { id: 'try-1', groupId: 'group-1', tryNumber: 1 };
    prisma.formulaTry.delete.mockResolvedValue(deletedTry);

    const result = await service.deleteFormulaTry('try-1');

    expect(result).toBe(deletedTry);
    expect(prisma.formulaTry.delete).toHaveBeenCalledWith({
      where: {
        id: 'try-1',
      },
      include: expect.any(Object),
    });
  });

  it('creates a test result with only try id required', async () => {
    const createdResult = { id: 'result-1', tryId: 'try-1' };
    prisma.tryTestResult.create.mockResolvedValue(createdResult);

    const result = await service.createTryTestResult('try-1', {});

    expect(result).toBe(createdResult);
    expect(prisma.tryTestResult.create).toHaveBeenCalledWith({
      data: {
        tryId: 'try-1',
        testPurpose: undefined,
        measuredItem: undefined,
        measuredValue: undefined,
        unit: undefined,
        judgment: undefined,
        memo: undefined,
      },
    });
  });

  it('marks meaningful tries and can query marked tries by project', async () => {
    const createdMark = { id: 'mark-1', tryId: 'try-1' };
    prisma.tryMark.create.mockResolvedValue(createdMark);
    prisma.formulaTry.findMany.mockResolvedValue([]);

    const mark = await service.createTryMark('try-1', {
      type: TryMarkType.PROMISING,
      reason: '맛과 안정성 기준 통과',
    });
    const markedTries = await service.findMarkedTriesByProject('project-1');

    expect(mark).toBe(createdMark);
    expect(prisma.tryMark.create).toHaveBeenCalledWith({
      data: {
        tryId: 'try-1',
        type: TryMarkType.PROMISING,
        reason: '맛과 안정성 기준 통과',
      },
    });
    expect(markedTries).toEqual([]);
    expect(prisma.formulaTry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          group: {
            projectId: 'project-1',
          },
          marks: {
            some: {},
          },
        },
        include: expect.any(Object),
      }),
    );
  });
});
