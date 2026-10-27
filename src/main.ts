import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const SWAGGER_PATH = 'docs';

function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('FleetCore API')
    .setDescription(
      [
        'API REST para gestionar el mantenimiento de la flota de vehículos de FleetCore.',
        '',
        '1. Inicia sesión en **POST /auth/login** (credenciales de prueba en el README).',
        '2. Copia el `accessToken` y pulsa **Authorize** → `bearer`.',
        '3. Para **/integrations** usa **Authorize** → `api-key` con una clave de `API_KEYS`.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'Clave de integración (variable API_KEYS)',
      },
      'api-key',
    )
    .build();

  SwaggerModule.setup(
    SWAGGER_PATH,
    app,
    () => SwaggerModule.createDocument(app, config),
    { swaggerOptions: { persistAuthorization: true } },
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades que no estén en el DTO
      forbidNonWhitelisted: true, // y responde 400 si llegan propiedades extra
      transform: true, // convierte params/query al tipo declarado
    }),
  );
  setupSwagger(app);

  const port = app.get(ConfigService).getOrThrow<number>('PORT');
  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`FleetCore API en http://localhost:${port}`);
  logger.log(`Swagger en http://localhost:${port}/${SWAGGER_PATH}`);
}
void bootstrap();
