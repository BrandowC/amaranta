import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RegisterRequestDto } from './dto/register-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegisterUserUseCasePort } from '../../domain/ports/in/register-user.port';
import { LoginUseCasePort } from '../../domain/ports/in/login.port';
import { RegisterUserUseCase } from '../../application/register-user.use-case';
import { LoginUseCase } from '../../application/login.use-case';

@ApiTags('identity')
@Controller('auth')
export class IdentityController {
  constructor(
    @Inject(RegisterUserUseCase) private readonly registerUser: RegisterUserUseCasePort,
    @Inject(LoginUseCase) private readonly login: LoginUseCasePort,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: RegisterRequestDto) {
    return this.registerUser.execute(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  authenticate(@Body() body: LoginRequestDto) {
    return this.login.execute(body);
  }
}
