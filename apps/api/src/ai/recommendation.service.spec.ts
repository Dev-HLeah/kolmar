import { RecommendationService } from './recommendation.service';
import type { AiProvider } from './ai-provider.interface';

describe('RecommendationService', () => {
  it('creates six draft try candidates with safety-first instructions', async () => {
    const generateText = jest.fn().mockResolvedValue('mock provider output');
    const provider: AiProvider = {
      generateText,
    };
    const service = new RecommendationService(provider);

    const result = await service.createDraftTries({
      projectName: '신물 억제 고형제 개발',
      targetFunction: '신물 억제',
      dosageForm: '츄어블 정제',
      sourceFormula: {
        ingredients: [
          { ingredientName: '비타민 C', amount: '500', unit: 'mg' },
          { ingredientName: '아연', amount: '8', unit: 'mg' },
        ],
      },
      evidenceContext: ['식약처 기준 우선 확인'],
    });

    expect(generateText).toHaveBeenCalledWith(
      expect.stringContaining('독성 가능성을 최우선으로 회피'),
    );
    expect(result.providerOutput).toBe('mock provider output');
    expect(result.candidates).toHaveLength(6);
    expect(result.candidates.map((candidate) => candidate.title)).toContain(
      '콜마 특화 제형 후보',
    );
  });
});
