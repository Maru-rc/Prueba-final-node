import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

interface ErrorDetails {
  statusCode: number;
  message: string;
  errors?: string[];
}

/** Códigos de error de PostgreSQL que se traducen a errores del cliente. */
const PG_ERROR = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  INVALID_TEXT_REPRESENTATION: '22P02',
} as const;

/** Mensajes que Nest y class-validator generan en inglés, traducidos para responder siempre en español. */
const FRAMEWORK_MESSAGES: ReadonlyArray<[RegExp, string]> = [
  [/^property (.+) should not exist$/, '$1 no es un campo permitido'],
  [/^Cannot (\S+) (.+)$/, 'La ruta $1 $2 no existe'],
  [/^.*\bJSON\b.*$/, 'El cuerpo de la solicitud no es un JSON válido'],
];

function translateFrameworkMessage(message: string): string {
  const match = FRAMEWORK_MESSAGES.find(([pattern]) => pattern.test(message));
  return match ? message.replace(match[0], match[1]) : message;
}

/**
 * Filtro global de errores. Toda excepción sale con el mismo formato:
 * { success: false, statusCode, message, path, timestamp }.
 *
 * Los errores de validación, autenticación, autorización, recursos inexistentes
 * y conflictos (incluidos los de unicidad de la base de datos) se traducen a su
 * código 4xx; solo los errores inesperados terminan en 500.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, errors } = this.resolve(exception);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      ...(errors && { errors }),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolve(exception: unknown): ErrorDetails {
    if (exception instanceof HttpException) {
      return this.resolveHttpException(exception);
    }
    if (exception instanceof QueryFailedError) {
      return this.resolveDatabaseError(exception);
    }
    if (exception instanceof EntityNotFoundError) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Recurso no encontrado',
      };
    }
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
    };
  }

  private resolveHttpException(exception: HttpException): ErrorDetails {
    const statusCode = exception.getStatus();
    const body = exception.getResponse();

    if (typeof body === 'string') {
      return { statusCode, message: translateFrameworkMessage(body) };
    }

    const { message } = body as { message?: string | string[] };
    // El ValidationPipe envía un arreglo con un mensaje por cada campo inválido
    if (Array.isArray(message)) {
      return {
        statusCode,
        message: 'Los datos enviados no son válidos',
        errors: message.map(translateFrameworkMessage),
      };
    }
    return {
      statusCode,
      message: translateFrameworkMessage(message ?? exception.message),
    };
  }

  private resolveDatabaseError(error: QueryFailedError): ErrorDetails {
    const { code, detail } = error.driverError as {
      code?: string;
      detail?: string;
    };

    switch (code) {
      case PG_ERROR.UNIQUE_VIOLATION:
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `Ya existe un registro con ese valor único${detail ? `: ${detail}` : ''}`,
        };
      case PG_ERROR.FOREIGN_KEY_VIOLATION:
        return {
          statusCode: HttpStatus.CONFLICT,
          message:
            'La operación afecta un registro relacionado que no existe o está en uso',
        };
      case PG_ERROR.NOT_NULL_VIOLATION:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Falta un campo obligatorio',
        };
      case PG_ERROR.INVALID_TEXT_REPRESENTATION:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Uno de los valores tiene un formato inválido',
        };
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno del servidor',
        };
    }
  }
}
