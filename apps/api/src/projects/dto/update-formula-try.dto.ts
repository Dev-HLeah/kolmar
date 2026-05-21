import { TryStatus } from '@prisma/client';
import { CreateTryIngredientDto } from './create-formula-try.dto';

export class UpdateFormulaTryDto {
  status?: TryStatus | null;
  title?: string | null;
  dosageForm?: string | null;
  manufacturingProcess?: string | null;
  memo?: string | null;
  ingredients?: CreateTryIngredientDto[];
}
