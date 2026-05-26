import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://kolmar.vercel.app',
      /https:\/\/kolmar-.*\.vercel\.app$/,
      'http://localhost:5173',
      'http://localhost:4173',
      'http://localhost:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-id'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') ?? config.get<number>('API_PORT') ?? 3000;

  await app.listen(port, '0.0.0.0');
}
void bootstrap();
