import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AllExceptionsFilter } from './all-exceptions.filter';

/** ArgumentsHost falso que captura el status y el cuerpo de la respuesta. */
function buildHost() {
  const result: { status?: number; body?: Record<string, unknown> } = {};
  const response = {
    status: (code: number) => {
      result.status = code;
      return response;
    },
    json: (body: Record<string, unknown>) => {
      result.body = body;
    },
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ method: 'POST', url: '/maintenances' }),
    }),
  } as unknown as ArgumentsHost;
  return { host, result };
}

const pgError = (code: string, detail?: string) =>
  new QueryFailedError(
    'INSERT ...',
    [],
    Object.assign(new Error('pg'), { code, detail }),
  );

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  it('devuelve el formato uniforme con código, mensaje, ruta y fecha', () => {
    const { host, result } = buildHost();
    filter.catch(
      new ConflictException(
        'El vehículo ABC123 ya tiene un mantenimiento activo',
      ),
      host,
    );

    expect(result.status).toBe(409);
    expect(result.body).toEqual({
      success: false,
      statusCode: 409,
      message: 'El vehículo ABC123 ya tiene un mantenimiento activo',
      path: '/maintenances',
      timestamp: expect.any(String),
    });
  });

  it('resume los errores de validación y los detalla en "errors" (en español)', () => {
    const { host, result } = buildHost();
    filter.catch(
      new BadRequestException([
        'name es obligatorio',
        'property role should not exist',
      ]),
      host,
    );

    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({
      message: 'Los datos enviados no son válidos',
      errors: ['name es obligatorio', 'role no es un campo permitido'],
    });
  });

  it('traduce los mensajes de Nest para rutas inexistentes', () => {
    const { host, result } = buildHost();
    filter.catch(new NotFoundException('Cannot GET /nada'), host);
    expect(result.body?.message).toBe('La ruta GET /nada no existe');
  });

  it('convierte la violación de unicidad de PostgreSQL en 409 y no en 500', () => {
    const { host, result } = buildHost();
    filter.catch(
      pgError('23505', 'Key (plate)=(ABC123) already exists.'),
      host,
    );

    expect(result.status).toBe(409);
    expect(result.body?.message).toContain(
      'Ya existe un registro con ese valor único',
    );
  });

  it('convierte un valor con formato inválido de PostgreSQL en 400', () => {
    const { host, result } = buildHost();
    filter.catch(pgError('22P02'), host);
    expect(result.status).toBe(400);
  });

  it('responde 500 genérico ante errores inesperados, sin exponer detalles', () => {
    const { host, result } = buildHost();
    filter.catch(new Error('conexión perdida con la base de datos'), host);

    expect(result.status).toBe(500);
    expect(result.body?.message).toBe('Error interno del servidor');
  });
});
