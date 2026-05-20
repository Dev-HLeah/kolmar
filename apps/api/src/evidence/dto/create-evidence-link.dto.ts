export class CreateEvidenceLinkDto {
  evidenceId: string;
  targetType: string;
  targetId: string;
  relation?: string | null;
}
