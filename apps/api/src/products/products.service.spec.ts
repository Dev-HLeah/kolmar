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

  it('recommends similar formulas using ingredient ratio overlap', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 'product-1',
      name: '기준 처방',
      formulas: [
        {
          id: 'formula-1',
          version: 'v1',
          ingredients: [
            { ratio: '40', ingredient: { name: '비타민 C' } },
            { ratio: '10', ingredient: { name: '아연' } },
          ],
        },
      ],
    });
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'product-2',
        name: '유사 처방',
        formulas: [
          {
            id: 'formula-2',
            version: 'v1',
            ingredients: [
              { ratio: '38', ingredient: { name: '비타민 C' } },
              { ratio: '12', ingredient: { name: '아연' } },
            ],
          },
        ],
      },
      {
        id: 'product-3',
        name: '비유사 처방',
        formulas: [
          {
            id: 'formula-3',
            version: 'v1',
            ingredients: [{ ratio: '5', ingredient: { name: '마그네슘' } }],
          },
        ],
      },
    ]);

    const result = await service.findSimilarFormulas('product-1');

    expect(result).toEqual([
      {
        productId: 'product-2',
        productName: '유사 처방',
        formulaId: 'formula-2',
        formulaVersion: 'v1',
        similarityScore: 98,
        matchedIngredientCount: 2,
        reason: '공통 원료 2개, 평균 비율 차이 2.0',
        matchedIngredients: [
          {
            ingredientName: '비타민 C',
            targetRatio: 40,
            candidateRatio: 38,
            ratioDifference: 2,
          },
          {
            ingredientName: '아연',
            targetRatio: 10,
            candidateRatio: 12,
            ratioDifference: 2,
          },
        ],
      },
    ]);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {
        id: {
          not: 'product-1',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: expect.any(Object),
      take: 20,
    });
  });
});
