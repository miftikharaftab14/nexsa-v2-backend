import {
  IsString,
  IsArray,
  IsNotEmpty,
  IsOptional,
  ArrayNotEmpty,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBroadcastDto {
  @ApiProperty({
    description: 'Name of the broadcast',
    example: 'Promo Customers',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Message to send',
    example: 'Special offer for you!',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: 'S3 key for the uploaded media file (set automatically)',
    example: 'uploads/broadcasts/12345.jpg',
  })
  @IsString()
  @IsOptional()
  mediaKey?: string;

  @ApiProperty({
    description:
      'Array of contact IDs. In multipart/form-data, send as repeated fields: contactIds=1&contactIds=2',
    example: [1, 2],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  contactIds: number[];

  @ApiProperty({
    description: 'Media file (optional)',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  media?: any;
}
