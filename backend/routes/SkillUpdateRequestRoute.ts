import SkillUpdateRequestController from "../controllers/SkillUpdateRequestController";
import { role } from "../enum/enum";
import authorizeRoles from "../middlewares/authorizeRole";
import { ServerRegisterOptions } from "@hapi/hapi";

const requestRoutes = {
  name: "request-routes",
  register: async function (server, options) {
    server.route([
      {
        method: "POST",
        path: "/create",
        options: authorizeRoles([role.EMPLOYEE, role.LEAD]),
        handler: SkillUpdateRequestController.createRequest,
      },
      {
        method: "GET",
        path: "/{id}",
        options: authorizeRoles([role.LEAD, role.HR]),
        handler: SkillUpdateRequestController.getRequestById,
      },
      {
        method: "GET",
        path: "/get-requests",
        handler: SkillUpdateRequestController.getRequestForUser,
      },
      {
        method: "GET",
        path: "/all-requests",
        handler: SkillUpdateRequestController.getAllRequests,
      },
      {
        method: "GET",
        path: "/pending",
        options: authorizeRoles([role.LEAD, role.HR]),
        handler: SkillUpdateRequestController.getPendingRequests,
      },
      {
        method: "POST",
        path: "/review/{id}",
        options: authorizeRoles([role.LEAD,role.HR]),
        handler: SkillUpdateRequestController.updateRequestStatus,
      },
      {
        method: "DELETE",
        path: "/cancel/{id}",
        handler: SkillUpdateRequestController.cancelRequest,
      }
    ]);
  },
};

export default requestRoutes;