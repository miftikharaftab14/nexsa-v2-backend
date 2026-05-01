import { IsNumber } from 'class-validator';

export class DeleteMessageDto {
  @IsNumber()
  contactId: number;

  @IsNumber()
  messageId: number;
}
