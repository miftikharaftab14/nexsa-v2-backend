// src/contacts/services/contact-invitation.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvitationMethod, InvitationStatus } from '../../common/enums/contact-invitation.enum';
import { Contact } from '../../contacts/entities/contact.entity';
import { BusinessException } from '../../common/exceptions/business.exception';
import { Messages } from '../../common/enums/messages.enum';
import { LogMessages, LogContexts } from '../../common/enums/logging.enum';
import { ConfigService } from '@nestjs/config';
import { IInvitationService } from 'src/invitations/interfaces/contact-invitation.interface';
import { Invitation } from '../entities/invitation.entity';
import { InjectionToken } from 'src/common/constants/injection-tokens';
import { ContactStatus } from 'src/common/enums/contact-status.enum';
import { IInvitationStrategy } from '../interfaces/invitation-strategy.interface';

@Injectable()
export class InvitationService implements IInvitationService {
  private readonly logger = new Logger(LogContexts.CONTACT_INVITATION);

  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepo: Repository<Invitation>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @Inject(InjectionToken.INVITATION_STRATEGIES)
    private readonly strategies: IInvitationStrategy[],
    private readonly configService: ConfigService,
  ) {}
  private selectStrategy(contact: Contact): IInvitationStrategy {
    // 1. First check if contact has phone number
    if (contact.phone_number) {
      const smsStrategy = this.strategies.find(
        strategy => strategy.getStrategyType() === InvitationMethod.SMS,
      );
      if (smsStrategy) {
        return smsStrategy;
      }
    }

    // 2. Fallback to email if available
    if (contact.email) {
      const emailStrategy = this.strategies.find(
        strategy => strategy.getStrategyType() === InvitationMethod.EMAIL,
      );
      if (emailStrategy) {
        return emailStrategy;
      }
    }

    // 3. Throw error if no suitable strategy found
    throw new BusinessException(
      'No suitable invitation method available for this contact',
      'NO_SUITABLE_METHOD_AVAILABLE',
    );
  }

  async createInvitation(contact: Contact): Promise<Invitation> {
    try {
      this.logger.debug(LogMessages.INVITATION_CREATE_ATTEMPT);

      const inviteToken = this.generateRandomCode();

      // Send SMS with deep link
      // 2. Select appropriate strategy
      const strategy = this.selectStrategy(contact);

      // 3. Send invitation using selected strategy
      await strategy.sendInvitation(contact, inviteToken);
      const invitation = this.invitationRepo.create({
        contact_id: contact.id,
        invite_token: inviteToken,
        method: strategy.getStrategyType(),
        invite_sent_at: new Date(),
        status: InvitationStatus.PENDING,
        seller_id: contact.seller_id,
      });

      await this.invitationRepo.save(invitation);

      this.logger.log(
        LogMessages.INVITATION_CREATE_SUCCESS + strategy.getStrategyType(),
        invitation.id,
      );
      return invitation;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(LogMessages.INVITATION_CREATE_FAILED, error);
      throw new BusinessException(
        Messages.INVITATION_CREATION_FAILED,
        'INVITATION_CREATION_FAILED',
      );
    }
  }

  generateRandomCode(length = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }
    return result;
  }

  async cancelInvitation(contactId: bigint): Promise<void> {
    try {
      this.logger.debug(LogMessages.INVITATION_CANCEL_ATTEMPT, contactId);

      const invitation = await this.invitationRepo.findOne({
        where: {
          contact_id: BigInt(contactId),
          invite_cancelled_at: undefined,
          status: InvitationStatus.PENDING,
        },
        relations: ['contact'],
        order: { created_at: 'DESC' },
      });

      if (!invitation) {
        throw new BusinessException(Messages.INVITATION_NOT_FOUND, 'INVITATION_NOT_FOUND');
      }
      this.logger.log(invitation);
      if (invitation.status !== InvitationStatus.PENDING) {
        throw new BusinessException(
          Messages.INVITATION_ALREADY_PROCESSED,
          'INVITATION_ALREADY_PROCESSED',
        );
      }

      invitation.status = InvitationStatus.CANCELLED;
      invitation.invite_cancelled_at = new Date();
      await this.invitationRepo.save(invitation);

      // Update contact status back to NEW
      const logTest = await this.contactRepo.update(Number(invitation.contact_id), {
        status: ContactStatus.NEW,
        invited_user_id: undefined,
      });

      this.logger.log('INVITATION_CANCEL_SUCCESS', logTest);
      this.logger.log(LogMessages.INVITATION_CANCEL_SUCCESS, contactId);
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(LogMessages.INVITATION_CANCEL_FAILED, error);
      throw new BusinessException(
        LogMessages.INVITATION_CANCEL_FAILED,
        'INVITATION_CANCEL_FAILED',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );
    }
  }

  async acceptInvitation(token: string, userId: number): Promise<void> {
    try {
      this.logger.debug(LogMessages.INVITATION_ACCEPT_ATTEMPT, token);

      const invitation = await this.invitationRepo.findOne({
        where: { invite_token: token },
        relations: ['contact'],
      });

      if (!invitation) {
        throw new BusinessException(Messages.INVITATION_NOT_FOUND, 'INVITATION_NOT_FOUND');
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        throw new BusinessException(
          Messages.INVITATION_ALREADY_PROCESSED,
          'INVITATION_ALREADY_PROCESSED',
        );
      }

      invitation.status = InvitationStatus.ACCEPTED;
      invitation.invite_accepted_at = new Date();
      await this.invitationRepo.save(invitation);

      // Update contact with invited user
      await this.contactRepo.update(Number(invitation.contact_id), {
        status: ContactStatus.ACCEPTED,
        invited_user_id: BigInt(userId),
      });

      this.logger.log(LogMessages.INVITATION_ACCEPT_SUCCESS, token);
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(LogMessages.INVITATION_ACCEPT_FAILED, error);
      throw new BusinessException(
        LogMessages.INVITATION_ACCEPT_FAILED,
        'INVITATION_ACCEPT_FAILED',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );
    }
  }
  async getInvitationByToken(token: string): Promise<Invitation[]> {
    try {
      this.logger.debug(LogMessages.INVITATION_FETCH_ATTEMPT, token);

      const invites = await this.invitationRepo.find({
        where: {
          status: InvitationStatus.PENDING,
        },
        relations: ['contact', 'contact.seller'],
      });

      this.logger.debug('fetching', invites);

      if (!invites || invites.length === 0) {
        throw new BusinessException(Messages.INVITATION_NOT_FOUND, 'INVITATION_NOT_FOUND');
      }

      this.logger.log(LogMessages.INVITATION_FETCH_SUCCESS, token);

      return invites;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(LogMessages.INVITATION_FETCH_FAILED, error);
      throw new BusinessException(LogMessages.INVITATION_FETCH_FAILED, 'INVITATION_FETCH_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getInvitationByNumber(phoneNumber: string): Promise<Invitation[]> {
    try {
      this.logger.debug(LogMessages.INVITATION_FETCH_ATTEMPT, phoneNumber);

      const invitation = await this.invitationRepo.find({
        where: { contact: { phone_number: phoneNumber }, status: InvitationStatus.PENDING },
        relations: ['contact', 'contact.seller'],
      });

      if (!invitation) {
        throw new BusinessException(Messages.INVITATION_NOT_FOUND, 'INVITATION_NOT_FOUND');
      }

      this.logger.log(LogMessages.INVITATION_FETCH_SUCCESS, phoneNumber);
      return invitation;
    } catch (error) {
      this.logger.error(LogMessages.INVITATION_FETCH_FAILED, error);
      throw new BusinessException(LogMessages.INVITATION_FETCH_FAILED, 'INVITATION_FETCH_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getInvitationById(id: bigint): Promise<Invitation> {
    try {
      this.logger.debug(LogMessages.INVITATION_FETCH_ATTEMPT, id);

      const invitation = await this.invitationRepo.findOne({
        where: { id: BigInt(id) },
        relations: ['contact', 'contact.seller'],
      });

      if (!invitation) {
        throw new BusinessException(Messages.INVITATION_NOT_FOUND, 'INVITATION_NOT_FOUND');
      }

      this.logger.log(LogMessages.INVITATION_FETCH_SUCCESS, id);
      return invitation;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(LogMessages.INVITATION_FETCH_FAILED, error);
      throw new BusinessException(LogMessages.INVITATION_FETCH_FAILED, 'INVITATION_FETCH_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getInvitationsByContactId(contactId: number): Promise<Invitation[]> {
    try {
      this.logger.debug(LogMessages.INVITATION_FETCH_ATTEMPT, contactId);

      const invitations = await this.invitationRepo.find({
        where: { contact_id: BigInt(contactId) },
        relations: ['contact', 'contact.seller'],
        order: { created_at: 'DESC' },
      });

      this.logger.log(LogMessages.INVITATION_FETCH_SUCCESS, contactId);
      return invitations;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(LogMessages.INVITATION_FETCH_FAILED, error);
      throw new BusinessException(LogMessages.INVITATION_FETCH_FAILED, 'INVITATION_FETCH_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getAcceptedInvitationsByCustomerId(customerId: number): Promise<Invitation[]> {
    try {
      this.logger.debug(LogMessages.INVITATION_FETCH_ATTEMPT_BY_CUSTOMER, customerId);

      const invitations = await this.invitationRepo.find({
        where: {
          status: InvitationStatus.ACCEPTED,
          contact: {
            invited_user_id: BigInt(customerId),
          },
        },
        relations: ['contact', 'contact.seller'],
        order: { created_at: 'DESC' },
      });

      this.logger.log(LogMessages.INVITATION_FETCH_SUCCESS, customerId);
      return invitations;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(LogMessages.INVITATION_FETCH_FAILED, error);
      throw new BusinessException(LogMessages.INVITATION_FETCH_FAILED, 'INVITATION_FETCH_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateInvitationStatusByToken(
    token: string,
    status: InvitationStatus,
  ): Promise<Invitation> {
    try {
      this.logger.debug(LogMessages.INVITATION_UPDATE_ATTEMPT, token);

      const invitation = await this.invitationRepo.findOne({
        where: { invite_token: token },
      });

      if (!invitation) {
        throw new BusinessException(Messages.INVITATION_NOT_FOUND, 'INVITATION_NOT_FOUND');
      }

      invitation.status = status;
      if (status === InvitationStatus.ACCEPTED) {
        invitation.invite_accepted_at = new Date();
      } else if (status === InvitationStatus.REJECTED) {
        invitation.invite_cancelled_at = new Date();
      }
      // Add more status-specific logic if needed

      await this.invitationRepo.save(invitation);

      this.logger.log(LogMessages.INVITATION_UPDATE_SUCCESS, token);
      return invitation;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(
        LogMessages.INVITATION_UPDATE_FAILED,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error.stack : undefined,
      );
      throw new BusinessException(Messages.INVITATION_UPDATE_FAILED, 'INVITATION_UPDATE_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateInvitationStatusById(
    invite_id: bigint,
    status: InvitationStatus,
  ): Promise<Invitation> {
    try {
      this.logger.debug(LogMessages.INVITATION_UPDATE_ATTEMPT, invite_id);

      const invitation = await this.invitationRepo.findOne({
        where: {
          id: invite_id,
        },
        relations: ['contact', 'contact.seller'],
      });

      if (!invitation) {
        throw new BusinessException(Messages.INVITATION_NOT_FOUND, 'INVITATION_NOT_FOUND');
      }

      invitation.status = status;
      if (status === InvitationStatus.ACCEPTED) {
        invitation.invite_accepted_at = new Date();
      } else if (status === InvitationStatus.REJECTED) {
        invitation.invite_cancelled_at = new Date();
      }
      // Add more status-specific logic if needed

      await this.invitationRepo.save(invitation);

      this.logger.log(LogMessages.INVITATION_UPDATE_SUCCESS, invite_id);
      return invitation;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(
        LogMessages.INVITATION_UPDATE_FAILED,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error.stack : undefined,
      );
      throw new BusinessException(Messages.INVITATION_UPDATE_FAILED, 'INVITATION_UPDATE_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // In InvitationService
  async deleteInvitationsByContactId(contactId: number): Promise<void> {
    await this.invitationRepo.delete({ contact_id: BigInt(contactId) });
  }
}
