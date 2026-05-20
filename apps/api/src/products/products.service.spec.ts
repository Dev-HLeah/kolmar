import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  const prisma = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;

  let service: ProductsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductsService(prisma);
  });

  it('creates a product with optional formula ingredient values', async () => {
    const createdProduct = { id: 'product-1', name: '위 건강 정제' };
    prisma.product.create.mockResolvedValue(createdProduct);

    const result = await service.createProduct({
      name: '위 건강 정제',
      category: '건강기능식품',
      function: '신물 억제',
      target: '성인',
      dosageFormName: '츄어블 정제',
      packagingName: 'Multi PTP',
      ingredients: [
        { ingredientName: '비타민 C', amount: '500', unit: 'mg' },
        { ingredientName: '아연' },
      ],
    });

    expect(result).toBe(createdProduct);
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: '위 건강 정제',
          function: '신물 억제',
          formulas: {
            create: expect.objectContaining({
              version: 'v1',
              ingredients: {
                create: [
                  expect.objectContaining({
                    amount: '500',
                    unit: 'mg',
                    ingredient: {
                      connectOrCreate: {
                        where: { name: '비타민 C' },
                        create: { name: '비타민 C' },
                      },
                    },
                  }),
                  expect.objectContaining({
                    ingredient: {
                      connectOrCreate: {
                        where: { name: '아연' },
                        create: { name: '아연' },
                      },
                    },
                  }),
                ],
              },
            }),
          },
        }),
        include: expect.any(Object),
      }),
    );
  });
});
