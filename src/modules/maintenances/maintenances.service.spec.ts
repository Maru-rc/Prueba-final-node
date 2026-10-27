import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityTarget } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { Mechanic } from '../mechanics/entities/mechanic.entity';
import { MechanicsService } from '../mechanics/mechanics.service';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { VehicleStatus } from '../vehicles/enums/vehicle-status.enum';
import { VehiclesService } from '../vehicles/vehicles.service';
import { Workshop } from '../workshops/entities/workshop.entity';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { MaintenanceStatusLog } from './entities/maintenance-status-log.entity';
import { Maintenance } from './entities/maintenance.entity';
import { MaintenanceStatus } from './enums/maintenance-status.enum';
import { MaintenanceType } from './enums/maintenance-type.enum';
import { MaintenancesService } from './maintenances.service';

const admin: JwtPayload = {
  sub: 1,
  email: 'admin@fleetcore.com',
  role: Role.ADMIN,
};
const laura: JwtPayload = {
  sub: 3,
  email: 'laura@fleetcore.com',
  role: Role.TECHNICIAN,
};

/** Datos en memoria que simulan la base de datos para cada prueba. */
interface FakeDb {
  vehicle: Vehicle | null;
  mechanic: Mechanic | null;
  workshop: Workshop | null;
  maintenance: Maintenance | null;
  vehicleActiveMaintenance: Maintenance | null;
  mechanicActiveMaintenances: Maintenance[];
}

const buildVehicle = (overrides: Partial<Vehicle> = {}) =>
  Object.assign(new Vehicle(), {
    id: 1,
    plate: 'ABC123',
    mileage: 50000,
    status: VehicleStatus.AVAILABLE,
    ...overrides,
  });

const buildMechanic = (overrides: Partial<Mechanic> = {}) =>
  Object.assign(new Mechanic(), {
    id: 2,
    name: 'Laura Gómez',
    isActive: true,
    userId: laura.sub,
    ...overrides,
  });

const buildWorkshop = (overrides: Partial<Workshop> = {}) =>
  Object.assign(new Workshop(), {
    id: 1,
    name: 'Taller Centro',
    isActive: true,
    ...overrides,
  });

const buildMaintenance = (overrides: Partial<Maintenance> = {}) =>
  Object.assign(new Maintenance(), {
    id: 10,
    mileage: 50000,
    status: MaintenanceStatus.IN_PROGRESS,
    scheduledAt: new Date('2026-10-28T07:30:00-05:00'),
    estimatedEndAt: new Date('2026-10-28T09:00:00-05:00'),
    vehicleId: 1,
    mechanicId: 2,
    workshopId: 1,
    ...overrides,
  });

const createDto = (overrides: Partial<CreateMaintenanceDto> = {}) =>
  Object.assign(new CreateMaintenanceDto(), {
    type: MaintenanceType.PREVENTIVE,
    description: 'Cambio de aceite',
    mileage: 50100,
    scheduledAt: '2026-10-28T07:30:00-05:00',
    estimatedEndAt: '2026-10-28T09:00:00-05:00',
    vehicleId: 1,
    mechanicId: 2,
    workshopId: 1,
    ...overrides,
  });

describe('MaintenancesService', () => {
  let service: MaintenancesService;
  let db: FakeDb;
  const saved: unknown[] = [];

  // EntityManager falso: responde según la entidad consultada y guarda lo que se le pasa
  const manager = {
    findOne: jest.fn((entity: EntityTarget<unknown>) => {
      if (entity === Vehicle) return db.vehicle;
      if (entity === Mechanic) return db.mechanic;
      if (entity === Maintenance) return db.maintenance;
      return null;
    }),
    findOneBy: jest.fn((entity: EntityTarget<unknown>) =>
      entity === Workshop ? db.workshop : db.vehicleActiveMaintenance,
    ),
    findOneByOrFail: jest.fn(() => db.mechanic),
    findBy: jest.fn(() => db.mechanicActiveMaintenances),
    create: jest.fn((_entity: unknown, data: object) => ({ ...data })),
    save: jest.fn((entity: object) => {
      saved.push(entity);
      return { id: 99, ...entity };
    }),
  };
  const maintenancesRepository = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    saved.length = 0;
    db = {
      vehicle: buildVehicle(),
      mechanic: buildMechanic(),
      workshop: buildWorkshop(),
      maintenance: buildMaintenance(),
      vehicleActiveMaintenance: null,
      mechanicActiveMaintenances: [],
    };
    maintenancesRepository.findOne.mockImplementation(() =>
      Promise.resolve(db.maintenance),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        MaintenancesService,
        {
          provide: DataSource,
          useValue: {
            transaction: (work: (m: typeof manager) => unknown) =>
              work(manager),
          },
        },
        {
          provide: getRepositoryToken(Maintenance),
          useValue: maintenancesRepository,
        },
        { provide: getRepositoryToken(MaintenanceStatusLog), useValue: {} },
        { provide: VehiclesService, useValue: {} },
        { provide: MechanicsService, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(MaintenancesService);
  });

  describe('create', () => {
    it('crea el mantenimiento en SCHEDULED y registra la auditoría', async () => {
      await service.create(createDto(), admin);

      expect(saved[0]).toMatchObject({
        status: MaintenanceStatus.SCHEDULED,
        vehicleId: 1,
        mechanicId: 2,
        workshopId: 1,
      });
      expect(saved[1]).toMatchObject({
        fromStatus: null,
        toStatus: MaintenanceStatus.SCHEDULED,
        changedById: admin.sub,
      });
    });

    it('rechaza un vehículo inexistente (404)', async () => {
      db.vehicle = null;
      await expect(service.create(createDto(), admin)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza un vehículo INACTIVE (409)', async () => {
      db.vehicle = buildVehicle({ status: VehicleStatus.INACTIVE });
      await expect(service.create(createDto(), admin)).rejects.toThrow(
        /está inactivo/,
      );
    });

    it('rechaza un mecánico inactivo (409)', async () => {
      db.mechanic = buildMechanic({ isActive: false });
      await expect(service.create(createDto(), admin)).rejects.toThrow(
        ConflictException,
      );
    });

    it('rechaza un taller inexistente (404) o inactivo (409)', async () => {
      db.workshop = null;
      await expect(service.create(createDto(), admin)).rejects.toThrow(
        NotFoundException,
      );

      db.workshop = buildWorkshop({ isActive: false });
      await expect(service.create(createDto(), admin)).rejects.toThrow(
        ConflictException,
      );
    });

    it('rechaza un kilometraje inferior al actual del vehículo (400)', async () => {
      await expect(
        service.create(createDto({ mileage: 49000 }), admin),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si el vehículo ya tiene un mantenimiento activo (409)', async () => {
      db.vehicleActiveMaintenance = buildMaintenance({ id: 7 });
      await expect(service.create(createDto(), admin)).rejects.toThrow(
        'El vehículo ABC123 ya tiene un mantenimiento activo (#7, IN_PROGRESS)',
      );
    });

    it('rechaza si el horario del mecánico se cruza con otro mantenimiento (409)', async () => {
      db.mechanicActiveMaintenances = [
        buildMaintenance({
          id: 8,
          scheduledAt: new Date('2026-10-28T08:00:00-05:00'),
          estimatedEndAt: new Date('2026-10-28T10:00:00-05:00'),
        }),
      ];
      await expect(service.create(createDto(), admin)).rejects.toThrow(
        /ya tiene el mantenimiento #8/,
      );
    });

    it('permite un mantenimiento que empieza justo cuando termina otro', async () => {
      db.mechanicActiveMaintenances = [
        buildMaintenance({
          scheduledAt: new Date('2026-10-28T06:00:00-05:00'),
          estimatedEndAt: new Date('2026-10-28T07:30:00-05:00'),
        }),
      ];
      await expect(service.create(createDto(), admin)).resolves.toBeDefined();
    });

    it('rechaza una franja cuyo fin no es posterior al inicio, sin consultar la base', async () => {
      await expect(
        service.create(
          createDto({ estimatedEndAt: '2026-10-28T07:30:00-05:00' }),
          admin,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(manager.findOne).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('al pasar a IN_PROGRESS el vehículo queda IN_MAINTENANCE', async () => {
      db.maintenance = buildMaintenance({
        status: MaintenanceStatus.SCHEDULED,
      });

      await service.updateStatus(
        10,
        { status: MaintenanceStatus.IN_PROGRESS },
        laura,
      );

      expect(db.vehicle?.status).toBe(VehicleStatus.IN_MAINTENANCE);
      expect(db.maintenance.status).toBe(MaintenanceStatus.IN_PROGRESS);
      expect(db.maintenance.startedAt).toBeInstanceOf(Date);
    });

    it('al completar guarda el cierre, deja el vehículo AVAILABLE y actualiza su kilometraje', async () => {
      await service.updateStatus(
        10,
        {
          status: MaintenanceStatus.COMPLETED,
          workPerformed: 'Cambio de aceite y filtros',
          finalCost: 350000,
          finishedAt: '2026-10-28T09:10:00-05:00',
          finalMileage: 50080,
        },
        laura,
      );

      expect(db.vehicle).toMatchObject({
        status: VehicleStatus.AVAILABLE,
        mileage: 50080,
      });
      expect(db.maintenance).toMatchObject({
        status: MaintenanceStatus.COMPLETED,
        finalCost: 350000,
        finalMileage: 50080,
      });
      expect(saved).toContainEqual(
        expect.objectContaining({
          fromStatus: MaintenanceStatus.IN_PROGRESS,
          toStatus: MaintenanceStatus.COMPLETED,
          changedById: laura.sub,
        }),
      );
    });

    it('no permite completar sin los datos de cierre (400)', async () => {
      await expect(
        service.updateStatus(
          10,
          { status: MaintenanceStatus.COMPLETED },
          laura,
        ),
      ).rejects.toThrow(/faltan los datos de cierre/);
      expect(db.vehicle?.status).toBe(VehicleStatus.AVAILABLE);
    });

    it('un COMPLETED no puede volver a IN_PROGRESS (409)', async () => {
      db.maintenance = buildMaintenance({
        status: MaintenanceStatus.COMPLETED,
      });
      await expect(
        service.updateStatus(
          10,
          { status: MaintenanceStatus.IN_PROGRESS },
          admin,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('un técnico no puede cambiar un mantenimiento que no le pertenece (403)', async () => {
      db.mechanic = buildMechanic({ userId: 999 });
      await expect(
        service.updateStatus(
          10,
          { status: MaintenanceStatus.CANCELLED },
          laura,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('responde 404 si el mantenimiento no existe', async () => {
      db.maintenance = null;
      await expect(
        service.updateStatus(
          10,
          { status: MaintenanceStatus.CANCELLED },
          admin,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
