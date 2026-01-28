import { Inject, Injectable, Logger } from '@nestjs/common';
import { IInvitationStrategy } from '../interfaces/invitation-strategy.interface';
import { Contact } from '../../contacts/entities/contact.entity';
import { ConfigService } from '@nestjs/config';
import { InjectionToken } from 'src/common/constants/injection-tokens';
import { BusinessException } from 'src/common/exceptions/business.exception';
import { InvitationMethod } from 'src/common/enums/contact-invitation.enum';
import { LogContexts } from 'src/common/enums/logging.enum';
import { TwilioMessagingService } from 'src/common/services/twilio-messaging.service';

@Injectable()
export class SMSInvitationStrategy implements IInvitationStrategy {
  private readonly logger = new Logger(LogContexts.SMSINVITAIONSTRATEGY);
  constructor(
    @Inject(InjectionToken.MESSAGING_SERVICE)
    private readonly messagingService: TwilioMessagingService,
    private readonly configService: ConfigService,
  ) { }

  async sendInvitation(contact: Contact): Promise<void> {
    try {
      // 1. Validate contact has phone number
      if (!contact.phone_number) {
        throw new BusinessException(
          'Phone number is required for SMS invitation',
          'PHONE_NUMBER_IS_REQUIRED',
        );
      }
      // 2. Generate message
      const message = this.getInvitationMessage(contact);
      // 3. Send via messaging service (TwilioService)
      await this.messagingService.sendSMSWithMessagingService(contact.phone_number, message);
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      // Handle specific errors
      this.logger.error('Failed to send SMS invitation', error);
      throw new BusinessException(
        error instanceof Error ? error.message : 'Failed to send SMS invitation',
        'FAILED_TO_SEND_SMS',
      );
    }
  }

  getInvitationMessage(contact: Contact): string {

    const androidUrl = this.configService.get<string>('GOOGLE_PLAY_STORE_URL');
    const iosUrl = this.configService.get<string>('APPLE_APP_STORE_URL');

    return `${contact?.seller?.username} invites you to join their store on the Nexsa app! Download it from: Android: ${androidUrl} iOS: ${iosUrl} Reply STOP to unsubscribe.`;
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
