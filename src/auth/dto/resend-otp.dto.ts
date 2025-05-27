import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OtpPurpose } from '../../common/enums/otp.enum';
import { Descriptions } from 'src/common/enums/descriptions.enum';
import { Examples } from 'src/common/enums/examples.enum';

export class ResendOtpDto {
  @ApiProperty({
    description: Descriptions.PHONE_NUMBER_DESCRIPTION,
    example: Examples.PHONE,
  })
  @IsString()
  phone_number: string;

  @ApiProperty({
    description: Descriptions.PURPOSE_OF_OTP,
    enum: OtpPurpose,
    default: OtpPurpose.LOGIN,
    required: false,
  })
  @IsOptional()
  @IsEnum(OtpPurpose)
  purpose?: OtpPurpose;
}
