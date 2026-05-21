type UpsertDelegate = {
  upsert: (args: unknown) => Promise<unknown>;
};

export type SeedPrismaClient = {
  auditLog: UpsertDelegate;
  dataImportJob: UpsertDelegate;
  developmentProject: UpsertDelegate;
  dosageForm: UpsertDelegate;
  evidenceItem: UpsertDelegate;
  evidenceLink: UpsertDelegate;
  evidenceSource: UpsertDelegate;
  experimentGroup: UpsertDelegate;
  formulaTry: UpsertDelegate;
  ingredient: UpsertDelegate;
  packagingOption: UpsertDelegate;
  product: UpsertDelegate;
  productFormula: UpsertDelegate;
  productFormulaIngredient: UpsertDelegate;
  rawExternalRecord: UpsertDelegate;
  tryIngredient: UpsertDelegate;
  tryMark: UpsertDelegate;
  tryTestResult: UpsertDelegate;
  vectorDocument: UpsertDelegate;
};

export type SeedSummary = {
  dosageForms: number;
  evidenceItems: number;
  ingredients: number;
  products: number;
  projects: number;
  tries: number;
  vectorDocuments: number;
};

const dosageForms = [
  {
    id: 'seed-dosage-tablet',
    name: '정제',
    description: '일반 고형제 기준 제형',
    isKolmarSpecial: false,
  },
  {
    id: 'seed-dosage-chewable-tablet',
    name: '츄어블 정제',
    description: '관능, 붕해, 안정성 검토가 필요한 콜마 특화 고형제 예시',
    isKolmarSpecial: true,
  },
  {
    id: 'seed-dosage-powder',
    name: '분말',
    description: '스틱 포장과 배합 균일성 검토가 필요한 분말 제형',
    isKolmarSpecial: false,
  },
];

const packagingOptions = [
  {
    id: 'seed-packaging-ptp',
    name: 'PTP 개별 포장',
    description: '정제/츄어블 정제 안정성 테스트 기준 포장',
    isKolmarSpecial: true,
  },
  {
    id: 'seed-packaging-stick',
    name: '스틱 포장',
    description: '분말 제품 관능 및 흡습 안정성 테스트 기준 포장',
    isKolmarSpecial: true,
  },
];

const ingredients = [
  {
    id: 'seed-ingredient-vitamin-c',
    name: '비타민 C',
    description: '산미와 항산화 특성을 함께 고려하는 고형제 기준 원료',
  },
  {
    id: 'seed-ingredient-zinc',
    name: '아연',
    description: '기준 규격과 섭취 상한 검토가 필요한 미네랄 원료',
  },
  {
    id: 'seed-ingredient-theanine',
    name: '테아닌',
    description: '관능과 기능성을 함께 검토하는 아미노산 계열 원료',
  },
  {
    id: 'seed-ingredient-magnesium',
    name: '마그네슘',
    description: '배합량 증가 시 맛과 장용성 이슈를 확인해야 하는 원료',
  },
];

const formulaIngredients = [
  {
    id: 'seed-formula-ingredient-vitamin-c',
    ingredientId: 'seed-ingredient-vitamin-c',
    amount: '500',
    unit: 'mg',
    ratio: '40',
    role: '산미/항산화 기준 원료',
  },
  {
    id: 'seed-formula-ingredient-zinc',
    ingredientId: 'seed-ingredient-zinc',
    amount: '8',
    unit: 'mg',
    ratio: '1',
    role: '기준 규격 및 상한 확인 원료',
  },
  {
    id: 'seed-formula-ingredient-theanine',
    ingredientId: 'seed-ingredient-theanine',
    amount: '200',
    unit: 'mg',
    ratio: '16',
    role: '관능 안정성 확인 원료',
  },
];

export async function seedDatabase(
  prisma: SeedPrismaClient,
): Promise<SeedSummary> {
  for (const dosageForm of dosageForms) {
    await prisma.dosageForm.upsert({
      where: { id: dosageForm.id },
      update: {
        description: dosageForm.description,
        isKolmarSpecial: dosageForm.isKolmarSpecial,
        name: dosageForm.name,
      },
      create: dosageForm,
    });
  }

  for (const packagingOption of packagingOptions) {
    await prisma.packagingOption.upsert({
      where: { id: packagingOption.id },
      update: {
        description: packagingOption.description,
        isKolmarSpecial: packagingOption.isKolmarSpecial,
        name: packagingOption.name,
      },
      create: packagingOption,
    });
  }

  for (const ingredient of ingredients) {
    await prisma.ingredient.upsert({
      where: { id: ingredient.id },
      update: {
        description: ingredient.description,
        name: ingredient.name,
      },
      create: ingredient,
    });
  }

  await prisma.product.upsert({
    where: { id: 'seed-product-kolmar-solid-baseline' },
    update: {
      category: '건강기능식품',
      dosageFormId: 'seed-dosage-chewable-tablet',
      function: '신물 억제 보조',
      name: '콜마 고형제 기준 처방',
      packagingId: 'seed-packaging-ptp',
      target: '위 건강',
    },
    create: {
      id: 'seed-product-kolmar-solid-baseline',
      category: '건강기능식품',
      dosageFormId: 'seed-dosage-chewable-tablet',
      function: '신물 억제 보조',
      name: '콜마 고형제 기준 처방',
      packagingId: 'seed-packaging-ptp',
      target: '위 건강',
    },
  });

  await prisma.productFormula.upsert({
    where: { id: 'seed-formula-kolmar-solid-baseline-v1' },
    update: {
      note: '고형제 중심 PoC 기준 처방 데이터',
      productId: 'seed-product-kolmar-solid-baseline',
      version: 'v1',
    },
    create: {
      id: 'seed-formula-kolmar-solid-baseline-v1',
      note: '고형제 중심 PoC 기준 처방 데이터',
      productId: 'seed-product-kolmar-solid-baseline',
      version: 'v1',
    },
  });

  for (const formulaIngredient of formulaIngredients) {
    await prisma.productFormulaIngredient.upsert({
      where: { id: formulaIngredient.id },
      update: {
        amount: formulaIngredient.amount,
        formulaId: 'seed-formula-kolmar-solid-baseline-v1',
        ingredientId: formulaIngredient.ingredientId,
        ratio: formulaIngredient.ratio,
        role: formulaIngredient.role,
        unit: formulaIngredient.unit,
      },
      create: {
        ...formulaIngredient,
        formulaId: 'seed-formula-kolmar-solid-baseline-v1',
      },
    });
  }

  await prisma.developmentProject.upsert({
    where: { id: 'seed-project-reflux-tablet' },
    update: {
      desiredForm: '츄어블 정제',
      function: '신물 억제 보조',
      goal: '기준 처방을 바탕으로 맛, 색, 붕해 안정성을 개선한다.',
      name: '신물 억제 고형제 개발',
      sourceFormulaId: 'seed-formula-kolmar-solid-baseline-v1',
      sourceProductId: 'seed-product-kolmar-solid-baseline',
      target: '위 건강',
    },
    create: {
      id: 'seed-project-reflux-tablet',
      desiredForm: '츄어블 정제',
      function: '신물 억제 보조',
      goal: '기준 처방을 바탕으로 맛, 색, 붕해 안정성을 개선한다.',
      name: '신물 억제 고형제 개발',
      sourceFormulaId: 'seed-formula-kolmar-solid-baseline-v1',
      sourceProductId: 'seed-product-kolmar-solid-baseline',
      target: '위 건강',
    },
  });

  await prisma.experimentGroup.upsert({
    where: { id: 'seed-group-stability' },
    update: {
      name: '안정성 개선 그룹',
      projectId: 'seed-project-reflux-tablet',
      purpose: '고형제 가속 안정성과 관능 이슈를 함께 확인한다.',
    },
    create: {
      id: 'seed-group-stability',
      name: '안정성 개선 그룹',
      projectId: 'seed-project-reflux-tablet',
      purpose: '고형제 가속 안정성과 관능 이슈를 함께 확인한다.',
    },
  });

  await prisma.formulaTry.upsert({
    where: { id: 'seed-try-001' },
    update: {
      dosageForm: '츄어블 정제',
      groupId: 'seed-group-stability',
      manufacturingProcess: '혼합 - 타정 - PTP 포장',
      memo: '초기 기준 처방. 연구자가 테스트 결과를 추가하며 후보 여부를 판단한다.',
      status: 'PLANNED',
      title: '기준 처방',
      tryNumber: 1,
    },
    create: {
      id: 'seed-try-001',
      dosageForm: '츄어블 정제',
      groupId: 'seed-group-stability',
      manufacturingProcess: '혼합 - 타정 - PTP 포장',
      memo: '초기 기준 처방. 연구자가 테스트 결과를 추가하며 후보 여부를 판단한다.',
      status: 'PLANNED',
      title: '기준 처방',
      tryNumber: 1,
    },
  });

  for (const formulaIngredient of formulaIngredients) {
    await prisma.tryIngredient.upsert({
      where: { id: `seed-try-ingredient-${formulaIngredient.ingredientId}` },
      update: {
        amount: formulaIngredient.amount,
        ingredientId: formulaIngredient.ingredientId,
        note: formulaIngredient.role,
        ratio: formulaIngredient.ratio,
        tryId: 'seed-try-001',
        unit: formulaIngredient.unit,
      },
      create: {
        id: `seed-try-ingredient-${formulaIngredient.ingredientId}`,
        amount: formulaIngredient.amount,
        ingredientId: formulaIngredient.ingredientId,
        note: formulaIngredient.role,
        ratio: formulaIngredient.ratio,
        tryId: 'seed-try-001',
        unit: formulaIngredient.unit,
      },
    });
  }

  await prisma.tryTestResult.upsert({
    where: { id: 'seed-result-001' },
    update: {
      judgment: '적합',
      measuredItem: '붕해 시간',
      measuredValue: '12',
      memo: 'seed 기준값. 실제 연구 결과로 교체 가능하다.',
      testPurpose: '초기 고형제 안정성 확인',
      tryId: 'seed-try-001',
      unit: '분',
    },
    create: {
      id: 'seed-result-001',
      judgment: '적합',
      measuredItem: '붕해 시간',
      measuredValue: '12',
      memo: 'seed 기준값. 실제 연구 결과로 교체 가능하다.',
      testPurpose: '초기 고형제 안정성 확인',
      tryId: 'seed-try-001',
      unit: '분',
    },
  });

  await prisma.tryMark.upsert({
    where: { id: 'seed-mark-001' },
    update: {
      reason: '비교 기준으로 유지할 의미 있는 시도',
      tryId: 'seed-try-001',
      type: 'BASELINE_CANDIDATE',
    },
    create: {
      id: 'seed-mark-001',
      reason: '비교 기준으로 유지할 의미 있는 시도',
      tryId: 'seed-try-001',
      type: 'BASELINE_CANDIDATE',
    },
  });

  await prisma.evidenceSource.upsert({
    where: { id: 'seed-evidence-source-mfds' },
    update: {
      baseUrl: 'https://www.foodsafetykorea.go.kr',
      name: '식품안전나라/식약처 공개 정보',
      type: 'official',
    },
    create: {
      id: 'seed-evidence-source-mfds',
      baseUrl: 'https://www.foodsafetykorea.go.kr',
      name: '식품안전나라/식약처 공개 정보',
      type: 'official',
    },
  });

  await prisma.evidenceItem.upsert({
    where: { id: 'seed-evidence-item-vitamin-c' },
    update: {
      grade: 'official',
      rawText:
        '공개 기준 규격 데이터는 원문 출처를 함께 저장하고 내부 근거로 재사용한다.',
      sourceId: 'seed-evidence-source-mfds',
      sourceUrl: 'https://www.foodsafetykorea.go.kr',
      summary:
        '비타민 C 고형제 처방에서 산미, 함량, 기준 규격 확인이 필요한 seed 근거입니다.',
      title: '비타민 C 고형제 기준 규격 참고',
    },
    create: {
      id: 'seed-evidence-item-vitamin-c',
      grade: 'official',
      rawText:
        '공개 기준 규격 데이터는 원문 출처를 함께 저장하고 내부 근거로 재사용한다.',
      sourceId: 'seed-evidence-source-mfds',
      sourceUrl: 'https://www.foodsafetykorea.go.kr',
      summary:
        '비타민 C 고형제 처방에서 산미, 함량, 기준 규격 확인이 필요한 seed 근거입니다.',
      title: '비타민 C 고형제 기준 규격 참고',
    },
  });

  await prisma.evidenceLink.upsert({
    where: { id: 'seed-evidence-link-vitamin-c-product' },
    update: {
      evidenceId: 'seed-evidence-item-vitamin-c',
      relation: 'formulation_guidance',
      targetId: 'seed-formula-kolmar-solid-baseline-v1',
      targetType: 'ProductFormula',
    },
    create: {
      id: 'seed-evidence-link-vitamin-c-product',
      evidenceId: 'seed-evidence-item-vitamin-c',
      relation: 'formulation_guidance',
      targetId: 'seed-formula-kolmar-solid-baseline-v1',
      targetType: 'ProductFormula',
    },
  });

  await prisma.dataImportJob.upsert({
    where: { id: 'seed-import-job-mfds' },
    update: {
      finishedAt: new Date('2026-01-01T00:00:00.000Z'),
      message: 'seed로 등록된 공개 정보 예시',
      sourceName: 'MFDS OpenAPI',
      status: 'IMPORTED',
    },
    create: {
      id: 'seed-import-job-mfds',
      finishedAt: new Date('2026-01-01T00:00:00.000Z'),
      message: 'seed로 등록된 공개 정보 예시',
      sourceName: 'MFDS OpenAPI',
      status: 'IMPORTED',
    },
  });

  await prisma.rawExternalRecord.upsert({
    where: { id: 'seed-raw-record-mfds-vitamin-c' },
    update: {
      externalId: 'seed-mfds-vitamin-c',
      importJobId: 'seed-import-job-mfds',
      message: '정규화 완료 seed record',
      normalizedEvidenceId: 'seed-evidence-item-vitamin-c',
      normalizedStatus: 'NORMALIZED',
      rawPayload: {
        ingredient: '비타민 C',
        source: 'MFDS OpenAPI',
        usage: '고형제 기준 규격 참고',
      },
      sourceName: 'MFDS OpenAPI',
      sourceUrl: 'https://www.foodsafetykorea.go.kr',
    },
    create: {
      id: 'seed-raw-record-mfds-vitamin-c',
      externalId: 'seed-mfds-vitamin-c',
      importJobId: 'seed-import-job-mfds',
      message: '정규화 완료 seed record',
      normalizedEvidenceId: 'seed-evidence-item-vitamin-c',
      normalizedStatus: 'NORMALIZED',
      rawPayload: {
        ingredient: '비타민 C',
        source: 'MFDS OpenAPI',
        usage: '고형제 기준 규격 참고',
      },
      sourceName: 'MFDS OpenAPI',
      sourceUrl: 'https://www.foodsafetykorea.go.kr',
    },
  });

  await prisma.auditLog.upsert({
    where: { id: 'seed-audit-initial-data' },
    update: {
      action: 'SEED_INITIAL_DATA',
      metadata: {
        projectId: 'seed-project-reflux-tablet',
        productId: 'seed-product-kolmar-solid-baseline',
      },
      summary: '초기 개발 확인용 seed 데이터 등록',
      targetId: 'seed-project-reflux-tablet',
      targetType: 'System',
    },
    create: {
      id: 'seed-audit-initial-data',
      action: 'SEED_INITIAL_DATA',
      metadata: {
        projectId: 'seed-project-reflux-tablet',
        productId: 'seed-product-kolmar-solid-baseline',
      },
      summary: '초기 개발 확인용 seed 데이터 등록',
      targetId: 'seed-project-reflux-tablet',
      targetType: 'System',
    },
  });

  await prisma.vectorDocument.upsert({
    where: { id: 'seed-vector-vitamin-c-guidance' },
    update: {
      content:
        '비타민 C 고형제 처방은 산미, 기준 규격, 배합 안정성을 함께 검토해야 한다.',
      entityId: 'seed-evidence-item-vitamin-c',
      entityType: 'EvidenceItem',
      metadata: {
        dosageForm: '츄어블 정제',
        ingredientId: 'seed-ingredient-vitamin-c',
        source: 'seed',
      },
    },
    create: {
      id: 'seed-vector-vitamin-c-guidance',
      content:
        '비타민 C 고형제 처방은 산미, 기준 규격, 배합 안정성을 함께 검토해야 한다.',
      entityId: 'seed-evidence-item-vitamin-c',
      entityType: 'EvidenceItem',
      metadata: {
        dosageForm: '츄어블 정제',
        ingredientId: 'seed-ingredient-vitamin-c',
        source: 'seed',
      },
    },
  });

  return {
    dosageForms: dosageForms.length,
    evidenceItems: 1,
    ingredients: ingredients.length,
    products: 1,
    projects: 1,
    tries: 1,
    vectorDocuments: 1,
  };
}
