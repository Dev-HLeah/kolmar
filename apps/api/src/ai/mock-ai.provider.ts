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

  generateEmbedding() {
    return Promise.resolve(Array(1536).fill(0.1));
  }

  analyzeDocument({ filename }: { text?: string; pdfBuffer?: Buffer; filename: string }) {
    return Promise.resolve(
      `[Mock] "${filename}" 문서를 분석했습니다. 실제 AI 키가 설정되면 상세 분석 결과로 교체됩니다.`,
    );
  }
}
