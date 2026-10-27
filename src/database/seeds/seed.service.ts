import { Injectable, Logger } from '@nestjs/common';
import {
  DataSource,
  DeepPartial,
  EntityManager,
  EntityTarget,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { hashPassword } from '../../common/utils/password.util';
import { MaintenanceStatusLog } from '../../modules/maintenances/entities/maintenance-status-log.entity';
import { Maintenance } from '../../modules/maintenances/entities/maintenance.entity';
import { MaintenanceStatus } from '../../modules/maintenances/enums/maintenance-status.enum';
import { Mechanic } from '../../modules/mechanics/entities/mechanic.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Vehicle } from '../../modules/vehicles/entities/vehicle.entity';
import { Workshop } from '../../modules/workshops/entities/workshop.entity';
import {
  SEED_MAINTENANCES,
  SEED_MECHANICS,
  SEED_USERS,
  SEED_VEHICLES,
  SEED_WORKSHOPS,
} from './seed-data';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type StatusLogData = Pick<
  MaintenanceStatusLog,
  'fromStatus' | 'toStatus' | 'changedById' | 'note' | 'changedAt'
>;

function getOrThrow<K, V>(map: Map<K, V>, key: K): V {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`Dato semilla no encontrado: ${String(key)}`);
  }
  return value;
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);
  private stats = { created: 0, existing: 0 };

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Pobla la base de datos con datos de prueba.
   *
   * Idempotente: cada registro se busca por su campo único (email, nombre, placa...)
   * y solo se crea si no existe, así que ejecutarlo varias veces no duplica datos.
   * Transacción: si algo falla, no queda la base de datos a medio poblar.
   */
  async run(): Promise<void> {
    this.stats = { created: 0, existing: 0 };

    await this.dataSource.transaction(async (manager) => {
      const usersByEmail = await this.seedUsers(manager);
      const mechanicsByEmail = await this.seedMechanics(manager, usersByEmail);
      const workshopsByName = await this.seedWorkshops(manager);
      const vehiclesByPlate = await this.seedVehicles(manager);
      await this.seedMaintenances(manager, {
        usersByEmail,
        mechanicsByEmail,
        workshopsByName,
        vehiclesByPlate,
      });
    });

    this.logger.log(
      `Seeder finalizado: ${this.stats.created} registros creados, ${this.stats.existing} ya existían`,
    );
  }

  private async seedUsers(manager: EntityManager): Promise<Map<string, User>> {
    const usersByEmail = new Map<string, User>();
    for (const { password, ...user } of SEED_USERS) {
      const [record] = await this.findOrCreate(
        manager,
        User,
        { email: user.email },
        async () => ({ ...user, password: await hashPassword(password) }),
      );
      usersByEmail.set(record.email, record);
    }
    return usersByEmail;
  }

  private async seedMechanics(
    manager: EntityManager,
    usersByEmail: Map<string, User>,
  ): Promise<Map<string, Mechanic>> {
    const mechanicsByEmail = new Map<string, Mechanic>();
    for (const { userEmail, ...mechanic } of SEED_MECHANICS) {
      const [record] = await this.findOrCreate(
        manager,
        Mechanic,
        { email: mechanic.email },
        () => ({
          ...mechanic,
          userId: userEmail ? getOrThrow(usersByEmail, userEmail).id : null,
        }),
      );
      mechanicsByEmail.set(record.email, record);
    }
    return mechanicsByEmail;
  }

  private async seedWorkshops(
    manager: EntityManager,
  ): Promise<Map<string, Workshop>> {
    const workshopsByName = new Map<string, Workshop>();
    for (const workshop of SEED_WORKSHOPS) {
      const [record] = await this.findOrCreate(
        manager,
        Workshop,
        { name: workshop.name },
        () => workshop,
      );
      workshopsByName.set(record.name, record);
    }
    return workshopsByName;
  }

  private async seedVehicles(
    manager: EntityManager,
  ): Promise<Map<string, Vehicle>> {
    const vehiclesByPlate = new Map<string, Vehicle>();
    for (const vehicle of SEED_VEHICLES) {
      const [record] = await this.findOrCreate(
        manager,
        Vehicle,
        { plate: vehicle.plate },
        () => vehicle,
      );
      vehiclesByPlate.set(record.plate, record);
    }
    return vehiclesByPlate;
  }

  private async seedMaintenances(
    manager: EntityManager,
    refs: {
      usersByEmail: Map<string, User>;
      mechanicsByEmail: Map<string, Mechanic>;
      workshopsByName: Map<string, Workshop>;
      vehiclesByPlate: Map<string, Vehicle>;
    },
  ): Promise<void> {
    const adminSeed = SEED_USERS.find((user) => user.role === Role.ADMIN);
    if (!adminSeed) {
      throw new Error('Los datos semilla deben incluir un usuario ADMIN');
    }
    const adminId = getOrThrow(refs.usersByEmail, adminSeed.email).id;

    for (const seed of SEED_MAINTENANCES) {
      const vehicle = getOrThrow(refs.vehiclesByPlate, seed.vehiclePlate);
      const mechanic = getOrThrow(refs.mechanicsByEmail, seed.mechanicEmail);
      const workshop = getOrThrow(refs.workshopsByName, seed.workshopName);
      const scheduledAt = new Date(seed.scheduledAt);

      // Un mantenimiento sembrado se identifica por su vehículo y su fecha programada
      const [maintenance, created] = await this.findOrCreate(
        manager,
        Maintenance,
        { vehicleId: vehicle.id, scheduledAt },
        () => ({
          type: seed.type,
          description: seed.description,
          mileage: seed.mileage,
          scheduledAt,
          estimatedEndAt: new Date(seed.estimatedEndAt),
          status: seed.status,
          startedAt: new Date(seed.startedAt),
          workPerformed: seed.closing?.workPerformed ?? null,
          finalCost: seed.closing?.finalCost ?? null,
          finishedAt: seed.closing ? new Date(seed.closing.finishedAt) : null,
          finalMileage: seed.closing?.finalMileage ?? null,
          vehicleId: vehicle.id,
          mechanicId: mechanic.id,
          workshopId: workshop.id,
        }),
      );

      if (created) {
        await this.seedStatusLogs(
          manager,
          maintenance,
          adminId,
          mechanic.userId,
        );
      }
    }
  }

  /** Reconstruye la auditoría del mantenimiento sembrado: programación, inicio y cierre. */
  private async seedStatusLogs(
    manager: EntityManager,
    maintenance: Maintenance,
    adminId: number,
    technicianId: number | null,
  ): Promise<void> {
    const logs: StatusLogData[] = [
      {
        fromStatus: null,
        toStatus: MaintenanceStatus.SCHEDULED,
        changedById: adminId,
        note: 'Mantenimiento programado',
        changedAt: new Date(maintenance.scheduledAt.getTime() - ONE_DAY_MS),
      },
      {
        fromStatus: MaintenanceStatus.SCHEDULED,
        toStatus: MaintenanceStatus.IN_PROGRESS,
        changedById: technicianId,
        note: null,
        changedAt: maintenance.startedAt ?? maintenance.scheduledAt,
      },
    ];
    if (maintenance.status === MaintenanceStatus.COMPLETED) {
      logs.push({
        fromStatus: MaintenanceStatus.IN_PROGRESS,
        toStatus: MaintenanceStatus.COMPLETED,
        changedById: technicianId,
        note: null,
        changedAt: maintenance.finishedAt ?? maintenance.estimatedEndAt,
      });
    }

    await manager.save(
      logs.map((log) =>
        manager.create(MaintenanceStatusLog, {
          ...log,
          maintenanceId: maintenance.id,
        }),
      ),
    );
  }

  /** Devuelve el registro existente o lo crea. El booleano indica si se creó. */
  private async findOrCreate<T extends ObjectLiteral>(
    manager: EntityManager,
    entity: EntityTarget<T>,
    where: NoInfer<FindOptionsWhere<T>>,
    // NoInfer: T se deduce solo de la entidad, no de los datos
    buildData: () => NoInfer<DeepPartial<T>> | Promise<NoInfer<DeepPartial<T>>>,
  ): Promise<[T, boolean]> {
    const existing = await manager.findOneBy(entity, where);
    if (existing) {
      this.stats.existing++;
      return [existing, false];
    }

    const created = await manager.save(
      entity,
      manager.create(entity, await buildData()),
    );
    this.stats.created++;
    return [created, true];
  }
}
