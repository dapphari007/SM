import { AppDataSource } from "../config/dataSource";
import { SkillUpgradeGuide as SkillUpgradeGuideEntity } from "../entities/SkillUpgradeGuide";
import { Skill as SkillEntity } from "../entities/Skill";
import { GuideData } from "../types/services";
import { SkillUpgradeGuideType, SkillType } from "../types/entities";

const skillUpgradeGuideRepo = AppDataSource.getRepository(SkillUpgradeGuideEntity);
const skillRepo = AppDataSource.getRepository(SkillEntity);

const SkillUpgradeGuideService = {
  getGuide: async (skillId: number, fromLevel: number, toLevel: number): Promise<SkillUpgradeGuideType> => {
    try {
      const guide = await skillUpgradeGuideRepo.findOne({
        where: { skillId: skillId, fromLevel: fromLevel, toLevel: toLevel },
        relations: ["skill"],
      });

      if (!guide) {
        throw new Error("Guide not found");
      }

      return guide;
    } catch (error: any) {
      throw new Error(`Failed to retrieve guide: ${error.message}`);
    }
  },

  createGuide: async (data: GuideData): Promise<SkillUpgradeGuideType> => {
    try {
      await AppDataSource.query(`
        SELECT setval(
          pg_get_serial_sequence('skill_upgrade_guide', 'id'),
          (SELECT COALESCE(MAX(id), 0) FROM skill_upgrade_guide)
        )
      `);

      // Validate that the skill exists
      const skill = await skillRepo.findOneBy({ id: data.skillId });
      if (!skill) {
        throw new Error("Skill not found");
      }

      // Check if guide already exists for this skill and level combination
      const existingGuide = await skillUpgradeGuideRepo.findOne({
        where: {
          skillId: data.skillId,
          fromLevel: data.fromLevel,
          toLevel: data.toLevel,
        },
      });

      if (existingGuide) {
        throw new Error(
          "Guide already exists for this skill and level combination"
        );
      }

      // Validate level progression
      if (data.fromLevel >= data.toLevel) {
        throw new Error("From level must be less than to level");
      }

      const newGuide = skillUpgradeGuideRepo.create(data);
      const savedGuide = await skillUpgradeGuideRepo.save(newGuide);
      return savedGuide;
    } catch (error: any) {
      throw new Error(`Failed to create guide: ${error.message}`);
    }
  },

  updateGuide: async (data: GuideData): Promise<SkillUpgradeGuideType> => {
    try {
      const id = data.id;
      const guide = await skillUpgradeGuideRepo.findOne({
        where: { id: id as number },
        relations: ["skill"],
      });

      if (!guide) {
        throw new Error("Guide not found");
      }

      // If updating skill ID, validate the new skill exists
      if (data.skillId && data.skillId !== guide.skillId) {
        const skill = await skillRepo.findOneBy({ id: data.skillId });
        if (!skill) {
          throw new Error("New skill not found");
        }
      }

      // Validate level progression if levels are being updated
      const fromLevel = data.fromLevel || guide.fromLevel;
      const toLevel = data.toLevel || guide.toLevel;

      if (fromLevel >= toLevel) {
        throw new Error("From level must be less than to level");
      }

      // Check for conflicts if key fields are being updated
      if (data.skillId || data.fromLevel || data.toLevel) {
        const conflictGuide = await skillUpgradeGuideRepo.findOne({
          where: {
            skillId: data.skillId || guide.skillId,
            fromLevel: data.fromLevel || guide.fromLevel,
            toLevel: data.toLevel || guide.toLevel,
          },
        });

        if (conflictGuide && conflictGuide.id !== id) {
          throw new Error(
            "Another guide already exists for this skill and level combination"
          );
        }
      }

      skillUpgradeGuideRepo.merge(guide, data);
      return await skillUpgradeGuideRepo.save(guide);
    } catch (error: any) {
      throw new Error(`Failed to update guide: ${error.message}`);
    }
  },

  deleteGuide: async (id: number): Promise<SkillUpgradeGuideType> => {
    try {
      const guide = await skillUpgradeGuideRepo.findOneBy({ id });
      if (!guide) {
        throw new Error("Guide not found");
      }

      return await skillUpgradeGuideRepo.remove(guide);
    } catch (error: any) {
      throw new Error(`Failed to delete guide: ${error.message}`);
    }
  },

  getAllGuidesBySkillId: async (skillId: number): Promise<SkillUpgradeGuideType[]> => {
    try {
      // Validate that the skill exists
      const skill = await skillRepo.findOneBy({ id: skillId });
      if (!skill) {
        throw new Error("Skill not found");
      }

      const guides = await skillUpgradeGuideRepo.find({
        where: { skillId: skillId },
        relations: ["skill"],
        order: { fromLevel: "ASC", toLevel: "ASC" },
      });

      return guides;
    } catch (error: any) {
      throw new Error(`Failed to retrieve guides for skill: ${error.message}`);
    }
  },

  getAllGuides: async (): Promise<SkillUpgradeGuideType[]> => {
    try {
      return await skillUpgradeGuideRepo.find({
        relations: ["skill"],
        order: { skillId: "ASC", fromLevel: "ASC", toLevel: "ASC" },
      });
    } catch (error: any) {
      throw new Error(`Failed to retrieve all guides: ${error.message}`);
    }
  },

  getGuidesByLevelRange: async (skillId: number, currentLevel: number): Promise<SkillUpgradeGuideType[]> => {
    try {
      const skill = await skillRepo.findOneBy({ id: skillId });
      if (!skill) {
        throw new Error("Skill not found");
      }

      const guides = await skillUpgradeGuideRepo.find({
        where: { skillId: skillId, fromLevel: currentLevel },
        relations: ["skill"],
        order: { toLevel: "ASC" },
      });

      return guides;
    } catch (error: any) {
      throw new Error(
        `Failed to retrieve guides for level range: ${error.message}`
      );
    }
  },

  getGuideById: async (id: number): Promise<SkillUpgradeGuideType> => {
    try {
      const guide = await skillUpgradeGuideRepo.findOne({
        where: { id },
        relations: ["skill"],
      });

      if (!guide) {
        throw new Error("Guide not found");
      }

      return guide;
    } catch (error: any) {
      throw new Error(`Failed to retrieve guide: ${error.message}`);
    }
  },
};

export default SkillUpgradeGuideService;