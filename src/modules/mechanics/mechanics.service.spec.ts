import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Mechanic } from './entities/mechanic.entity';
import { MechanicsService } from './mechanics.service';

const buildUser = (role: Role): User =>
  Object.assign(new User(), { id: 5, email: 'tecnico@fleetcore.com', role });

describe('MechanicsService', () => {
  const repository = {
    existsBy: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((data: Partial<Mechanic>) => data),
    save: jest.fn((entity: Partial<Mechanic>) =>
      Promise.resolve({ id: 1, ...entity }),
    ),
    update: jest.fn(),
  };
  const usersService = { findById: jest.fn() };
  const service = new MechanicsService(
    repository as unknown as Repository<Mechanic>,
    usersService as unknown as UsersService,
  );
  const dto = {
    name: 'Sofía Herrera',
    email: 'sofia@fleetcore.com',
    specialty: 'Motor',
    userId: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.existsBy.mockResolvedValue(false);
    repository.findOneBy.mockResolvedValue(null);
    repository.findOne.mockResolvedValue({ id: 1, ...dto });
  });

  it('crea un mecánico vinculado a un usuario TECHNICIAN', async () => {
    usersService.findById.mockResolvedValue(buildUser(Role.TECHNICIAN));
    await expect(service.create(dto)).resolves.toMatchObject({ userId: 5 });
  });

  it('no vincula usuarios que no son TECHNICIAN (400)', async () => {
    usersService.findById.mockResolvedValue(buildUser(Role.ADMIN));
    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('no vincula un usuario que ya tiene perfil de mecánico (409)', async () => {
    usersService.findById.mockResolvedValue(buildUser(Role.TECHNICIAN));
    repository.findOneBy.mockResolvedValue({ id: 2, name: 'Laura Gómez' });
    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  it('no permite dos mecánicos con el mismo email (409)', async () => {
    repository.existsBy.mockResolvedValue(true);
    await expect(service.create(dto)).rejects.toThrow(
      'Ya existe un mecánico con el email sofia@fleetcore.com',
    );
  });

  it('responde 404 si el técnico no tiene perfil de mecánico', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.findByUserId(5)).rejects.toThrow(NotFoundException);
  });
});
