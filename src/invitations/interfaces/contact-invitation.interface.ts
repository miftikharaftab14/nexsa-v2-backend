import { Contact } from 'src/contacts/entities/contact.entity';
import { Invitation } from '../entities/invitation.entity';
import { InvitationStatus } from 'src/common/enums/contact-invitation.enum';

export interface IInvitationService {
  createInvitation(contact: Contact): Promise<Invitation>;
  cancelInvitation(invitationId: bigint): Promise<void>;
  acceptInvitation(token: string, userId: number): Promise<void>;
  getInvitationByToken(token: string): Promise<Invitation[]>;
  getInvitationByNumber(phoneNumber: string): Promise<Invitation[]>;
  getInvitationById(id: bigint): Promise<Invitation>;
  getInvitationsByContactId(contactId: number): Promise<Invitation[]>;
  updateInvitationStatusByToken(token: string, status: InvitationStatus): Promise<Invitation>;
  updateInvitationStatusById(invite_id: bigint, status: InvitationStatus): Promise<Invitation>;
}
