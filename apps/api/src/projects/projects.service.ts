import { Injectable, NotFoundException } from '@nestjs/common';
import { TryStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExperimentGroupDto } from './dto/create-experiment-group.dto';
import {
  CreateFormulaTryDto,
  CreateTryIngredientDto,
} from './dto/create-formula-try.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTestResultDto } from './dto/create-test-result.dto';
import { CreateTryMarkDto } from './dto/create-try-mark.dto';

const formulaTryInclude = {
  ingredients: {
    include: {
      ingredient: true,
    },
  },
  testResults: true,
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

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  createProject(dto: CreateProjectDto) {
    return this.prisma.developmentProject.create({
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

  createExperimentGroup(projectId: string, dto: CreateExperimentGroupDto) {
    return this.prisma.experimentGroup.create({
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
  }

  createFormulaTry(groupId: string, dto: CreateFormulaTryDto) {
    const ingredients = (dto.ingredients ?? [])
      .map((ingredient) => this.toTryIngredientCreateInput(ingredient))
      .filter((ingredient) => ingredient !== undefined);

    return this.prisma.formulaTry.create({
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
  }

  createTryTestResult(tryId: string, dto: CreateTestResultDto) {
    return this.prisma.tryTestResult.create({
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
  }

  createTryMark(tryId: string, dto: CreateTryMarkDto) {
    return this.prisma.tryMark.create({
      data: {
        tryId,
        type: dto.type,
        reason: cleanString(dto.reason),
      },
    });
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

function cleanScalar(value?: number | string | null) {
  if (value === null || value === undefined) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : undefined;
}
