import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class UpdateExplainerFlagDto {
  @ApiProperty({
    description: 'Type of explainer to mark as seen',
    example: 'customer',
    enum: ['customer', 'seller'],
  })
  @IsString()
  @IsIn(['customer', 'seller'])
  type: 'customer' | 'seller';
}

