import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class EditMessageDto {
  @IsNumber()
  contactId: number;

  @IsNumber()
  messageId: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}
