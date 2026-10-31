import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // CORS liberado para o painel (frontend). Em produção, restrinja a origin.
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? true,
    allowedHeaders: ['Content-Type', 'X-Tenant-Id'],
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`DNS Shield API ouvindo na porta ${port}`);
}

void bootstrap();
