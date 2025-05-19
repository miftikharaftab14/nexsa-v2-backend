import { IsString, IsPhoneNumber, IsEmail, IsEnum } from 'class-validator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({
    description: 'Username of the user',
    example: 'johndoe',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+1234567890',
  })
  @IsPhoneNumber()
  phone_number: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Role of the user',
    enum: UserRole,
    example: UserRole.CUSTOMER,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
