import { IsEmail, IsNotEmpty, IsOptional, Length, IsEnum } from 'class-validator';
import { UserRole } from 'src/common/enums/user-role.enum';

export class CreateUserDto {
  @IsOptional()
  @Length(3, 50)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsNotEmpty()
  phone_number: string;

  @IsOptional()
  profilePicture?: string;

  @IsOptional()
  aboutMe?: string;

  @IsEnum(UserRole)
  role: UserRole;
}
