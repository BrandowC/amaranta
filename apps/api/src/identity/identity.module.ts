import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityController } from './infrastructure/http/identity.controller';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { LoginUseCase } from './application/login.use-case';
import { ListStaffUseCase } from './application/list-staff.use-case';
import { RegisterWalkInCustomerUseCase } from './application/register-walk-in-customer.use-case';
import { FindCustomerByEmailUseCase } from './application/find-customer-by-email.use-case';
import { USER_REPOSITORY_PORT } from './domain/ports/out/user-repository.port';
import { PASSWORD_HASHER_PORT } from './domain/ports/out/password-hasher.port';
import { TOKEN_ISSUER_PORT } from './domain/ports/out/token-issuer.port';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { JwtTokenIssuer } from './infrastructure/security/jwt-token-issuer';
import { JwtStrategy } from './infrastructure/security/jwt.strategy';
import { UserOrmEntity } from './infrastructure/persistence/user.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '3600s') },
      }),
    }),
  ],
  controllers: [IdentityController],
  providers: [
    RegisterUserUseCase,
    LoginUseCase,
    ListStaffUseCase,
    RegisterWalkInCustomerUseCase,
    FindCustomerByEmailUseCase,
    JwtStrategy,
    { provide: USER_REPOSITORY_PORT, useClass: UserRepository },
    { provide: PASSWORD_HASHER_PORT, useClass: BcryptPasswordHasher },
    { provide: TOKEN_ISSUER_PORT, useClass: JwtTokenIssuer },
  ],
  exports: [PassportModule, JwtModule, USER_REPOSITORY_PORT],
})
export class IdentityModule {}
