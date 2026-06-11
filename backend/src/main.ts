import 'reflect-metadata';

import { mkdirSync } from 'fs';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config as loadEnv } from 'dotenv';

import { AppModule } from './app.module';

loadEnv();

async function bootstrap(): Promise<void> {
  mkdirSync('uploads/products', { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = Number(process.env.PORT ?? 3000);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CS308 Electronics Store API')
    .setDescription('REST API for the e-commerce backend')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin:
      /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/,
  });

  app.useStaticAssets(join(__dirname, '..', '..', 'assets'), {
    prefix: '/assets/',
  });

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}

bootstrap();
