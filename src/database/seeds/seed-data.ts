import { Role } from '../../common/enums/role.enum';
import { MaintenanceStatus } from '../../modules/maintenances/enums/maintenance-status.enum';
import { MaintenanceType } from '../../modules/maintenances/enums/maintenance-type.enum';
import { VehicleStatus } from '../../modules/vehicles/enums/vehicle-status.enum';

/** Datos de prueba. Cada registro se identifica por un campo único para no duplicarlo. */

export const SEED_USERS = [
  {
    name: 'Administrador FleetCore',
    email: 'admin@fleetcore.com',
    password: 'Admin123*',
    role: Role.ADMIN,
  },
  {
    name: 'Carlos Pérez',
    email: 'carlos.perez@fleetcore.com',
    password: 'Tecnico123*',
    role: Role.TECHNICIAN,
  },
  {
    name: 'Laura Gómez',
    email: 'laura.gomez@fleetcore.com',
    password: 'Tecnico123*',
    role: Role.TECHNICIAN,
  },
];

export const SEED_MECHANICS = [
  {
    name: 'Carlos Pérez',
    email: 'carlos.perez@fleetcore.com',
    specialty: 'Motor y transmisión',
    isActive: true,
    userEmail: 'carlos.perez@fleetcore.com',
  },
  {
    name: 'Laura Gómez',
    email: 'laura.gomez@fleetcore.com',
    specialty: 'Frenos y suspensión',
    isActive: true,
    userEmail: 'laura.gomez@fleetcore.com',
  },
  {
    name: 'Andrés Ruiz',
    email: 'andres.ruiz@fleetcore.com',
    specialty: 'Sistema eléctrico',
    isActive: false,
    userEmail: null,
  },
];

export const SEED_WORKSHOPS = [
  {
    name: 'Taller Centro',
    address: 'Calle 50 # 45-20, Medellín',
    isActive: true,
  },
  {
    name: 'Taller Norte',
    address: 'Carrera 65 # 98-10, Medellín',
    isActive: false,
  },
];

export const SEED_VEHICLES = [
  {
    plate: 'ABC123',
    brand: 'Chevrolet',
    model: 'NPR',
    year: 2020,
    mileage: 52300,
    status: VehicleStatus.AVAILABLE,
  },
  {
    plate: 'DEF456',
    brand: 'Renault',
    model: 'Kangoo',
    year: 2022,
    mileage: 30500,
    status: VehicleStatus.AVAILABLE,
  },
  {
    plate: 'GHI789',
    brand: 'Hino',
    model: 'Dutro',
    year: 2019,
    mileage: 98000,
    status: VehicleStatus.IN_MAINTENANCE,
  },
  {
    plate: 'JKL012',
    brand: 'Ford',
    model: 'Cargo 1723',
    year: 2015,
    mileage: 210000,
    status: VehicleStatus.INACTIVE,
  },
];

export interface SeedMaintenance {
  vehiclePlate: string;
  mechanicEmail: string;
  workshopName: string;
  type: MaintenanceType;
  description: string;
  mileage: number;
  scheduledAt: string;
  estimatedEndAt: string;
  status: MaintenanceStatus.IN_PROGRESS | MaintenanceStatus.COMPLETED;
  startedAt: string;
  closing?: {
    workPerformed: string;
    finalCost: number;
    finishedAt: string;
    finalMileage: number;
  };
}

export const SEED_MAINTENANCES: SeedMaintenance[] = [
  {
    vehiclePlate: 'ABC123',
    mechanicEmail: 'carlos.perez@fleetcore.com',
    // El taller hoy está inactivo, pero el historial conserva dónde se hizo el trabajo
    workshopName: 'Taller Norte',
    type: MaintenanceType.PREVENTIVE,
    description: 'Cambio de aceite y filtros',
    mileage: 44800,
    scheduledAt: '2026-09-15T13:00:00.000Z',
    estimatedEndAt: '2026-09-15T16:00:00.000Z',
    status: MaintenanceStatus.COMPLETED,
    startedAt: '2026-09-15T13:05:00.000Z',
    closing: {
      workPerformed:
        'Cambio de aceite 15W-40, filtro de aceite y filtro de aire',
      finalCost: 350000,
      finishedAt: '2026-09-15T16:30:00.000Z',
      finalMileage: 45000,
    },
  },
  {
    vehiclePlate: 'ABC123',
    mechanicEmail: 'laura.gomez@fleetcore.com',
    workshopName: 'Taller Centro',
    type: MaintenanceType.CORRECTIVE,
    description: 'Reemplazo de pastillas de freno',
    mileage: 52250,
    scheduledAt: '2026-10-10T12:00:00.000Z',
    estimatedEndAt: '2026-10-10T14:00:00.000Z',
    status: MaintenanceStatus.COMPLETED,
    startedAt: '2026-10-10T12:00:00.000Z',
    closing: {
      workPerformed: 'Cambio de pastillas delanteras y rectificación de discos',
      finalCost: 480000,
      finishedAt: '2026-10-10T14:00:00.000Z',
      finalMileage: 52300,
    },
  },
  {
    // Mantenimiento en curso del vehículo IN_MAINTENANCE (7:30 a 10:00 hora Colombia)
    vehiclePlate: 'GHI789',
    mechanicEmail: 'laura.gomez@fleetcore.com',
    workshopName: 'Taller Centro',
    type: MaintenanceType.CORRECTIVE,
    description: 'Revisión de ruido en la suspensión delantera',
    mileage: 98000,
    scheduledAt: '2026-10-27T12:30:00.000Z',
    estimatedEndAt: '2026-10-27T15:00:00.000Z',
    status: MaintenanceStatus.IN_PROGRESS,
    startedAt: '2026-10-27T12:35:00.000Z',
  },
];
