import { EntitySchema } from "typeorm";

export interface ScoreEntity {
  id: number;
  assessmentId: number;
  selfScore?: number;
  leadScore?: number;
  updatedAt: Date;
  skillId: number;
  
  // Relations
  Skill?: any;
  AssessmentRequest?: any;
}

export const Score = new EntitySchema<ScoreEntity>({
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
    selfScore: {
      type: "int",
      nullable: true,
      name: "self_score",
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