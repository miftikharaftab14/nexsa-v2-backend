import { Inject, Injectable } from '@nestjs/common';
import { IInvitationStrategy } from '../interfaces/invitation-strategy.interface';
import { Contact } from '../../contacts/entities/contact.entity';
import { ConfigService } from '@nestjs/config';
import { InvitationMethod } from 'src/common/enums/contact-invitation.enum';
import { InjectionToken } from 'src/common/constants/injection-tokens';
import { IEmailService } from 'src/common/interfaces/email-service.interface';

@Injectable()
export class EmailInvitationStrategy implements IInvitationStrategy {
  constructor(
    @Inject(InjectionToken.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
    private readonly configService: ConfigService,
  ) {}

  async sendInvitation(contact: Contact, inviteToken: string): Promise<void> {
    const message = this.getInvitationMessage(contact, inviteToken);
    await this.emailService.sendEmail(contact.email, 'Invitation to Connect', message);
  }

  getInvitationMessage(contact: Contact, inviteToken: string): string {
    const appUrl = this.configService.get<string>('APP_URL');
    const deepLink = `${appUrl}/${inviteToken}`;
    return `
      <h1>You've been invited to connect!</h1>
      <p>${contact?.seller?.username} has invited you to connect on our platform.</p>
      <p>Click the link below to accept the invitation:</p>
      <a href="${deepLink}">Accept Invitation</a>
    `;
  }
  // Add method to check if strategy is applicable
  canHandle(contact: Contact): boolean {
    return !contact.phone_number && contact.email ? true : false;
  }

  // Add method to get strategy type
  getStrategyType(): InvitationMethod {
    return InvitationMethod.EMAIL;
  }
}
