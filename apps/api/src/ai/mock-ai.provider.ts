import { Injectable } from '@nestjs/common';
import { AiProvider } from './ai-provider.interface';

@Injectable()
export class MockAiProvider implements AiProvider {
  generateText() {
    return Promise.resolve(
      [
        'mock-ai: 안전성 우선으로 후보를 검토했습니다.',
        '실제 AI 키가 설정되면 OpenAI 또는 Gemini provider 응답으로 교체됩니다.',
      ].join('\n'),
    );
  }
}
