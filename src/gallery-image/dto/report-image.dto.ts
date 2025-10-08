import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportImageDto {
  @ApiProperty({
    description: 'ID of the gallery image to report',
    example: 1,
  })
  @IsNotEmpty()
  imageId: number;

  @ApiProperty({
    description: 'Optional description of why the image is being reported',
    example: 'Inappropriate content',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

