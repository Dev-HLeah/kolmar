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

  it('returns formulation guidance for Kolmar specialized solid forms', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 'product-1',
      name: '츄어블 기준 처방',
      dosageForm: {
        name: '츄어블 정제',
        isKolmarSpecial: true,
      },
      packaging: {
        name: 'Multi PTP',
        isKolmarSpecial: true,
      },
      formulas: [
        {
          ingredients: [
            {
              role: '산미',
              ingredient: {
                name: '비타민 C',
              },
            },
          ],
        },
      ],
    });

    const result = await service.findFormulationGuidance('product-1');

    expect(result).toEqual({
      productId: 'product-1',
      dosageFormName: '츄어블 정제',
      packagingName: 'Multi PTP',
      kolmarSpecial: true,
      summary:
        '츄어블 정제 기반으로 콜마 특화 제형과 초기 안정성 신호를 검토합니다.',
      signals: [
        {
          type: 'kolmar-dosage-form',
          label: '콜마 특화 제형',
          severity: 'positive',
          message: '츄어블 정제는 콜마 특화 제형 후보입니다.',
          checkItems: ['맛 마스킹', '정제 경도', '붕해/용해'],
        },
        {
          type: 'kolmar-packaging',
          label: '콜마 특화 포장',
          severity: 'positive',
          message: 'Multi PTP 포장 적용성을 함께 검토할 수 있습니다.',
          checkItems: ['습기 차단', '개별 포장 안정성'],
        },
        {
          type: 'taste-masking',
          label: '맛 마스킹 필요',
          severity: 'caution',
          message:
            '산미 또는 관능 이슈가 있는 원료가 포함되어 츄어블 정제에서 맛 마스킹 확인이 필요합니다.',
          checkItems: ['산미', '쓴맛', '감미료 조화'],
        },
      ],
    });
  });
});
