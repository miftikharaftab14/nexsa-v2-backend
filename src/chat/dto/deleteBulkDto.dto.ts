import { IsEnum, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum DeleteType {
  BROADCAST = 'broadcast',
  CHAT = 'chat',
  // add other types as needed
}

export class DeleteItemDto {
  @IsString()
  id: string;

  @IsEnum(DeleteType)
  type: DeleteType;
}

export class BulkDeleteDto {
  @ValidateNested({ each: true })
  @Type(() => DeleteItemDto)
  data: DeleteItemDto[];
}
