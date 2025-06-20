import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { Descriptions } from 'src/common/enums/descriptions.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiProperty({ description: 'Product name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Product description' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'ID of the category this product belongs to' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  categoryId: number;

  @ApiPropertyOptional({
    description: Descriptions.PRODUCT_IMAGES,
    type: 'array',
    items: {
      type: 'string',
      format: 'uri',
    },
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];
  @IsOptional()
  @IsArray()
  images?: Express.Multer.File[];
}
