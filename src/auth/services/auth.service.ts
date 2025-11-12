import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { UserService } from '../../users/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { BusinessException } from 'src/common/exceptions/business.exception';
import { User } from '../../users/entities/user.entity';
import { Messages } from 'src/common/enums/messages.enum';
import { InterfaceTwilioVerifyService } from 'src/common/interfaces/twilio-verify-service.interface';
import { InjectionToken } from '../../common/constants/injection-tokens';
import { LogMessages, LogContexts } from 'src/common/enums/logging.enum';
import { IInvitationService } from 'src/invitations/interfaces/contact-invitation.interface';
import { UserRole } from 'src/common/enums/user-role.enum';
import { IContactUpdate } from 'src/contacts/interfaces/IContactUpdate.interface';
import { ContactStatus } from 'src/common/enums/contact-status.enum';
import { Invitation } from 'src/invitations/entities/invitation.entity';
import { AcceptInviteDto } from '../dto/accept-invite.dto';
import { Contact } from 'src/contacts/entities/contact.entity';
import { UserDeviceTokenService } from '../../users/services/user-device-token.service';
import { NotificationService } from '../../common/services/notification.service';
import { InvitationStatus } from '../../common/enums/contact-invitation.enum';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(LogContexts.AUTH);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(InjectionToken.OTP_SERVICE)
    private readonly interfaceTwilioVerifyService: InterfaceTwilioVerifyService,
    @Inject(InjectionToken.INVITATION_SERVICE)
    private readonly invitaionService: IInvitationService,
    @Inject(InjectionToken.CONTACT_SERVICE)
    private readonly contactService: IContactUpdate,
    private readonly userDeviceTokenService: UserDeviceTokenService,
    private readonly notificationService: NotificationService,
    @InjectDataSource() private readonly dataSource: DataSource,
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

  async login(dto: LoginDto): Promise<{
    message: string;
    user: User;
    invitations: Invitation[] | null;
    contacts: Contact[] | null;
    token: string | null;
    new_created_user: boolean;
  }> {
    try {
      this.logger.debug(LogMessages.AUTH_LOGIN_ATTEMPT, dto.phone_number);
      let user = await this.userService.findByPhoneAndRole(dto.phone_number, dto.role);
      let invitaions: Invitation[] | null = null;
      let contacts: Contact[] | null = null;
      let new_created_user = false;
      if (dto.role === UserRole.CUSTOMER) {
        if (!dto.deepLinktoken)
          invitaions = await this.invitaionService.getInvitationByNumber(dto.phone_number);
        else invitaions = await this.invitaionService.getInvitationByToken(dto.deepLinktoken);

        if (invitaions && invitaions.length > 0) {
          if (!user) {
            user = await this.userService.create({
              phone_number: dto.phone_number,
              role: UserRole.CUSTOMER,
            });
            new_created_user = true;
            this.logger.log(
              LogMessages.AUTH_LOGIN_SUCCESS,
              `New user created - ${user.phone_number}`,
            );
          }
        }
      }

      if (user) {
        const token = this.jwtService.sign({ sub: user.id, role: user.role });
        this.logger.log(LogMessages.AUTH_LOGIN_SUCCESS, dto.phone_number);
        if (dto.deviceToken) {
          await this.userDeviceTokenService.addOrUpdateToken(
            user.id,
            dto.deviceToken,
            dto.deviceType,
            dto.deviceOs,
          );
        }
        if (dto.role === UserRole.CUSTOMER) {
          contacts = await this.contactService.findAllByInvitedUserId(user.id);
        }
        return {
          message: LogMessages.AUTH_LOGIN_SUCCESS,
          user: user,
          invitations: invitaions,
          contacts: contacts,
          token: token,
          new_created_user,
        };
      } else {
        this.logger.warn(
          LogMessages.AUTH_LOGIN_FAILED,
          `${Messages.USER_NOT_INVITED} - ${dto.phone_number}`,
        );
        throw new BusinessException(Messages.USER_NOT_FOUND, 'USER_NOT_FOUND', {
          message: `${Messages.USER_NOT_FOUND} - ${dto.phone_number}`,
        });
      }
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

  async verifyOtp(dto: VerifyOtpDto): Promise<{ user: User | null; token: string | null }> {
    try {
      this.logger.debug(LogMessages.AUTH_OTP_VERIFY_ATTEMPT, dto.phone_number);

      const user = await this.userService.findByPhoneAndRole(dto.phone_number, dto.role);

      // Verify OTP via OTP service
      const isValidOtp = await this.interfaceTwilioVerifyService.checkTheVerificationToken(
        dto.phone_number,
        dto.otp,
      );
      if (!isValidOtp) {
        this.logger.warn(
          LogMessages.AUTH_OTP_VERIFY_FAILED,
          `Invalid OTP for phone: ${dto.phone_number}`,
        );
        throw new BusinessException(Messages.INVALID_OTP, 'INVALID_OTP', {
          message: `Invalid OTP for phone: ${dto.phone_number}`,
        });
      }

      let token: string | null = null;
      this.logger.log(LogMessages.AUTH_OTP_VERIFY_SUCCESS, dto.phone_number);
      if (user) {
        token = this.jwtService.sign({ sub: user.id, role: user.role });
      }
      return { user, token };
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

  async sendOtp(phoneNumber: string): Promise<{ message: string }> {
    const otpResult = await this.interfaceTwilioVerifyService.sendAVerificationToken(phoneNumber);
    return { message: otpResult.message };
  }

  async acceptInvite(dto: AcceptInviteDto): Promise<{ message: string; data: Invitation }> {
    this.logger.log(LogMessages.INVITATION_FETCH_SUCCESS, dto.invite_id);

    let invitation = await this.invitaionService.getInvitationById(dto.invite_id);

    const invitedUser = await this.userService.findOne(Number(dto.user_id));
    if (!invitedUser) {
      throw new BusinessException(Messages.USER_NOT_FOUND, 'USER_NOT_FOUND');
    }

    const sellerId = invitation.seller_id || invitation.contact?.seller_id;
    if (!sellerId) {
      this.logger.warn('Seller ID not found in invitation', dto.invite_id);
    }

    await this.invitaionService.updateInvitationStatusById(dto.invite_id, dto.invitation_status);

    invitation = await this.invitaionService.getInvitationById(dto.invite_id);

    await this.contactService.update(Number(invitation.contact_id), {
      invited_user_id: Number(dto.user_id),
      status: ContactStatus.ACCEPTED,
    });
    
    const contactRepository = this.dataSource.getRepository(Contact);
    const contact = await contactRepository.findOne({
      where: { id: BigInt(invitation.contact_id) },
    });

    if (sellerId) {
      try {
        const userRepository = this.dataSource.getRepository(User);
        const seller = await userRepository.findOne({
          where: {
            id: BigInt(sellerId),
            notification: true,
            is_deleted: false,
          },
        });

        if (seller) {
          const sellerTokens = await this.userDeviceTokenService.getTokensByUser(
            BigInt(sellerId),
          );

          if (sellerTokens.length > 0) {
            const fullName = contact?.full_name || invitedUser.username || 'User';
            const actionMessage =
              dto.invitation_status === InvitationStatus.ACCEPTED
                ? `User ${fullName} has accepted your invitation`
                : `User ${fullName} has rejected your invitation`;

            // Send push notification
            await this.notificationService.sendPushNotification(
              sellerTokens,
              'Invitation',
              actionMessage,
              {
                screen: 'Contacts',
              },
            );

            this.logger.log(
              `Push notification sent to seller ${sellerId} for invitation ${dto.invite_id}`,
            );
          }
        }
      } catch (notifyError) {
        this.logger.error(
          `Failed to send push notification to seller ${sellerId}`,
          notifyError,
        );
      }
    }

    return { message: 'invite accepted', data: invitation };
  }
}
