import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFormulaIngredientDto,
  CreateProductDto,
} from './dto/create-product.dto';

const productInclude = {
  dosageForm: true,
  packaging: true,
  formulas: {
    include: {
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
  },
};

const kolmarDosageForms = new Set([
  '츄어블 정제',
  '이중 제형 정제',
  '미니/멀티 정제',
  '쿨멜팅 분말',
  '크런치 분말',
  '팝핑 분말',
]);

const kolmarPackagingOptions = new Set(['스틱 포장', 'Multi PTP']);

type FormulaIngredientForSimilarity = {
  ratio?: unknown;
  role?: string | null;
  ingredient?: {
    name?: string | null;
  } | null;
};

type FormulaForSimilarity = {
  id?: string;
  version?: string;
  ingredients?: FormulaIngredientForSimilarity[];
};

type ProductForSimilarity = {
  id: string;
  name: string;
  dosageForm?: {
    name?: string | null;
    isKolmarSpecial?: boolean | null;
  } | null;
  packaging?: {
    name?: string | null;
    isKolmarSpecial?: boolean | null;
  } | null;
  formulas?: FormulaForSimilarity[];
};

type FormulaProfileItem = {
  ingredientName: string;
  ratio: number;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(dto: CreateProductDto) {
    const ingredients = (dto.ingredients ?? [])
      .map((ingredient) => this.toFormulaIngredientCreateInput(ingredient))
      .filter((ingredient) => ingredient !== undefined);

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        category: cleanString(dto.category),
        target: cleanString(dto.target),
        function: cleanString(dto.function),
        dosageForm: this.toDosageFormInput(dto.dosageFormName),
        packaging: this.toPackagingInput(dto.packagingName),
        formulas: {
          create: {
            version: cleanString(dto.formulaVersion) ?? 'v1',
            note: cleanString(dto.formulaNote),
            ...(ingredients.length > 0
              ? {
                  ingredients: {
                    create: ingredients,
                  },
                }
              : {}),
          },
        },
      },
      include: productInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PRODUCT_CREATED',
        targetType: 'Product',
        targetId: product.id,
        summary: `제품/처방 생성: ${dto.name}`,
        metadata: {
          productName: dto.name,
          ingredientCount: ingredients.length,
          dosageFormName: cleanString(dto.dosageFormName) ?? null,
          packagingName: cleanString(dto.packagingName) ?? null,
        },
      },
    });

    return product;
  }

  findProducts() {
    return this.prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: productInclude,
    });
  }

  async findProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return product;
  }

  async findSimilarFormulas(id: string) {
    const targetProduct = (await this.findProductById(
      id,
    )) as unknown as ProductForSimilarity;
    const candidateProducts = (await this.prisma.product.findMany({
      where: {
        id: {
          not: id,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: productInclude,
      take: 20,
    })) as unknown as ProductForSimilarity[];

    return toSimilarFormulaRecommendations(targetProduct, candidateProducts);
  }

  async findFormulationGuidance(id: string) {
    const product = (await this.findProductById(
      id,
    )) as unknown as ProductForSimilarity;

    return toFormulationGuidance(product);
  }

  private toFormulaIngredientCreateInput(
    ingredient: CreateFormulaIngredientDto,
  ) {
    const ingredientName = cleanString(ingredient.ingredientName);

    if (!ingredientName) {
      return undefined;
    }

    return {
      amount: cleanDecimal(ingredient.amount),
      unit: cleanString(ingredient.unit),
      ratio: cleanDecimal(ingredient.ratio),
      role: cleanString(ingredient.role),
      ingredient: {
        connectOrCreate: {
          where: { name: ingredientName },
          create: { name: ingredientName },
        },
      },
    };
  }

  private toDosageFormInput(name?: string | null) {
    const normalizedName = cleanString(name);

    if (!normalizedName) {
      return undefined;
    }

    return {
      connectOrCreate: {
        where: { name: normalizedName },
        create: {
          name: normalizedName,
          isKolmarSpecial: kolmarDosageForms.has(normalizedName),
        },
      },
    };
  }

  private toPackagingInput(name?: string | null) {
    const normalizedName = cleanString(name);

    if (!normalizedName) {
      return undefined;
    }

    return {
      connectOrCreate: {
        where: { name: normalizedName },
        create: {
          name: normalizedName,
          isKolmarSpecial: kolmarPackagingOptions.has(normalizedName),
        },
      },
    };
  }
}

function cleanString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function cleanDecimal(value?: number | string | null) {
  if (value === null || value === undefined) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : undefined;
}

function toSimilarFormulaRecommendations(
  targetProduct: ProductForSimilarity,
  candidateProducts: ProductForSimilarity[],
) {
  const targetFormula = targetProduct.formulas?.[0];
  const targetProfile = toFormulaProfile(targetFormula);

  if (targetProfile.length === 0) {
    return [];
  }

  const targetRatioByIngredient = new Map(
    targetProfile.map((item) => [item.ingredientName, item.ratio]),
  );

  return candidateProducts
    .map((candidateProduct) => {
      const candidateFormula = candidateProduct.formulas?.[0];
      const candidateProfile = toFormulaProfile(candidateFormula);
      const matchedIngredients = candidateProfile
        .filter((item) => targetRatioByIngredient.has(item.ingredientName))
        .map((item) => {
          const targetRatio = targetRatioByIngredient.get(
            item.ingredientName,
          ) as number;

          return {
            ingredientName: item.ingredientName,
            targetRatio,
            candidateRatio: item.ratio,
            ratioDifference: roundOne(Math.abs(targetRatio - item.ratio)),
          };
        });

      if (matchedIngredients.length === 0 || !candidateFormula?.id) {
        return undefined;
      }

      const averageRatioDifference = roundOne(
        matchedIngredients.reduce(
          (total, ingredient) => total + ingredient.ratioDifference,
          0,
        ) / matchedIngredients.length,
      );
      const coverageScore =
        (matchedIngredients.length / targetProfile.length) * 100;
      const similarityScore = Math.max(
        0,
        Math.round(coverageScore - averageRatioDifference),
      );

      if (similarityScore === 0) {
        return undefined;
      }

      return {
        productId: candidateProduct.id,
        productName: candidateProduct.name,
        formulaId: candidateFormula.id,
        formulaVersion: candidateFormula.version ?? 'v1',
        similarityScore,
        matchedIngredientCount: matchedIngredients.length,
        reason: `공통 원료 ${matchedIngredients.length}개, 평균 비율 차이 ${averageRatioDifference.toFixed(
          1,
        )}`,
        matchedIngredients,
      };
    })
    .filter((recommendation) => recommendation !== undefined)
    .sort((left, right) => right.similarityScore - left.similarityScore)
    .slice(0, 5);
}

function toFormulaProfile(
  formula?: FormulaForSimilarity,
): FormulaProfileItem[] {
  return (formula?.ingredients ?? [])
    .map((ingredient) => {
      const ingredientName = ingredient.ingredient?.name?.trim();
      const ratio = toNumber(ingredient.ratio);

      if (!ingredientName || ratio === undefined) {
        return undefined;
      }

      return {
        ingredientName,
        ratio,
      };
    })
    .filter((item) => item !== undefined);
}

function toNumber(value: unknown) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }

  if (hasDecimalToNumber(value)) {
    const parsedValue = value.toNumber();
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }

  return undefined;
}

function hasDecimalToNumber(
  value: unknown,
): value is { toNumber: () => number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof value.toNumber === 'function'
  );
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function toFormulationGuidance(product: ProductForSimilarity) {
  const dosageFormName = product.dosageForm?.name?.trim() ?? '제형 미입력';
  const packagingName = product.packaging?.name?.trim() ?? '포장 미입력';
  const isKolmarDosageForm =
    Boolean(product.dosageForm?.isKolmarSpecial) ||
    kolmarDosageForms.has(dosageFormName);
  const isKolmarPackaging =
    Boolean(product.packaging?.isKolmarSpecial) ||
    kolmarPackagingOptions.has(packagingName);
  const signals = [
    ...(isKolmarDosageForm
      ? [
          {
            type: 'kolmar-dosage-form',
            label: '콜마 특화 제형',
            severity: 'positive',
            message: `${dosageFormName}는 콜마 특화 제형 후보입니다.`,
            checkItems: toDosageFormCheckItems(dosageFormName),
          },
        ]
      : []),
    ...(isKolmarPackaging
      ? [
          {
            type: 'kolmar-packaging',
            label: '콜마 특화 포장',
            severity: 'positive',
            message: `${packagingName} 포장 적용성을 함께 검토할 수 있습니다.`,
            checkItems: ['습기 차단', '개별 포장 안정성'],
          },
        ]
      : []),
    ...(hasTasteMaskingRisk(product)
      ? [
          {
            type: 'taste-masking',
            label: '맛 마스킹 필요',
            severity: 'caution',
            message: `산미 또는 관능 이슈가 있는 원료가 포함되어 ${dosageFormName}에서 맛 마스킹 확인이 필요합니다.`,
            checkItems: ['산미', '쓴맛', '감미료 조화'],
          },
        ]
      : []),
  ];

  return {
    productId: product.id,
    dosageFormName,
    packagingName,
    kolmarSpecial: isKolmarDosageForm || isKolmarPackaging,
    summary: `${dosageFormName} 기반으로 콜마 특화 제형과 초기 안정성 신호를 검토합니다.`,
    signals:
      signals.length > 0
        ? signals
        : [
            {
              type: 'initial-stability',
              label: '초기 안정성 검토',
              severity: 'info',
              message:
                '공정 변경 전 흐름성, 흡습성, 붕해/용해, 포장 적합성을 확인합니다.',
              checkItems: ['흐름성', '흡습성', '붕해/용해'],
            },
          ],
  };
}

function toDosageFormCheckItems(dosageFormName: string) {
  if (dosageFormName.includes('츄어블')) {
    return ['맛 마스킹', '정제 경도', '붕해/용해'];
  }

  if (dosageFormName.includes('분말')) {
    return ['흡습성', '흐름성', '맛 마스킹'];
  }

  return ['제형 안정성', '공정 조건', '품질 기준'];
}

function hasTasteMaskingRisk(product: ProductForSimilarity) {
  const tasteRiskTerms = ['산미', '쓴맛', '맛', '관능', '감미', '향'];

  return (product.formulas?.[0]?.ingredients ?? []).some((ingredient) => {
    const searchableText = [ingredient.role, ingredient.ingredient?.name]
      .filter((value) => value)
      .join(' ');

    return tasteRiskTerms.some((term) => searchableText.includes(term));
  });
}
