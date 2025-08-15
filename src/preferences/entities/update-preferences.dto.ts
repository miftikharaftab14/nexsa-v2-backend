import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiProperty({
    description: 'this is name for preferences',
    example: 'sample',
    required: true,
  })
  @IsString()
  name: string;
}
