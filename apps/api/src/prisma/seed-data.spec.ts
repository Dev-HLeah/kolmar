import { seedDatabase } from './seed-data';

type ModelMock = {
  upsert: jest.Mock;
};

function createModelMock(): ModelMock {
  return {
    upsert: jest.fn().mockResolvedValue({}),
  };
}

function createSeedPrismaMock() {
  return {
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
}

describe('seedDatabase', () => {
  it('upserts solid-form Kolmar baseline data for local development', async () => {
    const prisma = createSeedPrismaMock();

    const summary = await seedDatabase(prisma);

    expect(summary).toEqual({
      dosageForms: 3,
      evidenceItems: 1,
      ingredients: 4,
      products: 1,
      projects: 1,
      tries: 1,
      vectorDocuments: 1,
    });
    expect(prisma.dosageForm.upsert.mock.calls).toContainEqual([
      expect.objectContaining({
        where: { id: 'seed-dosage-chewable-tablet' },
        create: expect.objectContaining({
          isKolmarSpecial: true,
          name: '츄어블 정제',
        }),
      }),
    ]);
    expect(prisma.product.upsert.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        create: expect.objectContaining({
          dosageFormId: 'seed-dosage-chewable-tablet',
          packagingId: 'seed-packaging-ptp',
        }),
        where: { id: 'seed-product-kolmar-solid-baseline' },
      }),
    );
    expect(prisma.formulaTry.upsert.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        create: expect.objectContaining({
          groupId: 'seed-group-stability',
          tryNumber: 1,
        }),
        where: { id: 'seed-try-001' },
      }),
    );
    expect(prisma.vectorDocument.upsert.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        create: expect.objectContaining({
          entityId: 'seed-evidence-item-vitamin-c',
          entityType: 'EvidenceItem',
        }),
        where: { id: 'seed-vector-vitamin-c-guidance' },
      }),
    );
  });
});
