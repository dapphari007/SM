import { EntitySchema } from "typeorm";
import { AuditType } from '../types/entities';

export const Audit = new EntitySchema<AuditType>({
  name: "Audit",
  tableName: "audit",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    assessmentId: {
      type: "int",
    },
    auditType: {
      type: "varchar",
      nullable: true,
    },
    editorId: {
      type: "int",
    },
    auditedAt: {
      type: "timestamp",
      createDate: true,
    },
    comments: {
      type: "text",
      nullable: true,
    },
    cycleNumber: {
      type: "int",
      nullable: true,
      name: "cycle_number",
    }
  },
  relations: {
    User: {
      target: "User",
      type: "many-to-one",
      joinColumn:{
        name:"editorId"
      },
      onDelete: "CASCADE",
    },
    assessmentRequest: {
      target: "AssessmentRequest",
      type: "many-to-one",
      joinColumn:{
        name:"assessmentId"
      },
      onDelete: "CASCADE",
    }
  },
});