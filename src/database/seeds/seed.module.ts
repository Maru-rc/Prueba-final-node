import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validateEnv } from '../../config/env.validation';
import { MaintenanceStatusLog } from '../../modules/maintenances/entities/maintenance-status-log.entity';
import { Maintenance } from '../../modules/maintenances/entities/maintenance.entity';
import { Mechanic } from '../../modules/mechanics/entities/mechanic.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Vehicle } from '../../modules/vehicles/entities/vehicle.entity';
import { Workshop } from '../../modules/workshops/entities/workshop.entity';
import { DatabaseModule } from '../database.module';
import { SeedService } from './seed.service';

/** Módulo mínimo (sin servidor HTTP) para ejecutar el seeder. */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    DatabaseModule,
    TypeOrmModule.forFeature([
      User,
      Mechanic,
      Workshop,
      Vehicle,
      Maintenance,
      MaintenanceStatusLog,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
