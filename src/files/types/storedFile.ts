import { ApiProperty } from '@nestjs/swagger';

export interface StoredFile {
  key: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  folder: string;
}

export class StoredFileDto {
  @ApiProperty({ example: 'uploads/user-uploads/123e4567-e89b-12d3-a456-426614174000' })
  key: string;

  @ApiProperty({ example: 'image1.png' })
  originalName: string;

  @ApiProperty({
    example:
      'https://bucket.s3.amazonaws.com/uploads/user-uploads/123e4567-e89b-12d3-a456-426614174000',
  })
  url: string;

  @ApiProperty({ example: 'image/png' })
  mimeType: string;

  @ApiProperty({ example: 102400 })
  size: number;

  @ApiProperty({ example: 'uploads/user-uploads' })
  folder: string;
}
