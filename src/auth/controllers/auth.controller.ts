import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponse as ApiResponseInterface } from 'src/common/interfaces/api-response.interface';
import { CustomValidationPipe } from 'src/common/pipes/validation.pipe';

@Controller('auth')
@ApiBearerAuth('JWT-auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'User registered successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'johndoe' },
            email: { type: 'string', example: 'john@example.com' },
            phone_number: { type: 'string', example: '+1234567890' },
            role: { type: 'string', example: 'CUSTOMER' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or user already exists',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Email already exists' },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'EMAIL_ALREADY_EXISTS' },
            details: {
              type: 'object',
              properties: {
                email: { type: 'string', example: 'john@example.com' },
              },
            },
          },
        },
      },
    },
  })
  async signup(
    @Body(new CustomValidationPipe()) signupDto: SignupDto,
  ): Promise<ApiResponseInterface<any>> {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'OTP sent successfully' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'OTP sent (mocked)' },
            otp: { type: 'string', example: '123456' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'User not found' },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'USER_NOT_FOUND' },
            details: {
              type: 'object',
              properties: {
                phone_number: { type: 'string', example: '+1234567890' },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @Body(new CustomValidationPipe()) loginDto: LoginDto,
  ): Promise<ApiResponseInterface<any>> {
    return this.authService.login(loginDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and get access token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP verified successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'OTP verified successfully' },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                username: { type: 'string', example: 'johndoe' },
                email: { type: 'string', example: 'john@example.com' },
                phone_number: { type: 'string', example: '+1234567890' },
                role: { type: 'string', example: 'CUSTOMER' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid OTP',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Invalid OTP' },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_OTP' },
            details: {
              type: 'object',
              properties: {
                phone_number: { type: 'string', example: '+1234567890' },
              },
            },
          },
        },
      },
    },
  })
  async verifyOtp(
    @Body(new CustomValidationPipe()) verifyOtpDto: VerifyOtpDto,
  ): Promise<ApiResponseInterface<any>> {
    return this.authService.verifyOtp(verifyOtpDto);
  }
}
