import { Prisma } from '@prisma/client';

export type RawExternalRecordDto = {
  externalId?: string | null;
  sourceUrl?: string | null;
  rawPayload: Prisma.InputJsonValue;
  normalizedStatus?: string | null;
  message?: string | null;
};

export class CreateImportJobDto {
  sourceName: string;
  status?: string | null;
  message?: string | null;
  records?: RawExternalRecordDto[];
}
