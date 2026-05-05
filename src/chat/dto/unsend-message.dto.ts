import { IsNumber } from 'class-validator';

export class UnsendMessageDto {
  @IsNumber()
  contactId: number;

  @IsNumber()
  messageId: number;
}
