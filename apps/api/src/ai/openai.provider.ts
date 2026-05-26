import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiProvider } from './ai-provider.interface';

export class OpenAiProvider implements AiProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');
    }

    this.client = new OpenAI({ apiKey });
    this.model = configService.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
  }

  async generateText(prompt: string) {
    const response = await this.client.responses.create({
      model: this.model,
      input: prompt,
    });

    return response.output_text ?? '';
  }

  async generateEmbedding(text: string) {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0]?.embedding ?? [];
  }

  async analyzeDocument({
    text,
    pdfBuffer,
    filename,
  }: {
    text?: string;
    pdfBuffer?: Buffer;
    filename: string;
  }) {
    const summaryInstruction =
      '이 문서의 핵심 내용을 한국어로 요약해주세요. ' +
      '특히 원료/성분 안전성, 배합 금기 사항, 권장 배합 비율, 독성 정보, ' +
      '출처 기관 등 연구원에게 중요한 정보를 중심으로 구조화된 요약을 작성해주세요.';

    if (pdfBuffer) {
      const base64 = pdfBuffer.toString('base64');
      const response = await this.client.responses.create({
        model: 'gpt-4o',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_file' as const,
                filename,
                file_data: `data:application/pdf;base64,${base64}`,
              },
              {
                type: 'input_text' as const,
                text: summaryInstruction,
              },
            ],
          },
        ],
      });
      return response.output_text ?? '';
    }

    const content = text ?? `[${filename} — 내용 없음]`;
    return this.generateText(`${summaryInstruction}\n\n---\n${content}`);
  }
}

export function buildDocumentSummaryPrompt(content: string, filename: string) {
  return (
    `다음은 "${filename}" 문서의 내용입니다. ` +
    '핵심 내용을 한국어로 요약해주세요. ' +
    '특히 원료/성분 안전성, 배합 금기 사항, 권장 배합 비율, 독성 정보를 중심으로.\n\n' +
    `---\n${content.substring(0, 8000)}`
  );
}
