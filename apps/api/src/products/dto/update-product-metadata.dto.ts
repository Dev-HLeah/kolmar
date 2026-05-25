import { ProductStatus } from '@prisma/client';

export type UpdateProductMetadataDto = {
  description?: string | null;
  referenceNote?: string | null;
  status?: ProductStatus | null;
};
