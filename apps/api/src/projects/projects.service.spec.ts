import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

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
});
