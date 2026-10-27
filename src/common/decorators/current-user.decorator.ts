import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  AuthenticatedRequest,
  JwtPayload,
} from '../interfaces/jwt-payload.interface';

/**
 * Inyecta en el handler el usuario autenticado (payload del JWT).
 * Ejemplos: @CurrentUser() user  |  @CurrentUser('sub') userId
 */
export const CurrentUser = createParamDecorator(
  (field: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return field ? request.user?.[field] : request.user;
  },
);
