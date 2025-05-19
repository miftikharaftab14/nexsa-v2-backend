import { UserRole } from 'src/common/enums/user-role.enum';

export class UserResponseDto {
  id: number;
  username: string;
  email: string;
  phone_number?: string;
  role: UserRole;
  profile_picture?: string;
  aboutMe?: string;
  created_at: Date;
  updated_at: Date;
}
