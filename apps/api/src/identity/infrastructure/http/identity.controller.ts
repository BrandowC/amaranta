import { Body, Controller, Get, HttpCode, HttpStatus, Inject, NotFoundException, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RegisterRequestDto } from './dto/register-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegisterWalkInCustomerRequestDto } from './dto/register-walk-in-customer-request.dto';
import { RegisterUserUseCasePort } from '../../domain/ports/in/register-user.port';
import { LoginUseCasePort } from '../../domain/ports/in/login.port';
import { ListStaffUseCasePort } from '../../domain/ports/in/list-staff.port';
import { RegisterWalkInCustomerUseCasePort } from '../../domain/ports/in/register-walk-in-customer.port';
import { FindCustomerByEmailUseCasePort } from '../../domain/ports/in/find-customer-by-email.port';
import { RegisterUserUseCase } from '../../application/register-user.use-case';
import { LoginUseCase } from '../../application/login.use-case';
import { ListStaffUseCase } from '../../application/list-staff.use-case';
import { RegisterWalkInCustomerUseCase } from '../../application/register-walk-in-customer.use-case';
import { FindCustomerByEmailUseCase } from '../../application/find-customer-by-email.use-case';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { RolesGuard } from '../security/roles.guard';
import { Roles } from '../security/roles.decorator';
import { UserRole } from '../../domain/value-objects/user-role.enum';

@ApiTags('identity')
@Controller('auth')
export class IdentityController {
  constructor(
    @Inject(RegisterUserUseCase) private readonly registerUser: RegisterUserUseCasePort,
    @Inject(LoginUseCase) private readonly login: LoginUseCasePort,
    @Inject(ListStaffUseCase) private readonly listStaff: ListStaffUseCasePort,
    @Inject(RegisterWalkInCustomerUseCase) private readonly registerWalkInCustomer: RegisterWalkInCustomerUseCasePort,
    @Inject(FindCustomerByEmailUseCase) private readonly findCustomerByEmail: FindCustomerByEmailUseCasePort,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: RegisterRequestDto) {
    return this.registerUser.execute(body);
  }

  @Post('register-walk-in')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECEPTIONIST)
  registerWalkIn(@Body() body: RegisterWalkInCustomerRequestDto) {
    return this.registerWalkInCustomer.execute(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  authenticate(@Body() body: LoginRequestDto) {
    return this.login.execute(body);
  }

  @Get('staff')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  staff() {
    return this.listStaff.execute();
  }

  @Get('customers')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN)
  async findCustomer(@Query('email') email: string) {
    const customer = await this.findCustomerByEmail.execute({ email });
    if (!customer) throw new NotFoundException(`No customer found with email "${email}"`);
    return customer;
  }
}
