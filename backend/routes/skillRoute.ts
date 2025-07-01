import SkillController from "../controllers/SkillController";
import { role } from "../entities/User";
import authorizeRoles from "../middlewares/authorizeRole";
import { ServerRegisterOptions } from "@hapi/hapi";

const skillRoutes = {
  name: "skill-routes",
  register: async function (server, options) {
    server.route([
      {
        method: "GET",
        path: "/{id}",
        handler: SkillController.getSkillById,
      },
      {
        method: "GET",
        path: "/all-skills",
        options: authorizeRoles([role.HR, role.LEAD]),
        handler: SkillController.getAllSkills,
      },
      {
        method: "POST",
        path: "/create",
        options: authorizeRoles([role.HR]),
        handler: SkillController.createSkill,
      },
      {
        method: "POST",
        path: "/update",
        options: authorizeRoles([role.HR]),
        handler: SkillController.updateSkill,
      },
      {
        method: "DELETE",
        path: "/delete/{id}",
        options: authorizeRoles([role.HR]),
        handler: SkillController.deleteSkillById,
      },
      {
        method: "GET",
        path: "/position",
        handler: SkillController.getSkillByPosition,
      },
      {
        method: "GET",
        path: "/guide",
        handler: SkillController.getSkillsWithUpgradeGuides,
      },
    ]);
  },
};

export default skillRoutes;