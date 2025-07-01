import { EntitySchema } from "typeorm";

export interface AuditEntity {
  id: number;
  assessmentId: number;
  auditType?: string;
  editorId: number;
  auditedAt: Date;
  comments?: string;
  
  // Relations
  User?: any;
  assessmentRequest?: any;
}

export const Audit = new EntitySchema<AuditEntity>({
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