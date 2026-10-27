import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleStatus } from './enums/vehicle-status.enum';
import { normalizePlate } from './plate.util';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepository: Repository<Vehicle>,
  ) {}

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    await this.ensurePlateIsAvailable(dto.plate);
    return this.vehiclesRepository.save(this.vehiclesRepository.create(dto));
  }

  findAll(status?: VehicleStatus): Promise<Vehicle[]> {
    return this.vehiclesRepository.find({
      where: { status },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepository.findOneBy({ id });
    if (!vehicle) {
      throw new NotFoundException(`No existe un vehículo con id ${id}`);
    }
    return vehicle;
  }

  async findByPlate(plate: string): Promise<Vehicle> {
    const normalizedPlate = normalizePlate(plate);
    const vehicle = await this.vehiclesRepository.findOneBy({
      plate: normalizedPlate,
    });
    if (!vehicle) {
      throw new NotFoundException(
        `No existe un vehículo con placa ${normalizedPlate}`,
      );
    }
    return vehicle;
  }

  async update(id: number, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (dto.plate && dto.plate !== vehicle.plate) {
      await this.ensurePlateIsAvailable(dto.plate);
    }
    if (dto.mileage !== undefined && dto.mileage < vehicle.mileage) {
      throw new BadRequestException(
        `El kilometraje no puede disminuir (actual: ${vehicle.mileage} km)`,
      );
    }

    return this.vehiclesRepository.save(
      this.vehiclesRepository.merge(vehicle, dto),
    );
  }

  /** Eliminación lógica: el vehículo queda INACTIVE y conserva su historial. */
  async deactivate(id: number): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (vehicle.status === VehicleStatus.INACTIVE) {
      throw new ConflictException(
        `El vehículo ${vehicle.plate} ya está inactivo`,
      );
    }
    if (vehicle.status === VehicleStatus.IN_MAINTENANCE) {
      throw new ConflictException(
        `El vehículo ${vehicle.plate} está en mantenimiento y no se puede inactivar`,
      );
    }

    vehicle.status = VehicleStatus.INACTIVE;
    return this.vehiclesRepository.save(vehicle);
  }

  async activate(id: number): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (vehicle.status !== VehicleStatus.INACTIVE) {
      throw new ConflictException(
        `El vehículo ${vehicle.plate} no está inactivo (estado actual: ${vehicle.status})`,
      );
    }

    vehicle.status = VehicleStatus.AVAILABLE;
    return this.vehiclesRepository.save(vehicle);
  }

  private async ensurePlateIsAvailable(plate: string): Promise<void> {
    if (await this.vehiclesRepository.existsBy({ plate })) {
      throw new ConflictException(
        `Ya existe un vehículo con la placa ${plate}`,
      );
    }
  }
}
