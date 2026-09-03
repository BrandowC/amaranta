import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenIssuerPort, TokenPayload } from '../../domain/ports/out/token-issuer.port';

@Injectable()
export class JwtTokenIssuer implements TokenIssuerPort {
  constructor(private readonly jwtService: JwtService) {}

  issue(payload: TokenPayload): string {
    return this.jwtService.sign({ sub: payload.userId, role: payload.role });
  }
}
