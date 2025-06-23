import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }): string[] => {
    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
          return parsed;
        }
        return [];
      } catch {
        return [];
      }
    }
    return value;
  })
  mediaUrls?: string[];

  // @ApiProperty({
  //   description: 'Optional product images (files)',
  //   type: 'string',
  //   format: 'binary',
  //   isArray: true,
  //   required: false,
  // })
  // @IsOptional()
  // @IsArray()
  // images?: Express.Multer.File[];
}
