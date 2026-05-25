CREATE TYPE "ProductStatus" AS ENUM ('RELEASED', 'PENDING_RELEASE', 'UNDER_REVIEW', 'DISCONTINUED');

ALTER TABLE "Product"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "referenceNote" TEXT,
  ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'UNDER_REVIEW',
  ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");
