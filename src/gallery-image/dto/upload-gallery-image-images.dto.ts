import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class UploadGalleryImageImagesDto {
  @ApiProperty({
    description: 'ID of the galleries to attach images to',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  galleriesId: number;
}
