import { Contact } from 'src/contacts/entities/contact.entity';
import { Invitation } from '../entities/invitation.entity';

export interface IInvitationService {
  createInvitation(contact: Contact): Promise<Invitation>;
  cancelInvitation(invitationId: bigint): Promise<void>;
  acceptInvitation(token: string, userId: number): Promise<void>;
  getInvitationByToken(token: string): Promise<Invitation>;
  getInvitationById(id: number): Promise<Invitation>;
  getInvitationsByContactId(contactId: number): Promise<Invitation[]>;
}
