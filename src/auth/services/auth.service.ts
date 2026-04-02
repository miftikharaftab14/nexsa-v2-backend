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
import { InviteSellerDto } from '../dto/invite-seller.dto';
import { Contact } from 'src/contacts/entities/contact.entity';
import { UserDeviceTokenService } from '../../users/services/user-device-token.service';
import { NotificationService } from '../../common/services/notification.service';
import {
  InvitationRecipient,
  InvitationStatus,
  InvitationType,
} from '../../common/enums/contact-invitation.enum';
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
      const inviteUrl = this.userService.getInviteUrl(user);
      return { ...user, inviteUrl } as User & { inviteUrl: string | null };
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
    user: User & { inviteUrl: string | null };
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

        invitaions = await this.invitaionService.getInvitationsByCustomerId(user.id);
        if (invitaions && dto.seller_id) {
          invitaions = invitaions.filter(invitation => Number(invitation.seller_id) === dto.seller_id);
        }
      }

      if (user) {
        if (dto.role === UserRole.CUSTOMER && dto.seller_id) {
          try {
            const existingInvites = await this.invitaionService.getInvitationsByCustomerId(user.id);
            const hasAnyInviteForThisSeller = (existingInvites || []).some(
              invitation =>
                Number(invitation.seller_id) === dto.seller_id &&
                invitation.invite_for === InvitationRecipient.CUSTOMER &&
                (invitation.status === InvitationStatus.PENDING ||
                  invitation.status === InvitationStatus.REQUESTED),
            );

            if (!hasAnyInviteForThisSeller) {
              const newInvitation = await this.invitaionService.createInvitationForCustomer(
                BigInt(dto.seller_id),
                BigInt(user.id),
                InvitationType.LINK,
                InvitationRecipient.CUSTOMER,
              );
              if (!invitaions) {
                invitaions = [];
              }
              invitaions.push(newInvitation);
            }
          } catch (error) {
            this.logger.error(
              'Failed to ensure invitation exists for customer login with seller_id',
              error,
            );
          }
        }

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
        if (dto.role === UserRole.SELLER) {
          invitaions = await this.invitaionService.getAcceptedInvitationsBySellerId(user.id);
        }
        if (dto.role === UserRole.CUSTOMER) {
          contacts = await this.contactService.findAllByInvitedUserId(user.id);
          if (dto.seller_id && contacts) {
            contacts = contacts.filter(contact => Number(contact.seller_id) === dto.seller_id);
          }
        }
        const inviteUrl = this.userService.getInviteUrl(user);
        return {
          message: LogMessages.AUTH_LOGIN_SUCCESS,
          user: { ...user, inviteUrl },
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

  async inviteSeller(
    customerId: number,
    dto: InviteSellerDto,
  ): Promise<{ message: string; invitation: Invitation }> {
    try {
      const customer = await this.userService.findOne(customerId);
      if (!customer) {
        throw new BusinessException(Messages.USER_NOT_FOUND, 'USER_NOT_FOUND');
      }

      if (customer.role !== UserRole.CUSTOMER) {
        throw new BusinessException(Messages.FORBIDDEN, 'FORBIDDEN', {
          role: 'Only customers can invite sellers',
        });
      }

      const seller = await this.userService.findOne(dto.seller_id);
      if (!seller || seller.is_deleted) {
        throw new BusinessException(Messages.USER_NOT_FOUND, 'USER_NOT_FOUND');
      }

      if (seller.role !== UserRole.SELLER) {
        throw new BusinessException(Messages.FORBIDDEN, 'FORBIDDEN', {
          role: 'Target user must be a seller',
        });
      }

      const existingInvites = await this.invitaionService.getInvitationsByCustomerId(customer.id);
      const pendingInvite = (existingInvites || []).find(
        invitation =>
          Number(invitation.seller_id) === Number(dto.seller_id) &&
          invitation.invite_for === InvitationRecipient.CUSTOMER &&
          invitation.status === InvitationStatus.PENDING,
      );

      let invitation: Invitation;
      if (pendingInvite) {
        invitation = pendingInvite;
      } else {
        invitation = await this.invitaionService.createInvitationForCustomer(
          BigInt(dto.seller_id),
          BigInt(customer.id),
          InvitationType.LINK,
          InvitationRecipient.CUSTOMER,
        );
      }

      try {
        const sellerTokens = await this.userDeviceTokenService.getTokensByUser(BigInt(seller.id));
        if (sellerTokens.length > 0) {
          const fullName = customer.username || customer.phone_number || 'Customer';
          await this.notificationService.sendPushNotification(
            sellerTokens,
            'New connection request',
            `Customer ${fullName} wants to connect with you`,
            {
              screen: 'Contacts',
            },
          );
        }
      } catch (notifyError) {
        this.logger.error('Failed to send push notification to seller for invite', notifyError);
      }

      return { message: 'Invitation sent to seller', invitation };
    } catch (error: unknown) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(
        'Failed to invite seller',
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error.stack : undefined,
      );
      throw new BusinessException(Messages.INVITATION_CREATION_FAILED, 'INVITATION_CREATION_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async acceptInvite(
    dto: AcceptInviteDto,
    actorUserId: number,
  ): Promise<{ message: string; data: Invitation }> {
    this.logger.log(LogMessages.INVITATION_FETCH_SUCCESS, dto.invite_id);

    let invitation = await this.invitaionService.getInvitationById(dto.invite_id);

    const invitedUser = await this.userService.findOne(actorUserId);
    if (!invitedUser) {
      throw new BusinessException(Messages.USER_NOT_FOUND, 'USER_NOT_FOUND');
    }

    const sellerId = invitation.seller_id || invitation.contact?.seller_id;
    if (!sellerId) {
      this.logger.warn('Seller ID not found in invitation', dto.invite_id);
    }

    const contactRepository = this.dataSource.getRepository(Contact);
    const invitationRepository = this.dataSource.getRepository(Invitation);
    const userRepository = this.dataSource.getRepository(User);
    const customerId = invitation.contact?.invited_user_id
      ? Number(invitation.contact.invited_user_id)
      : invitation.customer_id
        ? Number(invitation.customer_id)
        : null;
    const actorIsSeller = sellerId ? actorUserId === Number(sellerId) : false;
    const actorIsCustomer = customerId ? actorUserId === customerId : false;

    if (!actorIsSeller && !actorIsCustomer) {
      throw new BusinessException(Messages.FORBIDDEN, 'FORBIDDEN', {
        role: 'Only invitation participants can act on this invitation',
      });
    }

    if (actorIsCustomer && invitation.invite_for === InvitationRecipient.CUSTOMER) {
      if (dto.invitation_status === InvitationStatus.ACCEPTED) {
        await invitationRepository.update({ id: invitation.id }, { status: InvitationStatus.REQUESTED });
        invitation = await this.invitaionService.getInvitationById(dto.invite_id);
        const allInvitations = await this.invitaionService.getInvitationsByCustomerId(customerId as number);
        const pendingSellerInvite = allInvitations.find(
          item =>
            Number(item.seller_id) === Number(sellerId) &&
            item.invite_for === InvitationRecipient.SELLER &&
            item.status === InvitationStatus.PENDING,
        );
        if (!pendingSellerInvite && customerId && sellerId) {
          await this.invitaionService.createInvitationForCustomer(
            BigInt(sellerId),
            BigInt(customerId),
            invitation.invite_type || InvitationType.LINK,
            InvitationRecipient.SELLER,
          );
        }
      } else if (
        dto.invitation_status === InvitationStatus.REJECTED ||
        dto.invitation_status === InvitationStatus.CANCELLED
      ) {
        if (dto.invitation_status === InvitationStatus.CANCELLED && invitation.status === InvitationStatus.REQUESTED) {
          // Cancel after accept: keep customer invite and roll it back to PENDING
          await invitationRepository.update(
            { id: invitation.id },
            {
              status: InvitationStatus.PENDING,
              invite_accepted_at: () => 'NULL',
              invite_cancelled_at: () => 'NULL',
            },
          );

          // Remove seller-side invite(s) for this pair
          if (customerId && sellerId) {
            await invitationRepository.delete({
              seller_id: BigInt(sellerId),
              customer_id: BigInt(customerId),
              invite_for: InvitationRecipient.SELLER,
            });
          }
        } else {
          await invitationRepository.delete({ id: invitation.id });
        }
      }
    }

    if (
      actorIsCustomer &&
      invitation.invite_for === InvitationRecipient.SELLER &&
      (dto.invitation_status === InvitationStatus.REJECTED ||
        dto.invitation_status === InvitationStatus.CANCELLED)
    ) {
      await invitationRepository.delete({ id: invitation.id });
      if (dto.invitation_status === InvitationStatus.CANCELLED && customerId && sellerId) {
        await invitationRepository.update(
          {
            seller_id: BigInt(sellerId),
            customer_id: BigInt(customerId),
            invite_for: InvitationRecipient.CUSTOMER,
            status: InvitationStatus.REQUESTED,
          },
          {
            status: InvitationStatus.PENDING,
            invite_accepted_at: () => 'NULL',
            invite_cancelled_at: () => 'NULL',
          },
        );
      }
    }

    let resolvedContactId: bigint | null = invitation.contact_id || null;
    if (actorIsSeller && invitation.invite_for === InvitationRecipient.SELLER) {
      if (!customerId || !sellerId) {
        throw new BusinessException(Messages.INVALID_INPUT, 'INVALID_INPUT');
      }
      if (dto.invitation_status === InvitationStatus.ACCEPTED) {
        let contact = await this.contactService.findBySellerAndCustomer(Number(sellerId), BigInt(customerId));
        if (!contact) {
          const customer = await this.userService.findOne(customerId);
          contact = await contactRepository.save(
            contactRepository.create({
              seller_id: BigInt(sellerId),
              invited_user_id: BigInt(customerId),
              full_name: customer?.username || '',
              phone_number: customer?.phone_number,
              email: customer?.email,
              status: ContactStatus.ACCEPTED,
            }),
          );
        } else {
          await this.contactService.update(Number(contact.id), {
            invited_user_id: customerId || undefined,
            status: ContactStatus.ACCEPTED,
          });
        }
        resolvedContactId = contact.id;
        await invitationRepository.update(
          { seller_id: BigInt(sellerId), customer_id: BigInt(customerId) },
          { contact_id: contact.id },
        );
      }
      if (
        dto.invitation_status === InvitationStatus.ACCEPTED ||
        dto.invitation_status === InvitationStatus.REJECTED ||
        dto.invitation_status === InvitationStatus.CANCELLED
      ) {
        await invitationRepository.delete({ id: invitation.id });
      }
      if (dto.invitation_status === InvitationStatus.ACCEPTED) {
        await invitationRepository.delete({
          seller_id: BigInt(sellerId),
          customer_id: BigInt(customerId),
          invite_for: InvitationRecipient.CUSTOMER,
        });
      }
    }

    const contact = resolvedContactId
      ? await contactRepository.findOne({ where: { id: BigInt(resolvedContactId) } })
      : null;

    if (sellerId && actorIsCustomer) {
      try {
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

    // Send notification to customer when seller acts on seller-target invite
    try {
      if (actorIsSeller && invitation.invite_for === InvitationRecipient.SELLER && customerId) {
        const customer = await userRepository.findOne({
          where: {
            id: BigInt(customerId),
            notification: true,
            is_deleted: false,
          },
        });

        if (customer) {
          const customerTokens = await this.userDeviceTokenService.getTokensByUser(
            BigInt(customer.id),
          );

          if (customerTokens.length > 0) {
            const sellerName = invitation.seller?.username || 'Seller';
            const customerMessage =
              dto.invitation_status === InvitationStatus.ACCEPTED
                ? `You have a new contact with ${sellerName}`
                : `${sellerName} has rejected your connection request`;

            await this.notificationService.sendPushNotification(
              customerTokens,
              'Invitation',
              customerMessage,
              {
                screen: 'Contacts',
              },
            );

            this.logger.log(
              `Push notification sent to customer ${customer.id} for invitation ${dto.invite_id}`,
            );
          }
        }
      }
    } catch (notifyError) {
      this.logger.error(
        `Failed to send push notification to customer for invitation ${dto.invite_id}`,
        notifyError,
      );
    }

    return { message: 'Invitation updated', data: invitation };
  }
}
