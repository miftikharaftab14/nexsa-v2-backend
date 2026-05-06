import { IsNumber, IsOptional } from 'class-validator';

export class DeleteMessageDto {
  @IsOptional()
  @IsNumber()
  contactId?: number;

  @IsOptional()
  @IsNumber()
  broadcastId?: number;

  @IsNumber()
  messageId: number;
}
