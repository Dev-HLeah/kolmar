export const AI_PROVIDER_TOKEN = Symbol('AI_PROVIDER_TOKEN');

export interface AiProvider {
  generateText(prompt: string): Promise<string>;
}
