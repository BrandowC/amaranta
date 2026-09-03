import { UserRole } from '../../value-objects/user-role.enum';

export const TOKEN_ISSUER_PORT = Symbol('TOKEN_ISSUER_PORT');

export interface TokenPayload {
  userId: string;
  role: UserRole;
}

export interface TokenIssuerPort {
  issue(payload: TokenPayload): string;
}
