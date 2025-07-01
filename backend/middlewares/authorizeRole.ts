import Boom from "@hapi/boom";
import { Request, ResponseToolkit, RequestAuth } from "@hapi/hapi";

// Define types for the auth middleware
interface UserCredentials {
  user: {
    role: {
      name: string;
    };
  };
}

interface AuthenticatedRequest extends Request {
  auth: RequestAuth & {
    credentials: UserCredentials;
  };
}

const authorizeRoles = (allowedRoles: string[]) => {
  return {
    auth: "jwt",
    pre: [
      {
        method: (req: AuthenticatedRequest, h: ResponseToolkit) => {
          const user = req.auth.credentials.user;
          console.log(user);
          if (!user || !allowedRoles.includes(user.role.name)) {
            throw Boom.forbidden("Access Denied: Unauthorized access or insufficient permissions.");
          }

          return h.continue;
        },
      },
    ],
  };
};

export default authorizeRoles;
