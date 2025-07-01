import { EntitySchema } from "typeorm";
import { SkillUpgradeGuideType } from "../types/entities";

export const SkillUpgradeGuide = new EntitySchema<SkillUpgradeGuideType>({
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