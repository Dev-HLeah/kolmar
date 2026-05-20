import { TryMarkType } from '@prisma/client';

export class CreateTryMarkDto {
  type: TryMarkType;
  reason?: string | null;
}
