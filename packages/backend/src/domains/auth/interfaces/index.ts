/**
 * Auth domain interfaces
 */

export interface IAuthRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface IAuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  token: string;
}

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}