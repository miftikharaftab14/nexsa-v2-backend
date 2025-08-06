import { IsEnum, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum DeleteType {
  BROADCAST = 'broadcast',
  CHAT = 'chat',
}

export class DeleteItemDto {
  @ApiProperty({
    description: 'ID of the contact or broadcast',
    example: '1',
    type: String,
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Type of object to delete',
    enum: DeleteType,
    example: DeleteType.CHAT,
  })
  @IsEnum(DeleteType)
  type: DeleteType;
}

export class BulkDeleteDto {
  @ApiProperty({
    description: 'List of items to delete',
    type: [DeleteItemDto],
  })
  @ValidateNested({ each: true })
  @Type(() => DeleteItemDto)
  data: DeleteItemDto[];
}
