import { EntitySchema } from "typeorm";
import { AssessmentStatus } from "../enum/enum";

export interface AssessmentRequestType {
  id: number;
  userId: string;
  cycleId?: number;
  status: AssessmentStatus;
  initiatedBy: string;
  nextApprover?: number;
  scheduledDate?: Date;
  currentCycle: number;
  nextScheduledDate?: Date;
  comments?: string;
  leadAssessmentDate?: Date;
  employeeResponseDate?: Date;
  employeeApproved?: boolean;
  employeeComments?: string;
  hrFinalDecision?: "APPROVED" | "REJECTED";
  hrComments?: string;
  isAccessible: boolean;
  requestedAt: Date;
  updatedAt: Date;
  // Relations
  user?: any;
  cycle?: any;
  scores?: any[];
  // Virtual properties for compatibility
  detailedScores?: any[];
  history?: any[];
}

export const AssessmentRequest = new EntitySchema<AssessmentRequestType>({
  name: "AssessmentRequest",
  tableName: "assessment_requests",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    userId: {
      type: String,
      name: "user_id",
    },
    cycleId: {
      type: Number,
      name: "cycle_id",
      nullable: true,
    },
    status: {
      type: "enum",
      enum: AssessmentStatus,
      default: AssessmentStatus.INITIATED,
    },
    initiatedBy: {
      type: String,
      name: "initiated_by",
    },
    nextApprover: {
      type: Number,
      name: "next_approver",
      nullable: true,
    },
    scheduledDate: {
      type: "timestamp",
      name: "scheduled_date",
      nullable: true,
    },
    currentCycle: {
      type: Number,
      name: "current_cycle",
      default: 1,
    },
    nextScheduledDate: {
      type: "timestamp",
      name: "next_scheduled_date",
      nullable: true,
    },
    comments: {
      type: "text",
      nullable: true,
    },
    leadAssessmentDate: {
      type: "timestamp",
      name: "lead_assessment_date",
      nullable: true,
    },
    employeeResponseDate: {
      type: "timestamp",
      name: "employee_response_date",
      nullable: true,
    },
    employeeApproved: {
      type: Boolean,
      name: "employee_approved",
      nullable: true,
    },
    employeeComments: {
      type: "text",
      name: "employee_comments",
      nullable: true,
    },
    hrFinalDecision: {
      type: "enum",
      name: "hr_final_decision",
      enum: ["APPROVED", "REJECTED"],
      nullable: true,
    },
    hrComments: {
      type: "text",
      name: "hr_comments",
      nullable: true,
    },
    isAccessible: {
      type: Boolean,
      name: "is_accessible",
      default: true,
    },
    requestedAt: {
      type: "timestamp",
      name: "requested_at",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      name: "updated_at",
      updateDate: true,
    },
  },
  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "user_id",
      },
      eager: true,
    },
    cycle: {
      type: "many-to-one",
      target: "AssessmentCycle",
      joinColumn: {
        name: "cycle_id",
      },
      nullable: true,
    },
    scores: {
      type: "one-to-many",
      target: "Score",
      inverseSide: "assessment",
    },
  },
});
