import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashPassword } from '../../common/utils/password.util';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    if (await this.usersRepository.existsBy({ email: dto.email })) {
      throw new ConflictException(
        `Ya existe un usuario con el email ${dto.email}`,
      );
    }

    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      role: dto.role,
      password: await hashPassword(dto.password),
    });
    const saved = await this.usersRepository.save(user);
    // Se vuelve a consultar para no devolver el hash de la contraseña
    return this.findById(saved.id);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { id: 'ASC' } });
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`No existe un usuario con id ${id}`);
    }
    return user;
  }

  /** Incluye el hash de la contraseña: solo debe usarse para validar credenciales. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }
}
