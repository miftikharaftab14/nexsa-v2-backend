import { IsNumber } from 'class-validator';

export class MarkReadChatDto {
  @IsNumber()
  contactId: number;
}
