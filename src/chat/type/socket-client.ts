import { Socket } from 'socket.io';
import { User } from 'src/users/entities/user.entity';

export interface AuthenticatedSocket extends Socket {
  user: User;
}
