import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GalleryType } from 'src/common/enums/gallery-type.enum';

export class CreateGalleryDto {
  @ApiProperty({
    description: 'Gallery type',
    enum: GalleryType,
    example: GalleryType.GALLERY,
  })
  @IsEnum(GalleryType)
  type: GalleryType;

  @ApiProperty({
    description: 'Name of the gallery',
    example: 'Modern Art',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the gallery',
    example: 'A collection of modern art pieces',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Required when type is link',
    example: 'https://example.com/portfolio',
    required: false,
  })
  @ValidateIf(o => o.type === GalleryType.LINK)
  @IsNotEmpty()
  @IsUrl()
  url?: string;
}
