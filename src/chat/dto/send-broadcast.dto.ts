import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MessageType } from '../entities/message.entity';

export class SendBroadcastDto {
  @IsNumber()
  broadcastId: number;

  @IsNumber()
  senderId: number;

  @IsEnum(MessageType)
  messageType: MessageType;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  mediaKey?: string;
}
