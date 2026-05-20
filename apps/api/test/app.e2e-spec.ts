import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Kolma API smoke (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.AI_PROVIDER = 'mock';
    delete process.env.DIRECT_URL;
    delete process.env.DATABASE_URL;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns service health', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect({
      status: 'ok',
      service: 'kolma-api',
    });
  });

  it('creates mock draft try recommendations without external AI keys', async () => {
    const response = await request(app.getHttpServer())
      .post('/recommendations/draft-tries')
      .send({
        projectName: 'solid dosage smoke project',
        targetFunction: 'digestive comfort',
        dosageForm: 'tablet',
        sourceFormula: {
          ingredients: [
            {
              ingredientName: 'ingredient-a',
              amount: 100,
              unit: 'mg',
            },
          ],
        },
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        projectName: 'solid dosage smoke project',
        safetyNotice: expect.any(String),
        providerOutput: expect.stringContaining('mock-ai'),
        candidates: expect.arrayContaining([
          expect.objectContaining({
            title: expect.any(String),
            objective: expect.any(String),
            suggestedChanges: expect.any(Array),
            riskChecks: expect.any(Array),
          }),
        ]),
      }),
    );
    expect(response.body.candidates).toHaveLength(6);
  });
});
