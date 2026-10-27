import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { map, Observable } from 'rxjs';

export interface SuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  timestamp: string;
}

/**
 * Envuelve toda respuesta exitosa en un formato uniforme:
 * { success, statusCode, data, timestamp }.
 * Los errores no pasan por aquí: los formatea AllExceptionsFilter.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        // statusCode se lee al final para respetar @HttpCode() (201, 200, ...)
        statusCode: response.statusCode,
        data: data ?? (null as T),
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
