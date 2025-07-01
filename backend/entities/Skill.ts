import { EntitySchema } from "typeorm";

export interface SkillEntity {
  id: number;
  name: string;
  low?: string;
  medium?: string;
  average?: string;
  high?: string;
  createdAt: Date;
  createdBy?: string;
  position?: number[];
  
  // Relations
  upgradeGuides?: any;
  assessmentRequest?: any;
}

export const Skill = new EntitySchema<SkillEntity>({
  name: "Skill",
  tableName: "skills",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    name: {
      type: "varchar",
      unique: true,
    },
    low: {
      type: "text",
      nullable: true,
    },
    medium: {
      type: "text",
      nullable: true,
    },
    average: {
      type: "text",
      nullable: true,
    },
    high: {
      type: "text",
      nullable: true,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    createdBy: {
      type: "varchar",
      nullable: true,
    },
    position: {
      type: "int",
      array: true,
      nullable: true,
    },
  },
  relations: {
    upgradeGuides: {
      target: "SkillUpgradeGuide",
      type: "one-to-many",
      inverseSide: "skill",
    },
    assessmentRequest: {
      target: "AssessmentRequest",
      type: "one-to-many",
      inverseSide: "skill",
    }
  },
});