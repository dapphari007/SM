import { EntitySchema } from "typeorm";

export interface AssessmentCycleType {
  id: number;
  title: string;
  createdBy: string;
  scheduledDate?: Date;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  comments?: string;
  targetTeams?: string[];
  excludedUsers?: string[];
  totalAssessments: number;
  completedAssessments: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  assessments?: any[];
  skills?: any[];
  cycleSkills?: any[];
}

export const AssessmentCycle = new EntitySchema<AssessmentCycleType>({
  name: "AssessmentCycle",
  tableName: "assessment_cycles",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    title: {
      type: String,
      length: 255,
    },
    createdBy: {
      type: String,
      name: "created_by",
    },
    scheduledDate: {
      type: "timestamp",
      name: "scheduled_date",
      nullable: true,
    },
    status: {
      type: "enum",
      enum: ["ACTIVE", "COMPLETED", "CANCELLED"],
      default: "ACTIVE",
    },
    comments: {
      type: "text",
      nullable: true,
    },
    targetTeams: {
      type: "simple-array",
      name: "target_teams",
      nullable: true,
    },
    excludedUsers: {
      type: "simple-array",
      name: "excluded_users",
      nullable: true,
    },
    totalAssessments: {
      type: Number,
      name: "total_assessments",
      default: 0,
    },
    completedAssessments: {
      type: Number,
      name: "completed_assessments",
      default: 0,
    },
    createdAt: {
      type: "timestamp",
      name: "created_at",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      name: "updated_at",
      updateDate: true,
    },
  },
  relations: {
    assessments: {
      type: "one-to-many",
      target: "AssessmentRequest",
      inverseSide: "cycle",
    },
    cycleSkills: {
      type: "one-to-many",
      target: "AssessmentCycleSkill",
      inverseSide: "cycle",
    },
  },
});

export default AssessmentCycle;
