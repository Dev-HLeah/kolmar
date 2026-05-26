import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AI_PROVIDER_TOKEN } from './ai-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { MockAiProvider } from './mock-ai.provider';
import { OpenAiProvider } from './openai.provider';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';

@Module({
  imports: [PrismaModule],
  controllers: [RecommendationController],
  providers: [
    {
      provide: AI_PROVIDER_TOKEN,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('AI_PROVIDER') ?? 'mock';

        if (provider === 'openai') {
          return new OpenAiProvider(configService);
        }

        if (provider === 'gemini') {
          return new GeminiProvider(configService);
        }

        return new MockAiProvider();
      },
    },
    RecommendationService,
  ],
  exports: [AI_PROVIDER_TOKEN],
})
export class AiModule {}
