import { UserRole } from 'src/common/enums/user-role.enum';
import { User } from '../entities/user.entity';

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
export interface ExtendedUser extends User {
  presignedURL: string; // or any additional property
}
