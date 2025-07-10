import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StoredFile, StoredFileDto } from 'src/files/types/storedFile';

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
    description: 'Profile image(s) for the gallery (file upload)',
    type: () => StoredFileDto,
    required: false,
  })
  @IsOptional()
  image?: StoredFile;
}
