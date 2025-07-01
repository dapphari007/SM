import SkillService from "../services/SkillService";
import UserService from "../services/UserService";
import { Request, ResponseToolkit } from '@hapi/hapi';
import { Controller, AuthRequest } from '../types/hapi';
import { SkillData } from "../types/controller";

const SkillController: Controller = {
  createSkill: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const payload = req.payload as any;
      if (!payload.name || !payload.position) {
        throw new Error("Name and position are required");
      }
      const SkillData: SkillData = {
        name: payload.name,
        low: payload.low,
        medium: payload.medium,
        average: payload.average,
        high: payload.high,
        createdBy: req.auth.credentials.user.id,
        position: payload.position,
      };
      const createdSkill = await SkillService.createSkill(SkillData);
      // Handle different possible return types from the service
      let skillName = '';
      let skillId = 0;
      
      if (Array.isArray(createdSkill) && createdSkill.length > 0) {
        skillName = createdSkill[0].name as string;
        skillId = createdSkill[0].id as number;
      } else if (createdSkill && typeof createdSkill === 'object') {
        skillName = (createdSkill as any).name || '';
        skillId = (createdSkill as any).id || 0;
      }
      
      return h
        .response({
          message: `Skill ${skillName} created successfully!`,
          id: skillId,
          name: skillName,
        })
        .code(201);
    } catch (err: any) {
      return h.response({ error: err.message }).code(400);
    }
  },

  updateSkill: async (req: Request, h: ResponseToolkit) => {
    try {
      const updatedSkill = await SkillService.updateSkill(req.payload as SkillData);
      return h
        .response({
          message: "Skill Updated Successfully!",
          id: updatedSkill.id,
          name: updatedSkill.name,
        })
        .code(200);
    } catch (error: any) {
      return h.response({ error: error.message }).code(400);
    }
  },

  deleteSkillById: async (req: Request, h: ResponseToolkit) => {
    try {
      const deletedSkill = await SkillService.deleteSkillById(req.params.id);
      return h
        .response({
          message: `Skill ${deletedSkill.name} deleted successfully!`,
          id: deletedSkill.id,
          name: deletedSkill.name,
        })
        .code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(404);
    }
  },

  getAllSkills: async (req: Request, h: ResponseToolkit) => {
    try {
      const skills = await SkillService.getAllSkills();
      return h.response(skills).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  getSkillById: async (req: Request, h: ResponseToolkit) => {
    try {
      const skill = await SkillService.getSkillById(req.params.id);
      if (!skill) return h.response({ error: "Skill not found" }).code(404);
      return h.response(skill).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  getSkillByPosition: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userId = req.auth.credentials.user.id;
      const user = await UserService.getUserById(userId);
      const skill = await SkillService.getSkillByPosition(user.positionId);
      return h.response(skill).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(404);
    }
  },
  
  getSkillsWithUpgradeGuides: async (req: Request, h: ResponseToolkit) => {
    try {
      const skills = await SkillService.getSkillsWithUpgradeGuides();
      return h.response(skills).code(200);
    } catch (err: any) {
      console.error(err);
      return h.response({ error: err.message }).code(500);
    }
  },
};

export default SkillController;