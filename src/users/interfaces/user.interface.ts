import { UserRole } from 'src/common/enums/user-role.enum';

export interface IUser {
  id: number;
  username?: string;
  email?: string;
  phoneNumber: string;
  role?: UserRole;
  profilePicture?: string;
  aboutMe?: string;
  createdAt: Date;
  updatedAt: Date;
}
