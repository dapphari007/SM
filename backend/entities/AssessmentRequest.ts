import { EntitySchema } from "typeorm";
import { AssessmentRequestType } from '../types/entities';
import { AssessmentStatus } from "../enum/enum";

export const AssessmentRequest = new EntitySchema<AssessmentRequestType>({
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
      enum: AssessmentStatus,
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