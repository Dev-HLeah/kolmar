export type CreateFormulaIngredientDto = {
  ingredientName: string;
  amount?: number | string | null;
  unit?: string | null;
  ratio?: number | string | null;
  role?: string | null;
  note?: string | null;
};

export class CreateProductDto {
  name: string;
  category?: string | null;
  target?: string | null;
  function?: string | null;
  dosageFormName?: string | null;
  packagingName?: string | null;
  formulaVersion?: string | null;
  formulaNote?: string | null;
  ingredients?: CreateFormulaIngredientDto[];
}
