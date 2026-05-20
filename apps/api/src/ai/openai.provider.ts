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
    this.model = configService.get<string>('OPENAI_MODEL') ?? 'gpt-5-mini';
  }

  async generateText(prompt: string) {
    const response = await this.client.responses.create({
      model: this.model,
      input: prompt,
    });

    return response.output_text ?? '';
  }
}
