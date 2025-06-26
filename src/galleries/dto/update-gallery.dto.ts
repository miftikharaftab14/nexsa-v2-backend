import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
    description: 'Description of the gallery',
    example: 'A collection of modern art pieces',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
