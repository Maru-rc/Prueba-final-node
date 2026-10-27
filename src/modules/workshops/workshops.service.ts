import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { Workshop } from './entities/workshop.entity';

@Injectable()
export class WorkshopsService {
  constructor(
    @InjectRepository(Workshop)
    private readonly workshopsRepository: Repository<Workshop>,
  ) {}

  async create(dto: CreateWorkshopDto): Promise<Workshop> {
    await this.ensureNameIsAvailable(dto.name);
    return this.workshopsRepository.save(this.workshopsRepository.create(dto));
  }

  /** Por defecto solo devuelve los talleres activos. */
  findAll(includeInactive = false): Promise<Workshop[]> {
    return this.workshopsRepository.find({
      where: includeInactive ? {} : { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Workshop> {
    const workshop = await this.workshopsRepository.findOneBy({ id });
    if (!workshop) {
      throw new NotFoundException(`No existe un taller con id ${id}`);
    }
    return workshop;
  }

  async update(id: number, dto: UpdateWorkshopDto): Promise<Workshop> {
    const workshop = await this.findOne(id);
    if (dto.name && dto.name !== workshop.name) {
      await this.ensureNameIsAvailable(dto.name);
    }
    return this.workshopsRepository.save(
      this.workshopsRepository.merge(workshop, dto),
    );
  }

  activate(id: number): Promise<Workshop> {
    return this.setActive(id, true);
  }

  /** Un taller inactivo no recibe nuevos mantenimientos, pero conserva su historial. */
  deactivate(id: number): Promise<Workshop> {
    return this.setActive(id, false);
  }

  private async setActive(id: number, isActive: boolean): Promise<Workshop> {
    const workshop = await this.findOne(id);
    if (workshop.isActive === isActive) {
      throw new ConflictException(
        `El taller ${workshop.name} ya está ${isActive ? 'activo' : 'inactivo'}`,
      );
    }

    workshop.isActive = isActive;
    return this.workshopsRepository.save(workshop);
  }

  private async ensureNameIsAvailable(name: string): Promise<void> {
    if (await this.workshopsRepository.existsBy({ name })) {
      throw new ConflictException(`Ya existe un taller con el nombre ${name}`);
    }
  }
}
