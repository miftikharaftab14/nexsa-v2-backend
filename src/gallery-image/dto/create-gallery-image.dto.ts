import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { StoredFile, StoredFileDto } from 'src/files/types/storedFile';

export class CreateGalleryImageDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  galleryId: number;

  @ApiProperty({
    description: 'Profile image(s) for the gallery (file upload)',
    type: [StoredFileDto],
    required: false,
  })
  @IsOptional()
  image?: StoredFile[];
}
