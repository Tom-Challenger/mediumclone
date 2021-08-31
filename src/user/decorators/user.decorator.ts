import { ExpressRequestInterface } from './../../types/expressRequest.interface';
import { UserEntity } from './../user.entity';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: keyof UserEntity, ctx: ExecutionContext) => {
    const requset = ctx.switchToHttp().getRequest<ExpressRequestInterface>();

    if (!requset.user) {
      return null;
    }

    if (data) {
      return requset.user[data];
    }

    return requset.user;
  },
);
