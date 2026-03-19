import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { Descriptions } from 'src/common/enums/descriptions.enum';
import { Examples } from 'src/common/enums/examples.enum';

export class InviteSellerDto {
  @ApiProperty({
    description: Descriptions.SELLER_ID_DESC,
    example: Examples.USER_ID,
    required: true,
  })
  @IsNumber()
  @Type(() => Number)
  seller_id: number;
}

