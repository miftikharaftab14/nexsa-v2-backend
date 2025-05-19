import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';

export const ROLES_KEY = 'roles';

export type RoleType = UserRole;

export const Roles = (...roles: RoleType[]): CustomDecorator<string> => {
  return SetMetadata(ROLES_KEY, roles);
};
