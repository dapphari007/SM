import { EntitySchema } from "typeorm";
import { ScoreType } from "../types/entities";

export const Score = new EntitySchema<ScoreType>({
  name: "Score",
  tableName: "scores",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    assessmentId: {
      type: "int",
      name: "assessment_id",
    },

    leadScore: {
      type: "int",
      nullable: true,
      name: "lead_score",
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
      name: "updated_at",
    },
    skillId: {
      type: "int",
      name: "skill_id",
    },
  },
  relations: {
    Skill: {
      target: "Skill",
      type: "many-to-one",
      joinColumn: {
        name: "skill_id",
      },
      onDelete: "CASCADE",
    },
    AssessmentRequest: {
      target: "AssessmentRequest",
      type: "many-to-one",
      joinColumn: {
        name: "assessment_id",
        referencedColumnName: "id",
      },
      onDelete: "CASCADE",
    },
  },
});