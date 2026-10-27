import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { AuthenticatedRequest } from '../interfaces/jwt-payload.interface';

/**
 * Guard global de autorización. Se ejecuta después de JwtAuthGuard y compara
 * el rol del usuario autenticado con los roles declarados en @Roles().
 *
 * Si la ruta no declara roles, basta con estar autenticado.
 * Si el rol no está permitido, responde 403.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `No tienes permisos para esta acción. Roles permitidos: ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
}
