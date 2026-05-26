import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { AiProvider } from './ai-provider.interface';
import { buildDocumentSummaryPrompt } from './openai.provider';

export class GeminiProvider implements AiProvider {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required when AI_PROVIDER=gemini');
    }

    this.client = new GoogleGenAI({ apiKey });
    this.model =
      configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  }

  async generateText(prompt: string) {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
    });

    return response.text ?? '';
  }

  async generateEmbedding(text: string) {
    const response = await this.client.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    });

    return response.embeddings?.[0]?.values ?? [];
  }

  async analyzeDocument({ text, filename }: { text?: string; pdfBuffer?: Buffer; filename: string }) {
    const content = text ?? `[${filename} 파일 — 텍스트 추출 불가]`;
    const prompt = buildDocumentSummaryPrompt(content, filename);
    return this.generateText(prompt);
  }
}
