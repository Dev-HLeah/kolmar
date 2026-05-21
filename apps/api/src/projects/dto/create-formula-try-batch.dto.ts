import { TryStatus } from '@prisma/client';

export class CreateFormulaTryBatchDto {
  count: number;
  startNumber?: number | null;
  status?: TryStatus | null;
  titlePrefix?: string | null;
  dosageForm?: string | null;
  manufacturingProcess?: string | null;
  memo?: string | null;
}
