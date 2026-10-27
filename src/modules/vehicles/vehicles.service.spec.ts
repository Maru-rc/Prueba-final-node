import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Maintenance } from '../maintenances/entities/maintenance.entity';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleStatus } from './enums/vehicle-status.enum';
import { VehiclesService } from './vehicles.service';

const buildVehicle = (overrides: Partial<Vehicle> = {}): Vehicle =>
  Object.assign(new Vehicle(), {
    id: 1,
    plate: 'ABC123',
    brand: 'Chevrolet',
    model: 'NPR',
    year: 2020,
    mileage: 50000,
    status: VehicleStatus.AVAILABLE,
    ...overrides,
  });

describe('VehiclesService', () => {
  const vehiclesRepository = {
    existsBy: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    create: jest.fn((data: Partial<Vehicle>) => data),
    merge: jest.fn((entity: Vehicle, data: Partial<Vehicle>) =>
      Object.assign(entity, data),
    ),
    save: jest.fn((entity: Vehicle) => Promise.resolve(entity)),
  };
  const maintenancesRepository = { existsBy: jest.fn() };
  const service = new VehiclesService(
    vehiclesRepository as unknown as Repository<Vehicle>,
    maintenancesRepository as unknown as Repository<Maintenance>,
  );

  beforeEach(() => jest.clearAllMocks());

  it('no permite registrar dos vehículos con la misma placa (409)', async () => {
    vehiclesRepository.existsBy.mockResolvedValue(true);
    await expect(
      service.create({
        plate: 'ABC123',
        brand: 'Kia',
        model: 'K2700',
        year: 2021,
        mileage: 0,
      }),
    ).rejects.toThrow('Ya existe un vehículo con la placa ABC123');
  });

  it('busca por placa normalizada (mayúsculas y sin espacios)', async () => {
    vehiclesRepository.findOneBy.mockResolvedValue(buildVehicle());
    await service.findByPlate(' abc 123 ');
    expect(vehiclesRepository.findOneBy).toHaveBeenCalledWith({
      plate: 'ABC123',
    });
  });

  it('responde 404 si el vehículo no existe', async () => {
    vehiclesRepository.findOneBy.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
  });

  it('no permite disminuir el kilometraje (400)', async () => {
    vehiclesRepository.findOneBy.mockResolvedValue(buildVehicle());
    await expect(service.update(1, { mileage: 100 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('inactiva el vehículo (eliminación lógica) si no tiene mantenimientos activos', async () => {
    vehiclesRepository.findOneBy.mockResolvedValue(buildVehicle());
    maintenancesRepository.existsBy.mockResolvedValue(false);

    const result = await service.deactivate(1);
    expect(result.status).toBe(VehicleStatus.INACTIVE);
  });

  it('no inactiva un vehículo con mantenimientos activos (409)', async () => {
    vehiclesRepository.findOneBy.mockResolvedValue(buildVehicle());
    maintenancesRepository.existsBy.mockResolvedValue(true);

    await expect(service.deactivate(1)).rejects.toThrow(ConflictException);
  });

  it('solo reactiva vehículos que están INACTIVE', async () => {
    vehiclesRepository.findOneBy.mockResolvedValue(buildVehicle());
    await expect(service.activate(1)).rejects.toThrow(/no está inactivo/);

    vehiclesRepository.findOneBy.mockResolvedValue(
      buildVehicle({ status: VehicleStatus.INACTIVE }),
    );
    await expect(service.activate(1)).resolves.toMatchObject({
      status: VehicleStatus.AVAILABLE,
    });
  });
});
