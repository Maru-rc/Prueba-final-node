import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { Public } from './public.decorator';

/**
 * Protege una ruta de integraciones externas con el header x-api-key
 * en lugar del JWT: la marca como pública para el JwtAuthGuard y aplica ApiKeyGuard.
 */
export const ApiKeyAuth = () =>
  applyDecorators(
    Public(),
    UseGuards(ApiKeyGuard),
    ApiSecurity('api-key'),
    ApiUnauthorizedResponse({ description: 'API key ausente o inválida' }),
  );
