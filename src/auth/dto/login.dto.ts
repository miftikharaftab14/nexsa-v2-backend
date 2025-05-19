import { IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Phone number of the user',
    example: '+1234567890',
    required: true,
  })
  @IsPhoneNumber()
  phone_number: string;
}
