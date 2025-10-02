import { IUser } from '@reporunner/types';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
