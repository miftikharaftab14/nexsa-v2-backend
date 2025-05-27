import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { UserService } from '../../users/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { BusinessException } from 'src/common/exceptions/business.exception';
import { User } from '../../users/entities/user.entity';
import { Messages } from 'src/common/enums/messages.enum';
import { IOtpService } from 'src/common/interfaces/otp-service.interface';
import { InjectionToken } from '../../common/constants/injection-tokens';
import { LogMessages, LogContexts } from 'src/common/enums/logging.enum';
import { OtpPurpose } from '../../common/enums/otp.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(LogContexts.AUTH);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(InjectionToken.OTP_SERVICE) private readonly otpService: IOtpService,
  ) {}

  async signup(dto: SignupDto): Promise<User> {
    try {
      this.logger.debug(LogMessages.AUTH_SIGNUP_ATTEMPT, dto.phone_number);

      // Check if email exists
      if (dto.email) {
        const existingUserWithEmail = await this.userService.findByEmail(dto.email);
        if (existingUserWithEmail) {
          this.logger.warn(LogMessages.AUTH_SIGNUP_FAILED, `Email already exists - ${dto.email}`);
          throw new BusinessException(Messages.EMAIL_ALREADY_EXISTS, 'EMAIL_ALREADY_EXISTS', {
            email: dto.email,
          });
        }
      }

      const existingUserWithPhone = await this.userService.findByPhone(dto.phone_number);
      if (existingUserWithPhone) {
        this.logger.warn(
          LogMessages.AUTH_SIGNUP_FAILED,
          `Phone already exists - ${dto.phone_number}`,
        );
        throw new BusinessException(Messages.PHONE_ALREADY_EXISTS, 'PHONE_ALREADY_EXISTS', {
          phone_number: dto.phone_number,
        });
      }

      const user = await this.userService.create(dto);
      this.logger.log(LogMessages.AUTH_SIGNUP_SUCCESS, dto.phone_number);
      return user;
    } catch (error: unknown) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(
        LogMessages.AUTH_SIGNUP_FAILED,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error.stack : undefined,
      );
      throw new BusinessException(Messages.USER_CREATION_FAILED, 'USER_CREATION_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async login(dto: LoginDto): Promise<{ message: string }> {
    try {
      this.logger.debug(LogMessages.AUTH_LOGIN_ATTEMPT, dto.phone_number);

      const user = await this.userService.findByPhone(dto.phone_number);
      if (!user) {
        this.logger.warn(LogMessages.AUTH_LOGIN_FAILED, `User not found - ${dto.phone_number}`);
        throw new BusinessException(Messages.USER_NOT_FOUND, 'USER_NOT_FOUND', {
          phone_number: dto.phone_number,
        });
      }

      // Verify user role matches the login attempt
      if (user.role !== dto.role) {
        this.logger.warn(
          LogMessages.AUTH_LOGIN_FAILED,
          `Role mismatch - User role: ${user.role}, Attempted role: ${dto.role}`,
        );
        throw new BusinessException(Messages.FORBIDDEN, 'FORBIDDEN', {
          message: `User with role ${user.role} cannot login as ${dto.role}`,
        });
      }

      // Send OTP via OTP service
      const otpResult = await this.otpService.sendOtp(dto.phone_number);
      if (!otpResult.success) {
        this.logger.error(LogMessages.AUTH_OTP_SEND_FAILED, dto.phone_number);
        throw new BusinessException(Messages.OTP_SENT, 'OTP_SENT', {
          message: otpResult.message,
        });
      }

      this.logger.log(LogMessages.AUTH_OTP_SEND_SUCCESS, dto.phone_number);
      return { message: otpResult.message };
    } catch (error: unknown) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(
        LogMessages.AUTH_LOGIN_FAILED,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error.stack : undefined,
      );
      throw new BusinessException(Messages.LOGIN_FAILED, 'LOGIN_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async sendOtp(phoneNumber: string, purpose: OtpPurpose = OtpPurpose.LOGIN) {
    return this.otpService.sendOtp(phoneNumber, purpose);
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ accessToken: string; user: User }> {
    try {
      this.logger.debug(LogMessages.AUTH_OTP_VERIFY_ATTEMPT, dto.phone_number);

      const user = await this.userService.findByPhone(dto.phone_number);
      if (!user?.id || !user?.role) {
        this.logger.warn(
          LogMessages.AUTH_OTP_VERIFY_FAILED,
          `User not found - ${dto.phone_number}`,
        );
        throw new NotFoundException(Messages.USER_NOT_FOUND);
      }

      // Verify OTP via OTP service
      const isValidOtp = await this.otpService.verifyOtp(dto.phone_number, dto.otp);
      if (!isValidOtp) {
        this.logger.warn(
          LogMessages.AUTH_OTP_VERIFY_FAILED,
          `Invalid OTP for phone: ${dto.phone_number}`,
        );
        throw new BusinessException(Messages.INVALID_OTP, 'INVALID_OTP', {
          phone_number: dto.phone_number,
        });
      }

      const token = this.jwtService.sign({ sub: user.id, role: user.role });
      this.logger.log(LogMessages.AUTH_OTP_VERIFY_SUCCESS, dto.phone_number);
      return { accessToken: token, user };
    } catch (error: unknown) {
      if (error instanceof BusinessException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        LogMessages.AUTH_OTP_VERIFY_FAILED,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error.stack : undefined,
      );
      throw new BusinessException(Messages.OTP_VERIFICATION_FAILED, 'OTP_VERIFICATION_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async resendOtp(
    phoneNumber: string,
    purpose: OtpPurpose = OtpPurpose.LOGIN,
  ): Promise<{ message: string }> {
    const otpResult = await this.otpService.resendOtp(phoneNumber, purpose);
    return { message: otpResult.message };
  }
}
