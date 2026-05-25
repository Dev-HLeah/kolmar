import { seedDatabase } from '../../prisma/data/seed-data';

type ModelMock = {
  upsert: jest.Mock;
};

type SeedPrismaMock = {
  $transaction: jest.Mock;
  auditLog: ModelMock;
  dataImportJob: ModelMock;
  developmentProject: ModelMock;
  dosageForm: ModelMock;
  evidenceItem: ModelMock;
  evidenceLink: ModelMock;
  evidenceSource: ModelMock;
  experimentGroup: ModelMock;
  formulaTry: ModelMock;
  ingredient: ModelMock;
  packagingOption: ModelMock;
  product: ModelMock;
  productFormula: ModelMock;
  productFormulaIngredient: ModelMock;
  rawExternalRecord: ModelMock;
  tryIngredient: ModelMock;
  tryMark: ModelMock;
  tryTestResult: ModelMock;
  vectorDocument: ModelMock;
};

function createModelMock(): ModelMock {
  return {
    upsert: jest.fn().mockResolvedValue({}),
  };
}

function createSeedPrismaMock(): SeedPrismaMock {
  const prisma: SeedPrismaMock = {
    $transaction: jest.fn(),
    auditLog: createModelMock(),
    dataImportJob: createModelMock(),
    developmentProject: createModelMock(),
    dosageForm: createModelMock(),
    evidenceItem: createModelMock(),
    evidenceLink: createModelMock(),
    evidenceSource: createModelMock(),
    experimentGroup: createModelMock(),
    formulaTry: createModelMock(),
    ingredient: createModelMock(),
    packagingOption: createModelMock(),
    product: createModelMock(),
    productFormula: createModelMock(),
    productFormulaIngredient: createModelMock(),
    rawExternalRecord: createModelMock(),
    tryIngredient: createModelMock(),
    tryMark: createModelMock(),
    tryTestResult: createModelMock(),
    vectorDocument: createModelMock(),
  };

  prisma.$transaction.mockImplementation(
    async (callback: (tx: SeedPrismaMock) => Promise<unknown>) =>
      callback(prisma),
  );

  return prisma;
}

describe('seedDatabase', () => {
  it('upserts enough demo data for dashboard and workflow review', async () => {
    const prisma = createSeedPrismaMock();

    const summary = await seedDatabase(prisma);

    expect(summary).toEqual({
      dosageForms: 7,
      evidenceItems: 1,
      ingredients: 10,
      products: 4,
      projects: 3,
      tries: 5,
      vectorDocuments: 1,
    });
    expect(prisma.$transaction.mock.calls).toHaveLength(1);
    expect(prisma.product.upsert.mock.calls).toHaveLength(4);
    expect(prisma.developmentProject.upsert.mock.calls).toHaveLength(3);
    expect(prisma.formulaTry.upsert.mock.calls).toHaveLength(5);
  });

  it('keeps reruns duplicate-safe by using upsert inside a transaction', async () => {
    const prisma = createSeedPrismaMock();

    await seedDatabase(prisma);
    await seedDatabase(prisma);

    expect(prisma.$transaction.mock.calls).toHaveLength(2);
    expect(prisma.product.upsert.mock.calls).toHaveLength(8);
    expect(prisma.formulaTry.upsert.mock.calls).toHaveLength(10);
    expect(prisma.vectorDocument.upsert.mock.calls).toHaveLength(2);
  });
});
