import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiProperty({
    description: 'Name of the category',
    example: 'Electronics',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
}
