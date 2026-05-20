export class CreateProjectDto {
  name: string;
  goal?: string | null;
  target?: string | null;
  function?: string | null;
  desiredForm?: string | null;
  costRange?: string | null;
  excludedIngredients?: string | null;
  sourceProductId?: string | null;
  sourceFormulaId?: string | null;
}
