export class CreateEvidenceItemDto {
  sourceId: string;
  title: string;
  summary?: string | null;
  rawText?: string | null;
  sourceUrl?: string | null;
  grade?: string | null;
}
