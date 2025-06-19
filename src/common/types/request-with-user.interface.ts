import { Request } from 'express';
import { CurrentUserType } from './current-user.interface';

export interface RequestWithUser extends Request {
  user: CurrentUserType;
}
