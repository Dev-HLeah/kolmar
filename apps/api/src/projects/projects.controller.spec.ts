import { REQUIRED_ROLES_KEY } from '../auth/roles.decorator';
import { UserRole } from '../auth/user-role';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
  const projectsService: {
    createProductFromTry: jest.Mock;
    deleteTryMarks: jest.Mock;
    updateFormulaTry: jest.Mock;
  } = {
    createProductFromTry: jest.fn(),
    deleteTryMarks: jest.fn(),
    updateFormulaTry: jest.fn(),
  };

  let controller: ProjectsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ProjectsController(
      projectsService as unknown as ProjectsService,
    );
  });

  it('updates formula try draft details', async () => {
    const updatedTry = { id: 'try-1', title: '맛 개선 후보' };
    projectsService.updateFormulaTry.mockResolvedValue(updatedTry);

    await expect(
      controller.updateFormulaTry('try-1', {
        title: '맛 개선 후보',
        ingredients: [],
      }),
    ).resolves.toBe(updatedTry);

    expect(projectsService.updateFormulaTry).toHaveBeenCalledWith('try-1', {
      title: '맛 개선 후보',
      ingredients: [],
    });
  });

  it('requires admin or researcher role for formula try updates', () => {
    const handler = Object.getOwnPropertyDescriptor(
      ProjectsController.prototype,
      'updateFormulaTry',
    )?.value;

    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, handler)).toEqual([
      UserRole.Admin,
      UserRole.Researcher,
    ]);
  });

  it('deletes try marks through the service', async () => {
    const deletedMarks = { tryId: 'try-1', deletedCount: 1 };
    projectsService.deleteTryMarks.mockResolvedValue(deletedMarks);

    await expect(controller.deleteTryMarks('try-1')).resolves.toBe(
      deletedMarks,
    );

    expect(projectsService.deleteTryMarks).toHaveBeenCalledWith('try-1');
  });

  it('requires admin or researcher role for try mark deletion', () => {
    const handler = Object.getOwnPropertyDescriptor(
      ProjectsController.prototype,
      'deleteTryMarks',
    )?.value;

    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, handler)).toEqual([
      UserRole.Admin,
      UserRole.Researcher,
    ]);
  });

  it('creates a product from a formula try through the service', async () => {
    const createdProduct = { id: 'product-1', name: '신물 억제 제품' };
    const dto = { name: '신물 억제 제품', packagingName: 'Multi PTP' };
    projectsService.createProductFromTry.mockResolvedValue(createdProduct);

    await expect(controller.createProductFromTry('try-1', dto)).resolves.toBe(
      createdProduct,
    );

    expect(projectsService.createProductFromTry).toHaveBeenCalledWith(
      'try-1',
      dto,
    );
  });

  it('requires admin or researcher role for product creation from try', () => {
    const handler = Object.getOwnPropertyDescriptor(
      ProjectsController.prototype,
      'createProductFromTry',
    )?.value;

    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, handler)).toEqual([
      UserRole.Admin,
      UserRole.Researcher,
    ]);
  });
});
