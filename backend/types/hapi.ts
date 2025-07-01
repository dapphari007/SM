import { Request, ResponseToolkit, ResponseObject, ReqRefDefaults } from '@hapi/hapi';

export interface AuthCredentials {
  user: {
    id: string;
    email: string;
    role?: string;
    [key: string]: any;
  };
  id?: string; // Added for backward compatibility
}

export interface AuthRequest extends Omit<Request<ReqRefDefaults>, 'auth'> {
  auth: {
    credentials: AuthCredentials;
    isAuthenticated?: boolean;
    isAuthorized?: boolean;
    artifacts?: any;
    error?: Error;
    mode?: string;
    strategy?: string;
    [key: string]: any;
  };
}

export type ControllerMethod = (
  request: Request | AuthRequest,
  h: ResponseToolkit
) => Promise<ResponseObject>;

export interface Controller {
  [key: string]: ControllerMethod;
}