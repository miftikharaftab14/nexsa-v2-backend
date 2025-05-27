import { Inject, Injectable } from '@nestjs/common';
import { IInvitationStrategy } from '../interfaces/invitation-strategy.interface';
import { Contact } from '../../contacts/entities/contact.entity';
import { ConfigService } from '@nestjs/config';
import { IMessagingService } from 'src/common/interfaces/messaging-service.interface';
import { InjectionToken } from 'src/common/constants/injection-tokens';
import { BusinessException } from 'src/common/exceptions/business.exception';
import { InvitationMethod } from 'src/common/enums/contact-invitation.enum';

@Injectable()
export class SMSInvitationStrategy implements IInvitationStrategy {
  constructor(
    @Inject(InjectionToken.MESSAGING_SERVICE)
    private readonly messagingService: IMessagingService,
    private readonly configService: ConfigService,
  ) {}

  async sendInvitation(contact: Contact, inviteToken: string): Promise<void> {
    try {
      // 1. Validate contact has phone number
      if (!contact.phone_number) {
        throw new BusinessException(
          'Phone number is required for SMS invitation',
          'PHONE_NUMBER_IS_REQUIRED',
        );
      }
      // 2. Generate message
      const message = this.getInvitationMessage(contact, inviteToken);

      // 3. Send via messaging service (TwilioService)
      await this.messagingService.sendMessage(contact.phone_number, message);
    } catch (error) {
      // Handle specific errors
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException('Failed to send SMS invitation', 'FAILED_TO_SEND_SMS');
    }
  }

  getInvitationMessage(contact: Contact, inviteToken: string): string {
    const appUrl = this.configService.get<string>('APP_URL');
    const deepLink = `${appUrl}/${inviteToken}`;
    return `You've been invited to connect with ${contact.seller.username}. Click here to accept: ${deepLink}`;
  }
  // Add method to check if strategy is applicable
  canHandle(contact: Contact): boolean {
    return !!contact.phone_number;
  }

  // Add method to get strategy type
  getStrategyType(): InvitationMethod {
    return InvitationMethod.SMS;
  }
}
