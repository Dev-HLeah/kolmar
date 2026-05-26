export const AI_PROVIDER_TOKEN = Symbol('AI_PROVIDER_TOKEN');

export interface AiProvider {
  generateText(prompt: string): Promise<string>;
  generateEmbedding(text: string): Promise<number[]>;
  analyzeDocument(input: { text?: string; pdfBuffer?: Buffer; filename: string }): Promise<string>;
}
