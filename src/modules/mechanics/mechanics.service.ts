import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { UsersService } from '../users/users.service';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import { Mechanic } from './entities/mechanic.entity';

@Injectable()
export class MechanicsService {
  constructor(
    @InjectRepository(Mechanic)
    private readonly mechanicsRepository: Repository<Mechanic>,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateMechanicDto): Promise<Mechanic> {
    await this.ensureEmailIsAvailable(dto.email);
    if (dto.userId) {
      await this.ensureUserCanBeLinked(dto.userId);
    }

    const saved = await this.mechanicsRepository.save(
      this.mechanicsRepository.create(dto),
    );
    return this.findOne(saved.id);
  }

  findAll(isActive?: boolean): Promise<Mechanic[]> {
    return this.mechanicsRepository.find({
      where: { isActive },
      relations: { user: true },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Mechanic> {
    const mechanic = await this.mechanicsRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!mechanic) {
      throw new NotFoundException(`No existe un mecánico con id ${id}`);
    }
    return mechanic;
  }

  /** Perfil de mecánico del técnico autenticado. */
  async findByUserId(userId: number): Promise<Mechanic> {
    const mechanic = await this.mechanicsRepository.findOne({
      where: { userId },
      relations: { user: true },
    });
    if (!mechanic) {
      throw new NotFoundException(
        'Tu usuario no tiene un perfil de mecánico asociado',
      );
    }
    return mechanic;
  }

  async update(id: number, dto: UpdateMechanicDto): Promise<Mechanic> {
    const mechanic = await this.findOne(id);

    if (dto.email && dto.email !== mechanic.email) {
      await this.ensureEmailIsAvailable(dto.email);
    }
    if (dto.userId && dto.userId !== mechanic.userId) {
      await this.ensureUserCanBeLinked(dto.userId);
    }

    // update() escribe las columnas directamente (incluido userId) sin pasar por la relación cargada
    if (Object.keys(dto).length > 0) {
      await this.mechanicsRepository.update(id, dto);
    }
    return this.findOne(id);
  }

  async activate(id: number): Promise<Mechanic> {
    return this.setActive(id, true);
  }

  /** Un mecánico inactivo no recibe nuevos mantenimientos, pero conserva su historial. */
  async deactivate(id: number): Promise<Mechanic> {
    return this.setActive(id, false);
  }

  private async setActive(id: number, isActive: boolean): Promise<Mechanic> {
    const mechanic = await this.findOne(id);
    if (mechanic.isActive === isActive) {
      throw new ConflictException(
        `El mecánico ${mechanic.name} ya está ${isActive ? 'activo' : 'inactivo'}`,
      );
    }

    mechanic.isActive = isActive;
    return this.mechanicsRepository.save(mechanic);
  }

  private async ensureEmailIsAvailable(email: string): Promise<void> {
    if (await this.mechanicsRepository.existsBy({ email })) {
      throw new ConflictException(
        `Ya existe un mecánico con el email ${email}`,
      );
    }
  }

  /** Solo se vinculan usuarios TECHNICIAN que no tengan ya otro perfil de mecánico. */
  private async ensureUserCanBeLinked(userId: number): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (user.role !== Role.TECHNICIAN) {
      throw new BadRequestException(
        `El usuario ${user.email} no tiene rol TECHNICIAN y no puede vincularse a un mecánico`,
      );
    }

    const linkedMechanic = await this.mechanicsRepository.findOneBy({ userId });
    if (linkedMechanic) {
      throw new ConflictException(
        `El usuario ${user.email} ya está vinculado al mecánico ${linkedMechanic.name}`,
      );
    }
  }
}
