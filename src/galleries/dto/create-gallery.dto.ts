import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGalleryDto {
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
}
