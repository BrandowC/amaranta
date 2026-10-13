import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard, but never rejects the request — a missing or invalid token just leaves
 * `request.user` undefined instead of throwing 401. For routes that behave one way for a real
 * customer and another way for an anonymous guest (e.g. online checkout).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: unknown): TUser {
    // passport-jwt passes `false` (not null/undefined) on failure — normalize both to undefined.
    return (user || undefined) as TUser;
  }
}
