import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MessageType } from '../entities/message.entity';
import { ApiProperty } from '@nestjs/swagger';
import { StoredFile, StoredFileDto } from 'src/files/types/storedFile';

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

  @ApiProperty({
    description: 'image(s) for the broadcast (file upload)',
    type: [StoredFileDto],
    required: false,
  })
  @IsOptional()
  media?: StoredFile[];
}
