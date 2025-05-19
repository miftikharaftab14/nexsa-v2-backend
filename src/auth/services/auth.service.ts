// src/auth/services/auth.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { UserService } from '../../users/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { BusinessException } from 'src/common/exceptions/business.exception';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly hardcodedOtp = '123456';

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<ApiResponse<User>> {
    try {
      // Check if email exists
      if (dto.email) {
        const existingUserWithEmail = await this.userService.findByEmail(dto.email);
        if (existingUserWithEmail) {
          throw new BusinessException('Email already exists', 'EMAIL_ALREADY_EXISTS', {
            email: dto.email,
          });
        }
      }

      // Check if phone number exists
      const existingUserWithPhone = await this.userService.findByPhone({
        phone_number: dto.phone_number,
      });
      if (existingUserWithPhone) {
        throw new BusinessException('Phone number already exists', 'PHONE_ALREADY_EXISTS', {
          phone_number: dto.phone_number,
        });
      }

      const user = await this.userService.create(dto);
      return {
        success: true,
        message: 'User registered successfully',
        data: user,
      };
    } catch (error: unknown) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException('Failed to create user', 'USER_CREATION_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async login(dto: LoginDto): Promise<ApiResponse<{ message: string; otp: string }>> {
    try {
      const user = await this.userService.findByPhone(dto);
      if (!user) {
        throw new BusinessException('User not found', 'USER_NOT_FOUND', {
          phone_number: dto.phone_number,
        });
      }
      return {
        success: true,
        message: 'OTP sent successfully',
        data: {
          message: 'OTP sent (mocked)',
          otp: this.hardcodedOtp,
        },
      };
    } catch (error: unknown) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException('Login failed', 'LOGIN_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<ApiResponse<{ accessToken: string; user: User }>> {
    try {
      if (dto.otp !== this.hardcodedOtp) {
        throw new BusinessException('Invalid OTP', 'INVALID_OTP', {
          phone_number: dto.phone_number,
        });
      }

      const user = await this.userService.findByPhone(dto);
      if (!user?.id || !user?.role) {
        throw new NotFoundException('User not found');
      }

      const token = this.jwtService.sign({ sub: user.id, role: user.role });
      return {
        success: true,
        message: 'OTP verified successfully',
        data: {
          accessToken: token,
          user,
        },
      };
    } catch (error: unknown) {
      if (error instanceof BusinessException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BusinessException('OTP verification failed', 'OTP_VERIFICATION_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
