import { IsNotEmpty, IsEnum, Allow, IsOptional, IsNumber, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Examples } from 'src/common/enums/examples.enum';
import { Descriptions } from 'src/common/enums/descriptions.enum';
import { UserRole } from 'src/common/enums/user-role.enum';
import { IsUSPhoneNumber } from 'src/common/validators/phone-number.validator';
import { Type } from 'class-transformer';

export class LoginDto {
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
    description: Descriptions.ROLE_DESC,
    enum: UserRole,
    example: UserRole.CUSTOMER,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: Descriptions.DEVICE_TYPE,
    required: false,
    example: 'sample_type',
  })
  @IsOptional()
  deviceType: string;

  @ApiProperty({
    description: Descriptions.DEVICE_TOKEN,
    required: false,
    example: 'sample_token',
  })
  @IsOptional()
  deviceToken: string;
  @ApiProperty({
    description: Descriptions.DEVICE_OS,
    required: false,
    example: 'sample_OS',
  })
  @IsOptional()
  deviceOs: string;

  @ApiProperty({
    description: 'Temporary key from frontend for deep linking',
    required: false,
    example: 'some-temporary-token',
  })
  @Allow()
  deepLinktoken?: string;

  @ApiProperty({
    description: Descriptions.SELLER_ID_DESC,
    example: Examples.USER_ID,
    required: false,
  })
  @ValidateIf((o: LoginDto) => o.role === UserRole.CUSTOMER)
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  seller_id?: number;
}
