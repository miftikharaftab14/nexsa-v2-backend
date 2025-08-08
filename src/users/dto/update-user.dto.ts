import { IsEmail, IsOptional, Length, IsEnum, IsString, IsUrl, IsBoolean } from 'class-validator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Examples } from 'src/common/enums/examples.enum';
import { Descriptions } from 'src/common/enums/descriptions.enum';
import { Transform } from 'class-transformer';
// import { IsUSPhoneNumber } from 'src/common/validators/phone-number.validator';

export class UpdateUserDto {
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
    required: false,
  })
  @ApiProperty({
    description: Descriptions.USER_LINK,
    example: Examples.LINK,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Link Validation Failed' }) // Add URL validation
  link?: string;

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
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    description: Descriptions.PROFILE_IMAGE_FILE,
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  image?: Express.Multer.File;

  @ApiProperty({
    description: Descriptions.USER_PREFERENCES,
    example: [Examples.PREFERENCES],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }): string[] => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.log(e);
      }
    }
    return value;
  })
  preferences?: string[];

  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;
}
