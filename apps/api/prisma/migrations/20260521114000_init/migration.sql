-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- EnableExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'RESEARCHER', 'VIEWER');

-- CreateEnum
CREATE TYPE "TryStatus" AS ENUM ('DRAFT', 'PLANNED', 'IN_PROGRESS', 'TESTED', 'CANDIDATE', 'FINAL_CANDIDATE', 'DISCARDED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "TryMarkType" AS ENUM ('PROMISING', 'ISSUE_FOUND', 'BASELINE_CANDIDATE', 'FINAL_CANDIDATE', 'DISCARDED', 'NEEDS_REVIEW');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'RESEARCHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientAlias" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "source" TEXT,

    CONSTRAINT "IngredientAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DosageForm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isKolmarSpecial" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DosageForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagingOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isKolmarSpecial" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PackagingOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "target" TEXT,
    "function" TEXT,
    "dosageFormId" TEXT,
    "packagingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFormula" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFormulaIngredient" (
    "id" TEXT NOT NULL,
    "formulaId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "amount" DECIMAL(65,30),
    "unit" TEXT,
    "ratio" DECIMAL(65,30),
    "role" TEXT,

    CONSTRAINT "ProductFormulaIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevelopmentProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "target" TEXT,
    "function" TEXT,
    "desiredForm" TEXT,
    "costRange" TEXT,
    "excludedIngredients" TEXT,
    "sourceProductId" TEXT,
    "sourceFormulaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevelopmentProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentGroup" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperimentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormulaTry" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "tryNumber" INTEGER NOT NULL,
    "status" "TryStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "dosageForm" TEXT,
    "manufacturingProcess" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormulaTry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TryIngredient" (
    "id" TEXT NOT NULL,
    "tryId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "amount" DECIMAL(65,30),
    "unit" TEXT,
    "ratio" DECIMAL(65,30),
    "note" TEXT,

    CONSTRAINT "TryIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TryTestResult" (
    "id" TEXT NOT NULL,
    "tryId" TEXT NOT NULL,
    "testPurpose" TEXT,
    "measuredItem" TEXT,
    "measuredValue" TEXT,
    "unit" TEXT,
    "judgment" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TryTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TryMark" (
    "id" TEXT NOT NULL,
    "tryId" TEXT NOT NULL,
    "type" "TryMarkType" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TryMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "baseUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceItem" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "rawText" TEXT,
    "sourceUrl" TEXT,
    "grade" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceLink" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relation" TEXT,

    CONSTRAINT "EvidenceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataImportJob" (
    "id" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "message" TEXT,

    CONSTRAINT "DataImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawExternalRecord" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT,
    "sourceName" TEXT NOT NULL,
    "externalId" TEXT,
    "sourceUrl" TEXT,
    "rawPayload" JSONB NOT NULL,
    "normalizedStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "normalizedEvidenceId" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawExternalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "summary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VectorDocument" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "embedding" vector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VectorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientAlias_ingredientId_alias_key" ON "IngredientAlias"("ingredientId", "alias");

-- CreateIndex
CREATE UNIQUE INDEX "DosageForm_name_key" ON "DosageForm"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PackagingOption_name_key" ON "PackagingOption"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductFormula_productId_version_key" ON "ProductFormula"("productId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "FormulaTry_groupId_tryNumber_key" ON "FormulaTry"("groupId", "tryNumber");

-- CreateIndex
CREATE INDEX "RawExternalRecord_sourceName_externalId_idx" ON "RawExternalRecord"("sourceName", "externalId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "VectorDocument_entityType_entityId_idx" ON "VectorDocument"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "IngredientAlias" ADD CONSTRAINT "IngredientAlias_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_dosageFormId_fkey" FOREIGN KEY ("dosageFormId") REFERENCES "DosageForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_packagingId_fkey" FOREIGN KEY ("packagingId") REFERENCES "PackagingOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFormula" ADD CONSTRAINT "ProductFormula_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFormulaIngredient" ADD CONSTRAINT "ProductFormulaIngredient_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "ProductFormula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFormulaIngredient" ADD CONSTRAINT "ProductFormulaIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentGroup" ADD CONSTRAINT "ExperimentGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DevelopmentProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormulaTry" ADD CONSTRAINT "FormulaTry_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ExperimentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryIngredient" ADD CONSTRAINT "TryIngredient_tryId_fkey" FOREIGN KEY ("tryId") REFERENCES "FormulaTry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryIngredient" ADD CONSTRAINT "TryIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryTestResult" ADD CONSTRAINT "TryTestResult_tryId_fkey" FOREIGN KEY ("tryId") REFERENCES "FormulaTry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryMark" ADD CONSTRAINT "TryMark_tryId_fkey" FOREIGN KEY ("tryId") REFERENCES "FormulaTry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "EvidenceSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceLink" ADD CONSTRAINT "EvidenceLink_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "EvidenceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawExternalRecord" ADD CONSTRAINT "RawExternalRecord_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "DataImportJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
