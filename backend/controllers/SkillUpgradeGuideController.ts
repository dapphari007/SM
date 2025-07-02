import SkillUpgradeGuideService from '../services/SkillUpgradeGuideService';
import { Request, ResponseToolkit } from '@hapi/hapi';
import { Controller } from '../types/hapi';
import {GuideData} from "../types/controller";


const SkillUpgradeGuideController: Controller = {
  getGuide: async (req: Request, h: ResponseToolkit) => {
    try {
      const payload = req.payload as any;
      const { skillId, fromLevel, toLevel } = payload;
      const guide = await SkillUpgradeGuideService.getGuide(skillId, fromLevel, toLevel);
      if (!guide) return h.response({ error: 'Guide not found' }).code(404);
      return h.response(guide).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  createGuide: async (req: Request, h: ResponseToolkit) => {
    try {
      const payload = req.payload as GuideData;
      if (!payload.skillId || !payload.fromLevel || !payload.toLevel)
        return h.response({error: 'Skill Id, fromLevel and toLevel are required'}).code(400);
      const newGuide = await SkillUpgradeGuideService.createGuide(payload);
      return h.response({success: true, message:"New Guide Created successfully!"}).code(201);
    } catch (err: any) {
      console.log('hit error', err);
      
      return h.response({ error: err.message }).code(400);
    }
  },

  updateGuide: async (req: Request, h: ResponseToolkit) => {
    try {
      const updated = await SkillUpgradeGuideService.updateGuide(req.payload as GuideData);
      return h.response(updated).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(404);
    }
  },

  getAllGuidesBySkillId: async (req: Request, h: ResponseToolkit) => {
    try {
      const guides = await SkillUpgradeGuideService.getAllGuidesBySkillId(req.params.skillId);
      return h.response(guides).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  }
};

export default SkillUpgradeGuideController;