import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades que no estén en el DTO
      forbidNonWhitelisted: true, // y responde 400 si llegan propiedades extra
      transform: true, // convierte params/query al tipo declarado
    }),
  );

  const port = app.get(ConfigService).getOrThrow<number>('PORT');
  await app.listen(port);
}
void bootstrap();
