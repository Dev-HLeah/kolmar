import { TryStatus } from '@prisma/client';

export type CreateTryIngredientDto = {
  ingredientName: string;
  amount?: number | string | null;
  unit?: string | null;
  ratio?: number | string | null;
  note?: string | null;
};

export class CreateFormulaTryDto {
  tryNumber: number;
  status?: TryStatus | null;
  title?: string | null;
  dosageForm?: string | null;
  manufacturingProcess?: string | null;
  memo?: string | null;
  ingredients?: CreateTryIngredientDto[];
}
