import UserController from "../controllers/UserController";
// import { role } from "../entities/User";
import { role } from "../enum/enum";
import authorizeRoles from "../middlewares/authorizeRole";
import { ServerRegisterOptions } from "@hapi/hapi";

const userRoutes = {
  name: "user-routes",
  register: async function (server, options) {
    server.route([
      {
        method: "GET",
        path: "/profile",
        handler: UserController.getUserById,
      },
      {
        method: "POST",
        path: "/all-users", // has filters role, position
        options: authorizeRoles([role.LEAD,role.HR]),
        handler: UserController.getAllUsers,
      },
      {
        method: "POST",
        path: "/create",
        options: authorizeRoles([role.HR]),
        handler: UserController.createUser,
      },
      {
        method: "POST",
        path: "/update",
        options: authorizeRoles([role.HR]),
        handler: UserController.updateUser,
      },
      {
        method: "DELETE",
        path: "/delete/{id}",
        options: authorizeRoles([role.HR]),
        handler: UserController.deleteUser,
      },
      {
        method: "GET",
        path: "/matrix/team/{teamName}",
        options: authorizeRoles([role.LEAD]),
        handler: UserController.getTeamMatrix,
      },
      {
        method: "GET",
        path: "/matrix/full",
        options: authorizeRoles([role.HR]),
        handler: UserController.getFullMatrix,
      },
      {
        method: "GET",
        path: "/details",
        handler: UserController.getAllDetails,
      },
      {
        method: "GET",
        path: "/teams/{teamId}",
        options: authorizeRoles([role.LEAD, role.HR]),
        handler: UserController.getTeamMemebers,
      },
    ]);
  },
};

export default userRoutes;