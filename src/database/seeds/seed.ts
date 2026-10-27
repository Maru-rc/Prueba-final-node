import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

/** Punto de entrada de `npm run seed`. */
async function runSeed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    await app.get(SeedService).run();
  } finally {
    await app.close();
  }
}

runSeed().catch((error: unknown) => {
  new Logger('Seed').error(
    'El seeder falló',
    error instanceof Error ? error.stack : String(error),
  );
  process.exitCode = 1;
});
