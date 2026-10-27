import { Request } from 'express';
import { Role } from '../enums/role.enum';

/** Datos que viajan dentro del JWT. */
export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}

/** Request de Express con el usuario que JwtAuthGuard dejó autenticado. */
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
