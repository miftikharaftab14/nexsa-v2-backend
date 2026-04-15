import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class UpdateInviteLinkDto {
  @ApiProperty({
    description: 'Custom invite path/slug for seller (no base URL). Must be unique.',
    example: 'my-custom-shop-link',
    required: true,
  })
  @IsString()
  @Length(3, 100)
  invite_url: string;
}

