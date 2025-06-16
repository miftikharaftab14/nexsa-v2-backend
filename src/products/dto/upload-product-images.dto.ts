import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class UploadProductImagesDto {
  @ApiProperty({
    description: 'ID of the product to attach images to',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  productId: number;
}
