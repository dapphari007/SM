import { AppDataSource } from "../config/dataSource";
import { Position as PositionEntity } from "../entities/Position";
import { Skill as SkillEntity } from "../entities/Skill";
import { SkillData } from "../types/services";
import { Skill, Position } from "../types/entities";

const skillRepo = AppDataSource.getRepository(SkillEntity);

const SkillService = {
  createSkill: async (skillData: SkillData): Promise<Skill> => {
    try {
      // Reset sequence to ensure proper ID generation
      await AppDataSource.query(`
        SELECT setval(
          pg_get_serial_sequence('skills', 'id'),
          (SELECT COALESCE(MAX(id), 0) FROM skills)
        )
      `);

      // Check if skill already exists
      const existingSkill = await skillRepo.findOneBy({ name: skillData.name });
      if (existingSkill) {
        throw new Error("Skill already exists");
      }

      // Create and save new skill
      const newSkill = skillRepo.create(skillData as any);
      const savedSkill = await skillRepo.save(newSkill);
      return savedSkill as unknown as Skill;
    } catch (error: any) {
      throw new Error(`Failed to create skill: ${error.message}`);
    }
  },

  updateSkill: async (updateData: SkillData): Promise<Skill> => {
    try {
      const { id } = updateData;
      const skill = await skillRepo.findOneBy({ id: id as number });
      if (!skill) {
        throw new Error("Skill not found");
      }

      // Check if name is being updated and if it conflicts with existing skill
      if (updateData.name && updateData.name !== skill.name) {
        const existingSkill = await skillRepo.findOneBy({
          name: updateData.name,
        });
        if (existingSkill) {
          throw new Error("Skill name already exists");
        }
      }

      // Merge and save updates
      skillRepo.merge(skill, updateData as any);
      return await skillRepo.save(skill);
    } catch (error: any) {
      throw new Error(`Failed to update skill: ${error.message}`);
    }
  },

  deleteSkillById: async (id: number): Promise<Skill> => {
    try {
      const skill = await skillRepo.findOneBy({ id });
      if (!skill) {
        throw new Error("Skill not found");
      }

      return await skillRepo.remove(skill);
    } catch (error: any) {
      throw new Error(`Failed to delete skill: ${error.message}`);
    }
  },

  getAllSkills: async (): Promise<Skill[]> => {
    try {
      return await skillRepo.find({
        order: { id: "ASC" } as any,
      });
    } catch (error: any) {
      throw new Error(`Failed to retrieve skills: ${error.message}`);
    }
  },

  getSkillById: async (id: number): Promise<Skill> => {
    try {
      const skill = await skillRepo.findOneBy({ id });
      if (!skill) {
        throw new Error("Skill not found");
      }
      return skill;
    } catch (error: any) {
      throw new Error(`Failed to retrieve skill: ${error.message}`);
    }
  },

  getSkillByPosition: async (position: number): Promise<Skill[]> => {
    try {
      const skills = await skillRepo
        .createQueryBuilder("skill")
        .where(":position = ANY(skill.position)", { position })
        .orderBy("skill.id", "ASC")
        .getMany();

      if (!skills.length) {
        throw new Error("No skills found for this position");
      }
      return skills;
    } catch (error: any) {
      throw new Error(
        `Failed to retrieve skills by position: ${error.message}`
      );
    }
  },

  getSkillsWithUpgradeGuides: async (): Promise<Skill[]> => {
    try {
      return await skillRepo.find({
        relations: ["upgradeGuides"],
        order: { name: "ASC" } as any,
      });
    } catch (error: any) {
      throw new Error(
        `Failed to retrieve skills with upgrade guides: ${error.message}`
      );
    }
  },

  searchSkills: async (searchTerm: string): Promise<Skill[]> => {
    try {
      return await skillRepo
        .createQueryBuilder("skill")
        .where("skill.name ILIKE :searchTerm", {
          searchTerm: `%${searchTerm}%`,
        })
        .orderBy("skill.name", "ASC")
        .getMany();
    } catch (error: any) {
      throw new Error(`Failed to search skills: ${error.message}`);
    }
  },
};

export default SkillService;