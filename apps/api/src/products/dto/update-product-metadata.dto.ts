import { ProductStatus } from '@prisma/client';

export type UpdateProductMetadataDto = {
  name?: string | null;
  description?: string | null;
  referenceNote?: string | null;
  status?: ProductStatus | null;
};
