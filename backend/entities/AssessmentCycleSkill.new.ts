import { EntitySchema } from "typeorm";

export interface AssessmentCycleSkillType {
  cycleId: number;
  skillId: number;
  // Relations
  cycle?: any;
  skill?: any;
}

export const AssessmentCycleSkill = new EntitySchema<AssessmentCycleSkillType>({
  name: "AssessmentCycleSkill",
  tableName: "assessment_cycle_skills",
  columns: {
    cycleId: {
      type: Number,
      name: "cycle_id",
      primary: true,
    },
    skillId: {
      type: Number,
      name: "skill_id",
      primary: true,
    },
  },
  relations: {
    cycle: {
      type: "many-to-one",
      target: "AssessmentCycle",
      joinColumn: {
        name: "cycle_id",
      },
    },
    skill: {
      type: "many-to-one",
      target: "Skill",
      joinColumn: {
        name: "skill_id",
      },
    },
  },
});

export default AssessmentCycleSkill;
