import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  AuthenticatedRequest,
  JwtPayload,
} from '../interfaces/jwt-payload.interface';

/**
 * Guard global de autenticación. Toda ruta exige un JWT válido en
 * "Authorization: Bearer <token>", salvo las marcadas con @Public().
 *
 * Responde 401 cuando el token no existe, es inválido o ha expirado.
 * Si el token es válido, deja el payload en request.user para RolesGuard y @CurrentUser().
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Token de acceso no proporcionado');
    }

    try {
      request.user = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('El token de acceso ha expirado');
      }
      throw new UnauthorizedException('El token de acceso es inválido');
    }
    return true;
  }

  private extractBearerToken(request: AuthenticatedRequest): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' && token ? token : null;
  }
}
