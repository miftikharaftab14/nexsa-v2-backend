import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserType } from '../types/current-user.interface'; // adjust the path as needed
import { RequestWithUser } from '../types/request-with-user.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserType => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>(); // <- Type the request
    return request.user;
  },
);
