import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGalleryDto {
  @ApiProperty({
    description: 'Name of the gallery',
    example: 'Modern Art',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  notificationsEnabled?: boolean;

  @ApiProperty({
    description: 'Profile image for the gallery (file upload)',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  image?: any; // Will be handled by multer, not validated by class-validator
}
