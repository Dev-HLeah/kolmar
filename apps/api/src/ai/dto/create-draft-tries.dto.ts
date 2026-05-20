export type DraftFormulaIngredientDto = {
  ingredientName: string;
  amount?: number | string | null;
  unit?: string | null;
  ratio?: number | string | null;
  note?: string | null;
};

export class CreateDraftTriesDto {
  projectName?: string | null;
  targetFunction?: string | null;
  dosageForm?: string | null;
  constraints?: string[] | null;
  evidenceContext?: string[] | null;
  sourceFormula?: {
    ingredients?: DraftFormulaIngredientDto[];
  } | null;
}
