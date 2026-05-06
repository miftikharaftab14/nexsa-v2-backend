import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class EditMessageDto {
  @IsOptional()
  @IsNumber()
  contactId?: number;

  @IsOptional()
  @IsNumber()
  broadcastId?: number;

  @IsNumber()
  messageId: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}
