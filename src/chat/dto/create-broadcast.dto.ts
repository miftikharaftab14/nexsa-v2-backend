import { IsString, IsArray, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBroadcastDto {
  @ApiProperty({ description: 'Name of the broadcast', example: 'Promo Customers' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Message to send in the broadcast',
    example: 'Special offer for you!',
  })
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
    description: 'List of contact IDs to send the broadcast to',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  contactIds: number[];
}
