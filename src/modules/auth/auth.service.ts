import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { verifyPassword } from '../../common/utils/password.util';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * El registro público siempre crea técnicos. Los ADMIN se crean con
   * POST /users (por otro ADMIN) o con el seeder.
   */
  register(dto: RegisterDto): Promise<User> {
    return this.usersService.create({ ...dto, role: Role.TECHNICIAN });
  }

  async login({ email, password }: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(email);

    // Mismo mensaje si el email no existe o la contraseña falla, para no revelar cuál de los dos es
    if (!user || !(await verifyPassword(password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      tokenType: 'Bearer',
      expiresIn: this.config.getOrThrow<string>('JWT_EXPIRES_IN'),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  getProfile(userId: number): Promise<User> {
    return this.usersService.findById(userId);
  }
}
