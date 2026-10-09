import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../domain/value-objects/user-role.enum';
import { AuthenticatedUser } from './jwt.strategy';
import { ROLES_KEY } from './roles.decorator';

/** Runs after JwtAuthGuard — relies on it having populated `request.user`. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const user: AuthenticatedUser = context.switchToHttp().getRequest().user;
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`This action requires one of the following roles: ${requiredRoles.join(', ')}`);
    }
    return true;
  }
}
