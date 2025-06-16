import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { Descriptions } from 'src/common/enums/descriptions.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Express } from 'express';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  categoryId: number;

  @ApiProperty({
    description: Descriptions.PRODUCT_IMAGES,
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    required: false,
  })
  @IsOptional()
  @IsArray()
  images?: Express.Multer.File[];
}
