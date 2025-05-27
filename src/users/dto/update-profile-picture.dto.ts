import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfilePictureDto {
  @ApiProperty({
    description: 'Optional folder path where the image should be stored',
    example: 'profile-pictures',
    required: false,
  })
  @IsOptional()
  @IsString()
  folder?: string;
}
