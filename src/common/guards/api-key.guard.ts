import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

/**
 * Guard para integraciones externas: exige el header x-api-key con una de las
 * claves definidas en la variable de entorno API_KEYS (separadas por coma).
 * Responde 401 si el header falta o la clave es incorrecta.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly validKeys: string[];

  constructor(config: ConfigService) {
    this.validKeys = config
      .getOrThrow<string>('API_KEYS')
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean);
  }

  canActivate(context: ExecutionContext): boolean {
    const apiKey = context
      .switchToHttp()
      .getRequest<Request>()
      .header('x-api-key');

    if (!apiKey) {
      throw new UnauthorizedException(
        'API key no proporcionada (header x-api-key)',
      );
    }
    if (!this.validKeys.some((validKey) => this.safeEqual(validKey, apiKey))) {
      throw new UnauthorizedException('API key inválida');
    }
    return true;
  }

  // Comparación en tiempo constante: no revela por el tiempo de respuesta cuántos caracteres coinciden
  private safeEqual(expected: string, received: string): boolean {
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    return (
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer)
    );
  }
}
