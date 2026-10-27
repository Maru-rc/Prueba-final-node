import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ApiKeyGuard } from './api-key.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

/** Crea un ExecutionContext falso con los headers y el usuario indicados. */
function buildContext(
  request: { headers?: Record<string, string>; user?: JwtPayload } = {},
): { context: ExecutionContext; request: { user?: JwtPayload } } {
  const req = {
    headers: request.headers ?? {},
    user: request.user,
    header: (name: string) => request.headers?.[name.toLowerCase()],
  };
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
  return { context, request: req };
}

/** Reflector falso que devuelve la metadata indicada para cada clave. */
const reflectorWith = (metadata: Record<string, unknown>) =>
  ({
    getAllAndOverride: (key: string) => metadata[key],
  }) as unknown as Reflector;

const payload: JwtPayload = {
  sub: 1,
  email: 'admin@fleetcore.com',
  role: Role.ADMIN,
};

describe('JwtAuthGuard', () => {
  const jwtService = new JwtService({ secret: 'secreto-de-prueba' });

  it('deja pasar las rutas @Public() sin token', async () => {
    const guard = new JwtAuthGuard(
      jwtService,
      reflectorWith({ [IS_PUBLIC_KEY]: true }),
    );
    await expect(guard.canActivate(buildContext().context)).resolves.toBe(true);
  });

  it('responde 401 si no hay token', async () => {
    const guard = new JwtAuthGuard(jwtService, reflectorWith({}));
    await expect(guard.canActivate(buildContext().context)).rejects.toThrow(
      'Token de acceso no proporcionado',
    );
  });

  it('responde 401 si el token es inválido', async () => {
    const guard = new JwtAuthGuard(jwtService, reflectorWith({}));
    const { context } = buildContext({
      headers: { authorization: 'Bearer no-es-un-jwt' },
    });
    await expect(guard.canActivate(context)).rejects.toThrow(
      'El token de acceso es inválido',
    );
  });

  it('responde 401 si el token expiró', async () => {
    const guard = new JwtAuthGuard(jwtService, reflectorWith({}));
    const expired = await jwtService.signAsync(payload, { expiresIn: -10 });
    const { context } = buildContext({
      headers: { authorization: `Bearer ${expired}` },
    });
    await expect(guard.canActivate(context)).rejects.toThrow(
      'El token de acceso ha expirado',
    );
  });

  it('con un token válido deja el payload en request.user', async () => {
    const guard = new JwtAuthGuard(jwtService, reflectorWith({}));
    const token = await jwtService.signAsync(payload);
    const { context, request } = buildContext({
      headers: { authorization: `Bearer ${token}` },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toMatchObject(payload);
  });
});

describe('RolesGuard', () => {
  it('permite el acceso si la ruta no declara roles', () => {
    const guard = new RolesGuard(reflectorWith({}));
    expect(guard.canActivate(buildContext({ user: payload }).context)).toBe(
      true,
    );
  });

  it('permite el acceso si el usuario tiene uno de los roles', () => {
    const guard = new RolesGuard(
      reflectorWith({ [ROLES_KEY]: [Role.ADMIN, Role.TECHNICIAN] }),
    );
    expect(guard.canActivate(buildContext({ user: payload }).context)).toBe(
      true,
    );
  });

  it('responde 403 si el rol no está permitido', () => {
    const guard = new RolesGuard(reflectorWith({ [ROLES_KEY]: [Role.ADMIN] }));
    const technician = { ...payload, role: Role.TECHNICIAN };
    expect(() =>
      guard.canActivate(buildContext({ user: technician }).context),
    ).toThrow(ForbiddenException);
  });
});

describe('ApiKeyGuard', () => {
  const config = {
    getOrThrow: () => 'clave-1, clave-2',
  } as unknown as ConfigService;
  const guard = new ApiKeyGuard(config);

  it('acepta cualquiera de las claves de API_KEYS', () => {
    const { context } = buildContext({ headers: { 'x-api-key': 'clave-2' } });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('responde 401 si falta el header x-api-key', () => {
    expect(() => guard.canActivate(buildContext().context)).toThrow(
      UnauthorizedException,
    );
  });

  it('responde 401 si la clave es incorrecta', () => {
    const { context } = buildContext({
      headers: { 'x-api-key': 'clave-falsa' },
    });
    expect(() => guard.canActivate(context)).toThrow('API key inválida');
  });
});
