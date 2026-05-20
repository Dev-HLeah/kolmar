export class CreateTestResultDto {
  testPurpose?: string | null;
  measuredItem?: string | null;
  measuredValue?: number | string | null;
  unit?: string | null;
  judgment?: string | null;
  memo?: string | null;
}
