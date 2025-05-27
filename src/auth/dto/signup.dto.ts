import { IsString, IsEmail, IsEnum, ValidateIf, IsOptional } from 'class-validator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Examples } from 'src/common/enums/examples.enum';
import { Descriptions } from 'src/common/enums/descriptions.enum';
import { Messages } from 'src/common/enums/messages.enum';
import { IsUSPhoneNumber } from 'src/common/validators/phone-number.validator';

export class SignupDto {
  @ApiProperty({
    description: Descriptions.USERNAME_DESC,
    example: Examples.USERNAME,
    minLength: 3,
    maxLength: 50,
    type: 'string',
  })
  @IsString()
  username?: string;

  @ApiProperty({
    description: Descriptions.PHONE_DESC,
    example: Examples.PHONE,
    type: 'string',
  })
  @IsUSPhoneNumber({
    message: Descriptions.PHONE_FORMAT_DESC,
  })
  phone_number: string;

  @ApiProperty({
    description: Descriptions.EMAIL_DESC,
    example: Examples.EMAIL,
    required: false,
    type: 'string',
  })
  @ValidateIf((o: SignupDto) => o.role === UserRole.SELLER)
  @IsEmail({}, { message: Messages.INVALID_EMAIL })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: Descriptions.ROLE_DESC,
    enum: UserRole,
    example: UserRole.CUSTOMER,
    type: 'string',
  })
  @IsEnum(UserRole)
  role: UserRole;
}
