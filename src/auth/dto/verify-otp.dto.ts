import { IsEnum, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Examples } from 'src/common/enums/examples.enum';
import { Descriptions } from 'src/common/enums/descriptions.enum';
import { IsUSPhoneNumber } from 'src/common/validators/phone-number.validator';
import { OtpPurpose } from 'src/common/enums/otp.enum';
import { UserRole } from 'src/common/enums/user-role.enum';

export class VerifyOtpDto {
  @ApiProperty({
    description: Descriptions.PHONE_DESC,
    example: Examples.PHONE,
    required: true,
  })
  @IsNotEmpty()
  // @IsUSPhoneNumber({
  //   message: Descriptions.PHONE_FORMAT_DESC,
  // })
  phone_number: string;

  @ApiProperty({
    description: Descriptions.OTP_DESC,
    example: Examples.OTP_CODE,
    minLength: 6,
    maxLength: 6,
    required: true,
  })
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;

  @ApiProperty({
    description: Descriptions.PURPOSE_OF_OTP,
    enum: OtpPurpose,
    default: OtpPurpose.LOGIN,
    required: false,
  })
  @IsOptional()
  @IsEnum(OtpPurpose)
  purpose?: OtpPurpose;


  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
