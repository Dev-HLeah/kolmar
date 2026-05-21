import { Injectable, NotFoundException } from '@nestjs/common';
import { TryStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExperimentGroupDto } from './dto/create-experiment-group.dto';
import {
  CreateFormulaTryDto,
  CreateTryIngredientDto,
} from './dto/create-formula-try.dto';
import { CreateProductFromTryDto } from './dto/create-product-from-try.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTestResultDto } from './dto/create-test-result.dto';
import { CreateTryMarkDto } from './dto/create-try-mark.dto';
import { UpdateFormulaTryDto } from './dto/update-formula-try.dto';

const formulaTryInclude = {
  ingredients: {
    include: {
      ingredient: true,
    },
  },
  testResults: {
    orderBy: {
      createdAt: 'desc' as const,
    },
  },
  marks: true,
};

const markedFormulaTryInclude = {
  ...formulaTryInclude,
  group: true,
};

const projectInclude = {
  groups: {
    include: {
      tries: {
        include: formulaTryInclude,
      },
    },
  },
};

const formulaTryProductSourceInclude = {
  ingredients: {
    include: {
      ingredient: true,
    },
  },
  group: {
    include: {
      project: true,
    },
  },
};

const productFromTryInclude = {
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

type SourceTryIngredient = {
  amount?: unknown;
  unit?: string | null;
  ratio?: unknown;
  note?: string | null;
  ingredient?: {
    name?: string | null;
  } | null;
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(dto: CreateProjectDto) {
    const project = await this.prisma.developmentProject.create({
      data: {
        name: dto.name,
        goal: cleanString(dto.goal),
        target: cleanString(dto.target),
        function: cleanString(dto.function),
        desiredForm: cleanString(dto.desiredForm),
        costRange: cleanString(dto.costRange),
        excludedIngredients: cleanString(dto.excludedIngredients),
        sourceProductId: cleanString(dto.sourceProductId),
        sourceFormulaId: cleanString(dto.sourceFormulaId),
      },
      include: projectInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PROJECT_CREATED',
        targetType: 'DevelopmentProject',
        targetId: project.id,
        summary: `프로젝트 생성: ${dto.name}`,
        metadata: {
          projectName: dto.name,
          sourceProductId: cleanString(dto.sourceProductId) ?? null,
          sourceFormulaId: cleanString(dto.sourceFormulaId) ?? null,
        },
      },
    });

    return project;
  }

  findProjects() {
    return this.prisma.developmentProject.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: projectInclude,
    });
  }

  async findProjectById(id: string) {
    const project = await this.prisma.developmentProject.findUnique({
      where: { id },
      include: projectInclude,
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  async createExperimentGroup(
    projectId: string,
    dto: CreateExperimentGroupDto,
  ) {
    const group = await this.prisma.experimentGroup.create({
      data: {
        projectId,
        name: dto.name,
        purpose: cleanString(dto.purpose),
      },
      include: {
        tries: {
          include: formulaTryInclude,
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'EXPERIMENT_GROUP_CREATED',
        targetType: 'ExperimentGroup',
        targetId: group.id,
        summary: `실험 그룹 생성: ${dto.name}`,
        metadata: {
          projectId,
          groupName: dto.name,
        },
      },
    });

    return group;
  }

  async createFormulaTry(groupId: string, dto: CreateFormulaTryDto) {
    const ingredients = (dto.ingredients ?? [])
      .map((ingredient) => this.toTryIngredientCreateInput(ingredient))
      .filter((ingredient) => ingredient !== undefined);

    const formulaTry = await this.prisma.formulaTry.create({
      data: {
        groupId,
        tryNumber: dto.tryNumber,
        status: dto.status ?? TryStatus.DRAFT,
        title: cleanString(dto.title),
        dosageForm: cleanString(dto.dosageForm),
        manufacturingProcess: cleanString(dto.manufacturingProcess),
        memo: cleanString(dto.memo),
        ...(ingredients.length > 0
          ? {
              ingredients: {
                create: ingredients,
              },
            }
          : {}),
      },
      include: formulaTryInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'FORMULA_TRY_CREATED',
        targetType: 'FormulaTry',
        targetId: formulaTry.id,
        summary: `try 생성: try#${dto.tryNumber}`,
        metadata: {
          groupId,
          tryNumber: dto.tryNumber,
          title: cleanString(dto.title) ?? null,
        },
      },
    });

    return formulaTry;
  }

  async createTryTestResult(tryId: string, dto: CreateTestResultDto) {
    const testResult = await this.prisma.tryTestResult.create({
      data: {
        tryId,
        testPurpose: cleanString(dto.testPurpose),
        measuredItem: cleanString(dto.measuredItem),
        measuredValue: cleanScalar(dto.measuredValue),
        unit: cleanString(dto.unit),
        judgment: cleanString(dto.judgment),
        memo: cleanString(dto.memo),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'TRY_TEST_RESULT_CREATED',
        targetType: 'TryTestResult',
        targetId: testResult.id,
        summary: `테스트 결과 등록: ${tryId}`,
        metadata: {
          tryId,
          measuredItem: cleanString(dto.measuredItem) ?? null,
          judgment: cleanString(dto.judgment) ?? null,
        },
      },
    });

    return testResult;
  }

  async updateFormulaTry(tryId: string, dto: UpdateFormulaTryDto) {
    const ingredients = dto.ingredients
      ?.map((ingredient) => this.toTryIngredientCreateInput(ingredient))
      .filter((ingredient) => ingredient !== undefined);

    const formulaTry = await this.prisma.formulaTry.update({
      where: {
        id: tryId,
      },
      data: {
        status: dto.status ?? undefined,
        title: cleanNullableString(dto.title),
        dosageForm: cleanNullableString(dto.dosageForm),
        manufacturingProcess: cleanNullableString(dto.manufacturingProcess),
        memo: cleanNullableString(dto.memo),
        ...(ingredients
          ? {
              ingredients: {
                deleteMany: {},
                create: ingredients,
              },
            }
          : {}),
      },
      include: formulaTryInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'FORMULA_TRY_UPDATED',
        targetType: 'FormulaTry',
        targetId: formulaTry.id,
        summary: `try 수정: try#${formulaTry.tryNumber}`,
        metadata: {
          groupId: formulaTry.groupId,
          tryNumber: formulaTry.tryNumber,
          ingredientCount: ingredients ? ingredients.length : null,
        },
      },
    });

    return formulaTry;
  }

  async createTryMark(tryId: string, dto: CreateTryMarkDto) {
    const mark = await this.prisma.tryMark.create({
      data: {
        tryId,
        type: dto.type,
        reason: cleanString(dto.reason),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'TRY_MARK_CREATED',
        targetType: 'TryMark',
        targetId: mark.id,
        summary: `try 마킹: ${dto.type}`,
        metadata: {
          tryId,
          type: dto.type,
          reason: cleanString(dto.reason) ?? null,
        },
      },
    });

    return mark;
  }

  async deleteTryMarks(tryId: string) {
    const result = await this.prisma.tryMark.deleteMany({
      where: {
        tryId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'TRY_MARK_DELETED',
        targetType: 'FormulaTry',
        targetId: tryId,
        summary: `try 마킹 해제: ${tryId}`,
        metadata: {
          tryId,
          deletedCount: result.count,
        },
      },
    });

    return {
      tryId,
      deletedCount: result.count,
    };
  }

  async createProductFromTry(tryId: string, dto: CreateProductFromTryDto) {
    const sourceTry = await this.prisma.formulaTry.findUnique({
      where: {
        id: tryId,
      },
      include: formulaTryProductSourceInclude,
    });

    if (!sourceTry) {
      throw new NotFoundException(`FormulaTry ${tryId} not found`);
    }

    const ingredients = (sourceTry.ingredients ?? [])
      .map((ingredient) =>
        this.toProductFormulaIngredientCreateInput(ingredient),
      )
      .filter((ingredient) => ingredient !== undefined);
    const project = sourceTry.group.project;
    const productName =
      cleanString(dto.name) ??
      `${project.name} ${sourceTry.title ?? `try#${sourceTry.tryNumber}`}`;
    const dosageFormName =
      cleanString(dto.dosageFormName) ??
      cleanString(sourceTry.dosageForm) ??
      cleanString(project.desiredForm);

    const product = await this.prisma.product.create({
      data: {
        name: productName,
        category: cleanString(dto.category),
        target: cleanString(dto.target) ?? cleanString(project.target),
        function: cleanString(dto.function) ?? cleanString(project.function),
        dosageForm: this.toProductDosageFormInput(dosageFormName),
        packaging: this.toProductPackagingInput(dto.packagingName),
        formulas: {
          create: {
            version:
              cleanString(dto.formulaVersion) ?? `try#${sourceTry.tryNumber}`,
            note: cleanString(dto.formulaNote) ?? cleanString(sourceTry.memo),
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
      include: productFromTryInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PRODUCT_CREATED_FROM_TRY',
        targetType: 'Product',
        targetId: product.id,
        summary: `try 기반 제품 등록: ${productName}`,
        metadata: {
          productName,
          sourceTryId: sourceTry.id,
          sourceTryNumber: sourceTry.tryNumber,
          sourceGroupId: sourceTry.groupId,
          sourceProjectId: project.id,
          ingredientCount: ingredients.length,
        },
      },
    });

    return product;
  }

  async deleteFormulaTry(tryId: string) {
    const deletedTry = await this.prisma.formulaTry.delete({
      where: {
        id: tryId,
      },
      include: formulaTryInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'FORMULA_TRY_DELETED',
        targetType: 'FormulaTry',
        targetId: deletedTry.id,
        summary: `try 삭제: try#${deletedTry.tryNumber}`,
        metadata: {
          groupId: deletedTry.groupId,
          tryNumber: deletedTry.tryNumber,
        },
      },
    });

    return deletedTry;
  }

  findMarkedTriesByProject(projectId: string) {
    return this.prisma.formulaTry.findMany({
      where: {
        group: {
          projectId,
        },
        marks: {
          some: {},
        },
      },
      orderBy: {
        tryNumber: 'asc',
      },
      include: markedFormulaTryInclude,
    });
  }

  private toTryIngredientCreateInput(ingredient: CreateTryIngredientDto) {
    const ingredientName = cleanString(ingredient.ingredientName);

    if (!ingredientName) {
      return undefined;
    }

    return {
      amount: cleanDecimal(ingredient.amount),
      unit: cleanString(ingredient.unit),
      ratio: cleanDecimal(ingredient.ratio),
      note: cleanString(ingredient.note),
      ingredient: {
        connectOrCreate: {
          where: { name: ingredientName },
          create: { name: ingredientName },
        },
      },
    };
  }

  private toProductFormulaIngredientCreateInput(
    ingredient: SourceTryIngredient,
  ) {
    const ingredientName = cleanString(ingredient.ingredient?.name);

    if (!ingredientName) {
      return undefined;
    }

    return {
      amount: cleanDecimalValue(ingredient.amount),
      unit: cleanString(ingredient.unit),
      ratio: cleanDecimalValue(ingredient.ratio),
      role: cleanString(ingredient.note),
      ingredient: {
        connectOrCreate: {
          where: { name: ingredientName },
          create: { name: ingredientName },
        },
      },
    };
  }

  private toProductDosageFormInput(name?: string | null) {
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

  private toProductPackagingInput(name?: string | null) {
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

function cleanNullableString(value?: string | null) {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function cleanDecimal(value?: number | string | null) {
  if (value === null || value === undefined) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : undefined;
}

function cleanScalar(value?: number | string | null) {
  if (value === null || value === undefined) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : undefined;
}

function cleanDecimalValue(value: unknown) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number' || typeof value === 'string') {
    const normalized = String(value).trim();
    return normalized ? normalized : undefined;
  }

  if (!hasDecimalToNumber(value)) {
    return undefined;
  }

  const normalized = String(value.toNumber()).trim();
  return normalized ? normalized : undefined;
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
