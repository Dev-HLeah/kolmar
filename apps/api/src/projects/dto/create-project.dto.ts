export class CreateProjectDto {
  name: string;
  background?: string | null;
  objective?: string | null;
  sourceProductId?: string | null;
  sourceFormulaId?: string | null;
}
