import { EntitySchema } from "typeorm";

export interface SkillUpgradeGuideEntity {
  id: number;
  fromLevel: number;
  toLevel: number;
  guidance: string;
  resourceLink?: string;
  skillId: number;
  
  // Relations
  skill?: any;
}

export const SkillUpgradeGuide = new EntitySchema<SkillUpgradeGuideEntity>({
  name: "SkillUpgradeGuide",
  tableName: "skill_upgrade_guide",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    fromLevel: {
      type: "int",
    },
    toLevel: {
      type: "int",
    },
    guidance: {
      type: "text",
    },
    resourceLink: {
      type: "text",
      nullable: true,
    },
    skillId: {
      type: "int",
    }
  },
  relations: {
    skill: {
      target: "Skill",
      type: "many-to-one",
      joinColumn: { name: "skillId" },
      onDelete: "CASCADE",
    },
  },
});