type UpsertDelegate = {
    upsert: (args: unknown) => Promise<unknown>;
};
type SeedOperationClient = {
    auditLog: UpsertDelegate;
    dataImportJob: UpsertDelegate;
    developmentProject: UpsertDelegate;
    dosageForm: UpsertDelegate;
    evidenceItem: UpsertDelegate;
    evidenceLink: UpsertDelegate;
    evidenceSource: UpsertDelegate;
    formulaTry: UpsertDelegate;
    ingredient: UpsertDelegate;
    packagingOption: UpsertDelegate;
    product: UpsertDelegate;
    productFormula: UpsertDelegate;
    productFormulaIngredient: UpsertDelegate;
    rawExternalRecord: UpsertDelegate;
    tryIngredient: UpsertDelegate;
    vectorDocument: UpsertDelegate;
};
export type SeedPrismaClient = SeedOperationClient & {
    $transaction: <T>(callback: (tx: SeedOperationClient) => Promise<T>) => Promise<T>;
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
export declare function seedDatabase(prisma: SeedPrismaClient): Promise<SeedSummary>;
export {};
