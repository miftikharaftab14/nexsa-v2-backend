import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserFlagsDto {
  @ApiProperty({
    description: 'Indicates whether the user has sent their first message',
    example: false,
    default: false,
  })
  @IsBoolean()
  first_message_send: boolean;

  @ApiProperty({
    description: 'Indicates whether the user has opened the gallery for the first time',
    example: false,
    default: false,
  })
  @IsBoolean()
  first_gallery_open: boolean;
}
