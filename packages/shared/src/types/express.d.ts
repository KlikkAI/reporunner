import { IUser } from '@reporunner/shared';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
