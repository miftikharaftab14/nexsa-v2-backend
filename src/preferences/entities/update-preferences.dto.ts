import { Length, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiProperty({
    description: 'this is name for preferences',
    example: 'sample',
    minLength: 3,
    maxLength: 50,
    required: true,
  })
  @IsString()
  @Length(3, 50)
  name: string;
}
