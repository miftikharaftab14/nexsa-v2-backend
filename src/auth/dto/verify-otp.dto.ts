import { IsPhoneNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number of the user',
    example: '+1234567890',
  })
  @IsPhoneNumber()
  phone_number: string;

  @ApiProperty({
    description: 'OTP received on phone',
    example: '123456',
  })
  @IsString()
  otp: string;
}
