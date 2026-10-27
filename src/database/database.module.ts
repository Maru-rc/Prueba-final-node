import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Conexión a PostgreSQL con TypeORM. La usan tanto la API como el seeder.
 * Las entidades se registran automáticamente desde cada módulo (forFeature).
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.getOrThrow<number>('DB_PORT'),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        // Crea/actualiza las tablas a partir de las entidades (entorno de prueba).
        synchronize: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
