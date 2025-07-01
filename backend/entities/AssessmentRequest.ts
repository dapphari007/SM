import { EntitySchema } from "typeorm";

export type AssessmentStatus = "Pending" | "Approved" | "Cancelled" | "Forwarded";

export interface AssessmentRequestEntity {
  id: number;
  userId: string;
  requestedAt: Date;
  status: AssessmentStatus;
  nextApprover?: number;
  
  // Relations
  Score?: any;
  user?: any;
  Audit?: any;
  skill?: any;
}

export const AssessmentRequest = new EntitySchema<AssessmentRequestEntity>({
  name: "AssessmentRequest",
  tableName: "assessment_requests",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    userId: {
      type: "varchar",
    },
    requestedAt: {
      type: "timestamp",
      createDate: true,
    },
    status: {
      type: "enum",
      enum: ["Pending", "Approved", "Cancelled", "Forwarded"],
      default: "Pending",
    },
    nextApprover: {
      type: "integer",
      nullable: true,
    }
  },
  relations: {
    Score: {
      target: "Score",
      type: "one-to-many",
      inverseSide: "AssessmentRequest",
    },
    user: {
      target: "User",
      type: "many-to-one",
      joinColumn: {name: "userId"},
      onDelete: "CASCADE",
    },
    nextApprover: {
      target: "User",
      type: "many-to-one",
      joinColumn: {name: "nextApprover"},
      onDelete: "CASCADE",
    },
    Audit: {
      target: "Audit",
      type: "one-to-many",
      inverseSide: "AssessmentRequest",
      onDelete: "CASCADE",
    }
  },
});