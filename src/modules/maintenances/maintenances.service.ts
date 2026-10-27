import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { Mechanic } from '../mechanics/entities/mechanic.entity';
import { MechanicsService } from '../mechanics/mechanics.service';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { VehicleStatus } from '../vehicles/enums/vehicle-status.enum';
import { VehiclesService } from '../vehicles/vehicles.service';
import { Workshop } from '../workshops/entities/workshop.entity';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { MaintenanceQueryDto } from './dto/maintenance-query.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { MaintenanceStatusLog } from './entities/maintenance-status-log.entity';
import { Maintenance } from './entities/maintenance.entity';
import {
  ACTIVE_MAINTENANCE_STATUSES,
  MaintenanceStatus,
} from './enums/maintenance-status.enum';
import {
  assertClosingData,
  assertValidTransition,
  schedulesOverlap,
  vehicleStatusAfterTransition,
} from './maintenance-status.rules';

const FULL_RELATIONS = { vehicle: true, mechanic: true, workshop: true };

@Injectable()
export class MaintenancesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Maintenance)
    private readonly maintenancesRepository: Repository<Maintenance>,
    @InjectRepository(MaintenanceStatusLog)
    private readonly statusLogsRepository: Repository<MaintenanceStatusLog>,
    private readonly vehiclesService: VehiclesService,
    private readonly mechanicsService: MechanicsService,
  ) {}

  /**
   * Crea un mantenimiento en estado SCHEDULED validando las reglas de negocio.
   *
   * Transacción: las validaciones y el INSERT ocurren juntos. El vehículo y el mecánico
   * se bloquean (SELECT ... FOR UPDATE), así que si llegan dos solicitudes a la vez para
   * el mismo vehículo o mecánico, la segunda espera y valida con los datos ya actualizados:
   * no pueden quedar dos mantenimientos activos ni horarios cruzados.
   */
  async create(
    dto: CreateMaintenanceDto,
    createdBy: JwtPayload,
  ): Promise<Maintenance> {
    const scheduledAt = new Date(dto.scheduledAt);
    const estimatedEndAt = new Date(dto.estimatedEndAt);
    if (estimatedEndAt <= scheduledAt) {
      throw new BadRequestException(
        'estimatedEndAt debe ser posterior a scheduledAt',
      );
    }

    const maintenanceId = await this.dataSource.transaction(async (manager) => {
      const vehicle = await this.lockVehicle(manager, dto.vehicleId);
      if (vehicle.status === VehicleStatus.INACTIVE) {
        throw new ConflictException(
          `El vehículo ${vehicle.plate} está inactivo y no puede asociarse a un mantenimiento`,
        );
      }

      const mechanic = await manager.findOne(Mechanic, {
        where: { id: dto.mechanicId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!mechanic) {
        throw new NotFoundException(
          `No existe un mecánico con id ${dto.mechanicId}`,
        );
      }
      if (!mechanic.isActive) {
        throw new ConflictException(
          `El mecánico ${mechanic.name} está inactivo y no puede asignarse`,
        );
      }

      const workshop = await manager.findOneBy(Workshop, {
        id: dto.workshopId,
      });
      if (!workshop) {
        throw new NotFoundException(
          `No existe un taller con id ${dto.workshopId}`,
        );
      }
      if (!workshop.isActive) {
        throw new ConflictException(
          `El taller ${workshop.name} está inactivo y no puede asignarse`,
        );
      }

      if (dto.mileage < vehicle.mileage) {
        throw new BadRequestException(
          `El kilometraje (${dto.mileage} km) no puede ser inferior al actual del vehículo ${vehicle.plate} (${vehicle.mileage} km)`,
        );
      }

      await this.ensureVehicleHasNoActiveMaintenance(manager, vehicle);
      await this.ensureMechanicIsAvailable(
        manager,
        mechanic,
        scheduledAt,
        estimatedEndAt,
      );

      const maintenance = await manager.save(
        manager.create(Maintenance, {
          type: dto.type,
          description: dto.description,
          mileage: dto.mileage,
          scheduledAt,
          estimatedEndAt,
          status: MaintenanceStatus.SCHEDULED,
          vehicleId: vehicle.id,
          mechanicId: mechanic.id,
          workshopId: workshop.id,
        }),
      );
      await this.logStatusChange(manager, {
        maintenanceId: maintenance.id,
        fromStatus: null,
        toStatus: MaintenanceStatus.SCHEDULED,
        changedById: createdBy.sub,
        note: 'Mantenimiento programado',
      });
      return maintenance.id;
    });

    return this.findOneOrFail(maintenanceId);
  }

  findAll(query: MaintenanceQueryDto): Promise<Maintenance[]> {
    return this.maintenancesRepository.find({
      where: { status: query.status, type: query.type },
      relations: FULL_RELATIONS,
      order: { scheduledAt: 'DESC' },
    });
  }

  findActive(): Promise<Maintenance[]> {
    return this.maintenancesRepository.find({
      where: { status: In(ACTIVE_MAINTENANCE_STATUSES) },
      relations: FULL_RELATIONS,
      order: { scheduledAt: 'ASC' },
    });
  }

  async findByVehicle(vehicleId: number): Promise<Maintenance[]> {
    await this.vehiclesService.findOne(vehicleId);
    return this.maintenancesRepository.find({
      where: { vehicleId },
      relations: { mechanic: true, workshop: true },
      order: { scheduledAt: 'DESC' },
    });
  }

  async findByMechanic(mechanicId: number): Promise<Maintenance[]> {
    await this.mechanicsService.findOne(mechanicId);
    return this.maintenancesRepository.find({
      where: { mechanicId },
      relations: { vehicle: true, workshop: true },
      order: { scheduledAt: 'DESC' },
    });
  }

  /** Mantenimientos asignados al técnico autenticado, con el taller donde debe realizarlos. */
  async findAssignedToUser(
    userId: number,
    query: MaintenanceQueryDto,
  ): Promise<Maintenance[]> {
    const mechanic = await this.mechanicsService.findByUserId(userId);
    return this.maintenancesRepository.find({
      where: {
        mechanicId: mechanic.id,
        status: query.status,
        type: query.type,
      },
      relations: { vehicle: true, workshop: true },
      order: { scheduledAt: 'ASC' },
    });
  }

  async findOne(id: number, user: JwtPayload): Promise<Maintenance> {
    const maintenance = await this.findOneOrFail(id);
    this.ensureTechnicianIsAssigned(maintenance.mechanic, user);
    return maintenance;
  }

  async getVehicleHistory(vehicleId: number) {
    const vehicle = await this.vehiclesService.findOne(vehicleId);
    return this.buildVehicleHistory(vehicle);
  }

  async getVehicleHistoryByPlate(plate: string) {
    const vehicle = await this.vehiclesService.findByPlate(plate);
    return this.buildVehicleHistory(vehicle);
  }

  /**
   * Cambia el estado de un mantenimiento aplicando las reglas de transición
   * y sus efectos sobre el vehículo (IN_MAINTENANCE / AVAILABLE).
   *
   * Transacción: el mantenimiento, el vehículo y el registro de auditoría se guardan
   * juntos; si algo falla no queda el mantenimiento en un estado y el vehículo en otro.
   * El mantenimiento se bloquea para que dos cambios simultáneos no se pisen.
   */
  async updateStatus(
    id: number,
    dto: UpdateMaintenanceStatusDto,
    user: JwtPayload,
  ): Promise<Maintenance> {
    await this.dataSource.transaction(async (manager) => {
      const maintenance = await manager.findOne(Maintenance, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!maintenance) {
        throw new NotFoundException(`No existe un mantenimiento con id ${id}`);
      }

      const mechanic = await manager.findOneByOrFail(Mechanic, {
        id: maintenance.mechanicId,
      });
      this.ensureTechnicianIsAssigned(mechanic, user);

      const fromStatus = maintenance.status;
      const toStatus = dto.status;
      assertValidTransition(fromStatus, toStatus);

      const vehicle = await this.lockVehicle(manager, maintenance.vehicleId);

      if (toStatus === MaintenanceStatus.IN_PROGRESS) {
        if (vehicle.status === VehicleStatus.INACTIVE) {
          throw new ConflictException(
            `El vehículo ${vehicle.plate} está inactivo y no puede entrar a mantenimiento`,
          );
        }
        maintenance.startedAt = new Date();
      }

      if (toStatus === MaintenanceStatus.COMPLETED) {
        this.applyClosingData(maintenance, vehicle, dto);
      }

      const nextVehicleStatus = vehicleStatusAfterTransition(
        fromStatus,
        toStatus,
      );
      if (nextVehicleStatus) {
        vehicle.status = nextVehicleStatus;
      }
      maintenance.status = toStatus;

      await manager.save(vehicle);
      await manager.save(maintenance);
      await this.logStatusChange(manager, {
        maintenanceId: maintenance.id,
        fromStatus,
        toStatus,
        changedById: user.sub,
        note: dto.note ?? null,
      });
    });

    return this.findOneOrFail(id);
  }

  /** Auditoría de un mantenimiento: todos sus cambios de estado en orden cronológico. */
  async findStatusLogs(maintenanceId: number): Promise<MaintenanceStatusLog[]> {
    await this.findOneOrFail(maintenanceId);
    return this.statusLogsRepository.find({
      where: { maintenanceId },
      relations: { changedBy: true },
      order: { changedAt: 'ASC', id: 'ASC' },
    });
  }

  /** Auditoría general: últimos cambios de estado de todos los mantenimientos. */
  findAllStatusLogs(): Promise<MaintenanceStatusLog[]> {
    return this.statusLogsRepository.find({
      relations: { changedBy: true },
      order: { changedAt: 'DESC', id: 'DESC' },
    });
  }

  private async findOneOrFail(id: number): Promise<Maintenance> {
    const maintenance = await this.maintenancesRepository.findOne({
      where: { id },
      relations: FULL_RELATIONS,
    });
    if (!maintenance) {
      throw new NotFoundException(`No existe un mantenimiento con id ${id}`);
    }
    return maintenance;
  }

  private async lockVehicle(
    manager: EntityManager,
    vehicleId: number,
  ): Promise<Vehicle> {
    const vehicle = await manager.findOne(Vehicle, {
      where: { id: vehicleId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!vehicle) {
      throw new NotFoundException(`No existe un vehículo con id ${vehicleId}`);
    }
    return vehicle;
  }

  private async ensureVehicleHasNoActiveMaintenance(
    manager: EntityManager,
    vehicle: Vehicle,
  ): Promise<void> {
    const activeMaintenance = await manager.findOneBy(Maintenance, {
      vehicleId: vehicle.id,
      status: In(ACTIVE_MAINTENANCE_STATUSES),
    });
    if (activeMaintenance) {
      throw new ConflictException(
        `El vehículo ${vehicle.plate} ya tiene un mantenimiento activo (#${activeMaintenance.id}, ${activeMaintenance.status})`,
      );
    }
  }

  /** El mecánico no puede tener otro mantenimiento activo que se cruce en horario, en ningún taller. */
  private async ensureMechanicIsAvailable(
    manager: EntityManager,
    mechanic: Mechanic,
    start: Date,
    end: Date,
  ): Promise<void> {
    const activeMaintenances = await manager.findBy(Maintenance, {
      mechanicId: mechanic.id,
      status: In(ACTIVE_MAINTENANCE_STATUSES),
    });
    const conflict = activeMaintenances.find((m) =>
      schedulesOverlap(start, end, m.scheduledAt, m.estimatedEndAt),
    );
    if (conflict) {
      throw new ConflictException(
        `El mecánico ${mechanic.name} ya tiene el mantenimiento #${conflict.id} entre ${conflict.scheduledAt.toISOString()} y ${conflict.estimatedEndAt.toISOString()}`,
      );
    }
  }

  /** Valida y registra los datos obligatorios de cierre; actualiza el kilometraje del vehículo. */
  private applyClosingData(
    maintenance: Maintenance,
    vehicle: Vehicle,
    dto: UpdateMaintenanceStatusDto,
  ): void {
    assertClosingData(dto);

    const finishedAt = new Date(dto.finishedAt);
    if (finishedAt < maintenance.scheduledAt) {
      throw new BadRequestException(
        'finishedAt no puede ser anterior a la fecha programada del mantenimiento',
      );
    }
    if (dto.finalMileage < maintenance.mileage) {
      throw new BadRequestException(
        `finalMileage (${dto.finalMileage} km) no puede ser inferior al kilometraje de ingreso (${maintenance.mileage} km)`,
      );
    }

    maintenance.workPerformed = dto.workPerformed;
    maintenance.finalCost = dto.finalCost;
    maintenance.finishedAt = finishedAt;
    maintenance.finalMileage = dto.finalMileage;
    vehicle.mileage = Math.max(vehicle.mileage, dto.finalMileage);
  }

  /** Un técnico solo puede ver y actualizar los mantenimientos asignados a su perfil de mecánico. */
  private ensureTechnicianIsAssigned(mechanic: Mechanic, user: JwtPayload) {
    if (user.role === Role.TECHNICIAN && mechanic.userId !== user.sub) {
      throw new ForbiddenException('Este mantenimiento no está asignado a ti');
    }
  }

  private logStatusChange(
    manager: EntityManager,
    log: Pick<
      MaintenanceStatusLog,
      'maintenanceId' | 'fromStatus' | 'toStatus' | 'changedById' | 'note'
    >,
  ): Promise<MaintenanceStatusLog> {
    return manager.save(manager.create(MaintenanceStatusLog, log));
  }

  /** Historial = mantenimientos COMPLETED del vehículo, del más reciente al más antiguo. */
  private async buildVehicleHistory(vehicle: Vehicle) {
    const completed = await this.maintenancesRepository.find({
      where: { vehicleId: vehicle.id, status: MaintenanceStatus.COMPLETED },
      relations: { mechanic: true, workshop: true },
      order: { finishedAt: 'DESC' },
    });

    return {
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        mileage: vehicle.mileage,
        status: vehicle.status,
        available: vehicle.status === VehicleStatus.AVAILABLE,
      },
      maintenances: completed.map((m) => ({
        id: m.id,
        type: m.type,
        status: m.status,
        description: m.description,
        workPerformed: m.workPerformed,
        mileage: m.finalMileage,
        cost: m.finalCost,
        finishedAt: m.finishedAt,
        mechanic: { id: m.mechanic.id, name: m.mechanic.name },
        workshop: { id: m.workshop.id, name: m.workshop.name },
      })),
    };
  }
}
