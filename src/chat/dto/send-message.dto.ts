import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MessageType } from '../entities/message.entity';
import { ApiProperty } from '@nestjs/swagger';
import { StoredFile, StoredFileDto } from 'src/files/types/storedFile';

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

  @ApiProperty({
    description: 'Profile image(s) for the gallery (file upload)',
    type: [StoredFileDto],
    required: false,
  })
  @IsOptional()
  media?: StoredFile[];
}
