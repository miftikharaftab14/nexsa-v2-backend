import { IsEmail, IsNotEmpty, IsOptional, Length, IsEnum, IsString } from 'class-validator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Examples } from 'src/common/enums/examples.enum';
import { Descriptions } from 'src/common/enums/descriptions.enum';
import { IsUSPhoneNumber } from 'src/common/validators/phone-number.validator';

export class CreateUserDto {
  @ApiProperty({
    description: Descriptions.USERNAME_DESC,
    example: Examples.USERNAME,
    minLength: 3,
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  username?: string;

  @ApiProperty({
    description: Descriptions.EMAIL_DESC,
    example: Examples.EMAIL,
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: Descriptions.PHONE_DESC,
    example: Examples.PHONE,
    required: true,
  })
  @IsNotEmpty()
  @IsUSPhoneNumber({
    message: Descriptions.PHONE_FORMAT_DESC,
  })
  phone_number: string;

  @ApiProperty({
    description: Descriptions.PROFILE_PICTURE_DESC,
    example: Examples.PROFILE_PICTURE,
    required: false,
  })
  @IsOptional()
  @IsString()
  profile_picture?: string;

  @ApiProperty({
    description: Descriptions.ABOUT_ME_DESC,
    example: Examples.ABOUT_ME,
    required: false,
  })
  @IsOptional()
  @IsString()
  about_me?: string;

  @ApiProperty({
    description: Descriptions.ROLE_DESC,
    enum: UserRole,
    example: UserRole.CUSTOMER,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
