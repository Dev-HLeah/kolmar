import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFormulaTryDto,
  CreateTryIngredientDto,
} from './dto/create-formula-try.dto';
import { CreateProductFromTryDto } from './dto/create-product-from-try.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateFormulaTryDto } from './dto/update-formula-try.dto';
import { UpdateProjectMetadataDto } from './dto/update-project-metadata.dto';

const formulaTryInclude = {
  ingredients: {
    include: {
      ingredient: true,
    },
    orderBy: { id: 'asc' as const },
  },
  sourceProducts: {
    select: { id: true },
  },
};

const projectInclude = {
  tries: {
    include: formulaTryInclude,
    orderBy: {
      tryNumber: 'asc' as const,
    },
  },
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(dto: CreateProjectDto) {
    const project = await this.prisma.developmentProject.create({
      data: {
        name: dto.name,
        background: cleanString(dto.background),
        objective: cleanString(dto.objective),
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
        metadata: { projectName: dto.name },
      },
    });

    return project;
  }

  findProjects() {
    return this.prisma.developmentProject.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tries: {
          select: { id: true },
        },
      },
    });
  }

  async findProjectById(id: string) {
    const project = await this.prisma.developmentProject.findFirst({
      where: { id },
      include: {
        ...projectInclude,
        tries: {
          include: formulaTryInclude,
          orderBy: { tryNumber: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  async updateProjectMetadata(id: string, dto: UpdateProjectMetadataDto) {
    await this.findProjectById(id);

    const data: { background?: string | null; objective?: string | null } = {};

    if ('background' in dto) {
      data.background = cleanNullableString(dto.background);
    }

    if ('objective' in dto) {
      data.objective = cleanNullableString(dto.objective);
    }

    return this.prisma.developmentProject.update({
      where: { id },
      data,
      include: projectInclude,
    });
  }

  async createFormulaTry(projectId: string, dto: CreateFormulaTryDto) {
    const project = await this.findProjectById(projectId);

    const maxTryNumber = project.tries.reduce(
      (max, t) => Math.max(max, t.tryNumber),
      0,
    );

    const ingredients = (dto.ingredients ?? [])
      .map((ingredient) => toIngredientCreateInput(ingredient))
      .filter((ingredient) => ingredient !== undefined);

    const formulaTry = await this.prisma.formulaTry.create({
      data: {
        projectId,
        tryNumber: dto.tryNumber ?? maxTryNumber + 1,
        status: dto.status ?? 'DRAFT',
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

    return formulaTry;
  }

  async updateFormulaTry(tryId: string, dto: UpdateFormulaTryDto) {
    const existing = await this.findTryById(tryId);

    await this.prisma.tryIngredient.deleteMany({
      where: { tryId },
    });

    const ingredients = (dto.ingredients ?? [])
      .map((ingredient) => toIngredientCreateInput(ingredient))
      .filter((ingredient) => ingredient !== undefined);

    const formulaTry = await this.prisma.formulaTry.update({
      where: { id: tryId },
      data: {
        status: dto.status ?? existing.status,
        title: 'title' in dto ? cleanString(dto.title) : undefined,
        dosageForm:
          'dosageForm' in dto ? cleanString(dto.dosageForm) : undefined,
        manufacturingProcess:
          'manufacturingProcess' in dto
            ? cleanString(dto.manufacturingProcess)
            : undefined,
        memo: 'memo' in dto ? cleanString(dto.memo) : undefined,
        ...(dto.ingredients !== undefined
          ? {
              ingredients: {
                create: ingredients,
              },
            }
          : {}),
      },
      include: formulaTryInclude,
    });

    return formulaTry;
  }

  async toggleTryStar(tryId: string) {
    const existing = await this.findTryById(tryId);

    return this.prisma.formulaTry.update({
      where: { id: tryId },
      data: { starred: !existing.starred },
      include: formulaTryInclude,
    });
  }

  async deleteFormulaTry(tryId: string) {
    await this.findTryById(tryId);

    return this.prisma.formulaTry.delete({
      where: { id: tryId },
    });
  }

  async createProductFromTry(tryId: string, dto: CreateProductFromTryDto) {
    const formulaTry = await this.prisma.formulaTry.findFirst({
      where: { id: tryId },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
        project: true,
      },
    });

    if (!formulaTry) {
      throw new NotFoundException(`FormulaTry ${tryId} not found`);
    }

    const productName =
      cleanString(dto.name) ??
      `${formulaTry.project.name} try#${formulaTry.tryNumber}`;

    const ingredients = formulaTry.ingredients
      .map((ti) => {
        const name = ti.ingredient?.name?.trim();
        if (!name) return undefined;
        return {
          amount: ti.amount,
          unit: ti.unit,
          ratio: ti.ratio,
          role: ti.note,
          ingredient: {
            connectOrCreate: {
              where: { name },
              create: { name },
            },
          },
        };
      })
      .filter((i) => i !== undefined);

    const product = await this.prisma.product.create({
      data: {
        name: productName,
        category: cleanString(dto.category),
        target: cleanString(dto.target),
        function: cleanString(dto.function),
        status: 'CANDIDATE',
        sourceTry: { connect: { id: tryId } },
        dosageForm: formulaTry.dosageForm
          ? {
              connectOrCreate: {
                where: { name: formulaTry.dosageForm },
                create: { name: formulaTry.dosageForm, isKolmarSpecial: false },
              },
            }
          : undefined,
        formulas: {
          create: {
            version:
              cleanString(dto.formulaVersion) ?? `try#${formulaTry.tryNumber}`,
            note: cleanString(dto.formulaNote),
            ...(ingredients.length > 0
              ? { ingredients: { create: ingredients } }
              : {}),
          },
        },
      },
      include: {
        dosageForm: true,
        formulas: {
          include: {
            ingredients: {
              include: { ingredient: true },
            },
          },
        },
        sourceTry: {
          include: { project: true },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PRODUCT_CREATED_FROM_TRY',
        targetType: 'Product',
        targetId: product.id,
        summary: `프로젝트 try에서 제품 등록: ${productName}`,
        metadata: {
          productName,
          tryId,
          tryNumber: formulaTry.tryNumber,
          projectId: formulaTry.projectId,
        },
      },
    });

    return product;
  }

  private async findTryById(tryId: string) {
    const formulaTry = await this.prisma.formulaTry.findFirst({
      where: { id: tryId },
      include: formulaTryInclude,
    });

    if (!formulaTry) {
      throw new NotFoundException(`FormulaTry ${tryId} not found`);
    }

    return formulaTry;
  }
}

function cleanString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function cleanNullableString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function toIngredientCreateInput(ingredient: CreateTryIngredientDto) {
  const ingredientName = ingredient.ingredientName?.trim();

  if (!ingredientName) {
    return undefined;
  }

  return {
    amount: ingredient.amount !== null && ingredient.amount !== undefined
      ? String(ingredient.amount).trim() || undefined
      : undefined,
    unit: ingredient.unit?.trim() || undefined,
    ratio: ingredient.ratio !== null && ingredient.ratio !== undefined
      ? String(ingredient.ratio).trim() || undefined
      : undefined,
    note: ingredient.note?.trim() || undefined,
    ingredient: {
      connectOrCreate: {
        where: { name: ingredientName },
        create: { name: ingredientName },
      },
    },
  };
}
