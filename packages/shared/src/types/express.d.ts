import { IUser } from '@reporunner/api-types';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
