import { IsBoolean, IsOptional, IsString } from 'class-validator';
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

  @ApiProperty({
    description: 'Notification enable in gallery',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
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
