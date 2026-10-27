import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../common/enums/role.enum';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { hashPassword } from '../../common/utils/password.util';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const jwtService = new JwtService({ secret: 'secreto-de-prueba' });
  const config = { getOrThrow: () => '1h' } as unknown as ConfigService;
  const usersService = {
    create: jest.fn(),
    findByEmailWithPassword: jest.fn(),
  };
  const service = new AuthService(
    usersService as unknown as UsersService,
    jwtService,
    config,
  );
  let storedUser: User;

  beforeAll(async () => {
    storedUser = Object.assign(new User(), {
      id: 1,
      name: 'Administrador',
      email: 'admin@fleetcore.com',
      role: Role.ADMIN,
      password: await hashPassword('Admin123*'),
    });
  });

  beforeEach(() => jest.clearAllMocks());

  it('el registro público siempre crea usuarios TECHNICIAN', async () => {
    await service.register({
      name: 'Pedro',
      email: 'pedro@fleetcore.com',
      password: 'Pedro123*',
    });
    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: Role.TECHNICIAN }),
    );
  });

  it('con credenciales válidas devuelve un JWT con id, email y rol', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(storedUser);

    const result = await service.login({
      email: 'admin@fleetcore.com',
      password: 'Admin123*',
    });
    const payload = await jwtService.verifyAsync<JwtPayload>(
      result.accessToken,
    );

    expect(payload).toMatchObject({ sub: 1, role: Role.ADMIN });
    expect(result.user).not.toHaveProperty('password');
  });

  it('responde 401 con la contraseña incorrecta', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(storedUser);
    await expect(
      service.login({ email: 'admin@fleetcore.com', password: 'otra-clave' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('responde 401 con el mismo mensaje si el email no existe', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(null);
    await expect(
      service.login({ email: 'nadie@fleetcore.com', password: 'Admin123*' }),
    ).rejects.toThrow('Credenciales inválidas');
  });
});
