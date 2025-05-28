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
import { IInvitationService } from 'src/invitations/interfaces/contact-invitation.interface';
import { InvitationStatus } from 'src/common/enums/contact-invitation.enum';
import { UserRole } from 'src/common/enums/user-role.enum';
import { IContactUpdate } from 'src/contacts/interfaces/IContactUpdate.interface';
import { ContactStatus } from 'src/common/enums/contact-status.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(LogContexts.AUTH);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(InjectionToken.OTP_SERVICE) private readonly otpService: IOtpService,
    @Inject(InjectionToken.INVITATION_SERVICE)
    private readonly invitaionService: IInvitationService,
    @Inject(InjectionToken.CONTACT_SERVICE)
    private readonly contactService: IContactUpdate,
  ) {}

  async signup(dto: SignupDto): Promise<User> {
    try {
      this.logger.debug(LogMessages.AUTH_SIGNUP_ATTEMPT, dto.phone_number);
      if (dto.role === UserRole.CUSTOMER) {
        this.logger.warn(Messages.FORBIDDEN, `FORBIDDEN - ${dto.email}`);
        throw new BusinessException(Messages.FORBIDDEN, 'FORBIDDEN', {
          role: 'Customer not allowed to signup',
        });
      }
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
      // Check if phone number exists
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
      let user = await this.userService.findByPhone(dto.phone_number);
      //check if user is getting loged in with a deep link token
      if (dto.deepLinktoken) {
        const invitaion = await this.invitaionService.getInvitationByToken(dto.deepLinktoken);
        if (!invitaion) {
          this.logger.warn(
            LogMessages.AUTH_LOGIN_FAILED,
            `Invitation not found - ${dto.deepLinktoken}`,
          );
          throw new BusinessException(Messages.INVITATION_NOT_FOUND, 'INVITATION_NOT_FOUND', {
            deepLinktoken: dto.deepLinktoken,
          });
        }
        //if invitaion cancelled just tell the user that invitaion got cancelled
        if (invitaion.status === InvitationStatus.CANCELLED) {
          this.logger.warn(
            LogMessages.AUTH_LOGIN_FAILED,
            `Invitation Cancelled - ${dto.deepLinktoken}`,
          );
          throw new BusinessException(Messages.INVITATION_CANCELLED, 'INVITATION_CANCELLED', {
            deepLinktoken: dto.deepLinktoken,
          });
        }

        //same number should be use for login if invitation is present
        if (invitaion.contact.phone_number && invitaion.contact.phone_number !== dto.phone_number) {
          this.logger.warn(
            LogMessages.AUTH_LOGIN_FAILED,
            `Phone number mismatch - Invitation phone: ${invitaion.contact.phone_number}, Attempted phone: ${dto.phone_number}`,
          );
          throw new BusinessException(Messages.FORBIDDEN, 'FORBIDDEN', {
            message: `Invitation phone number ${invitaion.contact.phone_number} does not match attempted phone number ${dto.phone_number}`,
          });
        }

        if (!user) {
          // If user does not exist, create a new user with the invitation details
          user = await this.userService.create({
            phone_number: dto.phone_number,
            role: UserRole.CUSTOMER,
          });
          this.logger.log(
            LogMessages.AUTH_LOGIN_SUCCESS,
            `New user created - ${user.phone_number}`,
          );
        }
        //update the invitation status to ACCEPTED
        await this.invitaionService.updateInvitationStatusByToken(
          dto.deepLinktoken,
          InvitationStatus.ACCEPTED,
        );
        await this.contactService.update(Number(invitaion.contact_id), {
          invited_user_id: Number(user.id),
          status: ContactStatus.ACCEPTED,
        });
      }

      if (!user) {
        this.logger.warn(
          LogMessages.AUTH_LOGIN_FAILED,
          `${Messages.USER_NOT_INVITED} - ${dto.phone_number}`,
        );
        throw new BusinessException(
          dto.role === UserRole.CUSTOMER ? Messages.USER_NOT_INVITED : Messages.USER_NOT_FOUND,
          'USER_NOT_FOUND',
          {
            message: `${Messages.USER_NOT_INVITED} - ${dto.phone_number}`,
          },
        );
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
          message: `Invalid OTP for phone: ${dto.phone_number}`,
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
