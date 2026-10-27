import { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

const contextWithStatus = (statusCode: number) =>
  ({
    switchToHttp: () => ({ getResponse: () => ({ statusCode }) }),
  }) as unknown as ExecutionContext;

const handlerReturning = (data: unknown): CallHandler => ({
  handle: () => of(data),
});

describe('ResponseInterceptor', () => {
  const interceptor = new ResponseInterceptor();

  it('envuelve la respuesta en { success, statusCode, data, timestamp }', async () => {
    const result = await firstValueFrom(
      interceptor.intercept(
        contextWithStatus(201),
        handlerReturning({ id: 1 }),
      ),
    );

    expect(result).toEqual({
      success: true,
      statusCode: 201,
      data: { id: 1 },
      timestamp: expect.any(String),
    });
  });

  it('usa null cuando el handler no devuelve datos', async () => {
    const result = await firstValueFrom(
      interceptor.intercept(
        contextWithStatus(200),
        handlerReturning(undefined),
      ),
    );
    expect(result.data).toBeNull();
  });
});
