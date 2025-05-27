import { InvitationMethod } from 'src/common/enums/contact-invitation.enum';
import { Contact } from '../../contacts/entities/contact.entity';

export interface IInvitationStrategy {
  getStrategyType(): InvitationMethod;
  canHandle(contact: Contact): boolean;
  sendInvitation(contact: Contact, inviteToken: string): Promise<void>;
  getInvitationMessage(contact: Contact, inviteToken: string): string;
}
