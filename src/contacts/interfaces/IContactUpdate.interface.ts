import { UpdateContactDto } from '../dto/update-contact.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { Contact } from '../entities/contact.entity';

export interface IContactUpdate {
  update(id: number, updateContactDto: UpdateContactDto): Promise<ApiResponse<Contact>>;
  // Add other method signatures as needed
  findAllByInvitedUserId(id: bigint): Promise<Contact[]>;
}
