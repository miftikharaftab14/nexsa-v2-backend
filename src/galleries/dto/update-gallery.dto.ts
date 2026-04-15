import { IsBoolean, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StoredFile, StoredFileDto } from 'src/files/types/storedFile';
import { GalleryType } from 'src/common/enums/gallery-type.enum';

export class UpdateGalleryDto {
  @ApiProperty({
    description: 'Gallery type',
    enum: GalleryType,
    example: GalleryType.LINK,
    required: false,
  })
  @IsOptional()
  @IsEnum(GalleryType)
  type?: GalleryType;

  @ApiProperty({
    description: 'Name of the gallery',
    example: 'Modern Art',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Description of the gallery',
    example: 'A collection of modern art pieces',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Link URL (required if gallery type is link)',
    example: 'https://example.com/portfolio',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  url?: string;

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
