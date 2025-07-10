import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MessageType } from '../entities/message.entity';

export class SendMessageDto {
  @IsNumber()
  contactId: number;

  @IsNumber()
  senderId: number;

  @IsEnum(MessageType)
  messageType: MessageType;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  image?: string;
}
