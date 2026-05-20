import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { AiProvider } from './ai-provider.interface';

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
}
