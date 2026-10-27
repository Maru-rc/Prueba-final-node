import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Declara qué roles pueden ejecutar una ruta. Lo valida RolesGuard.
 * Ejemplo: @Roles(Role.ADMIN)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
