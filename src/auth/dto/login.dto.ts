import { IsNotEmpty, IsEnum, Allow } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Examples } from 'src/common/enums/examples.enum';
import { Descriptions } from 'src/common/enums/descriptions.enum';
import { UserRole } from 'src/common/enums/user-role.enum';
import { IsUSPhoneNumber } from 'src/common/validators/phone-number.validator';

export class LoginDto {
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
    description: Descriptions.ROLE_DESC,
    enum: UserRole,
    example: UserRole.CUSTOMER,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Temporary key from frontend for deep linking',
    required: false,
    example: 'some-temporary-token',
  })
  @Allow()
  deepLinktoken?: string;
}
