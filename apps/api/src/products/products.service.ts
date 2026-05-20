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

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(dto: CreateProductDto) {
    const ingredients = (dto.ingredients ?? [])
      .map((ingredient) => this.toFormulaIngredientCreateInput(ingredient))
      .filter((ingredient) => ingredient !== undefined);

    return this.prisma.product.create({
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
