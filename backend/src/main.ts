import 'reflect-metadata';

import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = Number(process.env.PORT ?? 3000);

  app.enableCors({
    origin: ['http://localhost:5173'],
  });

  app.useStaticAssets(join(__dirname, '..', '..', 'assets'), {
    prefix: '/assets/',
  });

  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}

bootstrap();
