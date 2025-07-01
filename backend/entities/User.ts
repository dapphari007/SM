import { EntitySchema } from "typeorm";

export const role = {
  EMPLOYEE: "employee",
  LEAD: "lead",
  HR: "hr",
} as const;

export type RoleType = typeof role[keyof typeof role];

export const position = {
  FRONTEND: "frontend",
  BACKEND: "backend",
  TESTING: "testing",
  HR: "hr",
} as const;

export type PositionType = typeof position[keyof typeof position];

export const teamName = {
  INFORIVER: "inforiver",
  INFOBRIDGE: "infobridge",
  VALQ: "valq",
} as const;

export type TeamNameType = typeof teamName[keyof typeof teamName];

export interface UserEntity {
  id: number;
  userId: string;
  name: string;
  email: string;
  roleId?: number;
  teamId?: number;
  positionId?: number;
  leadId?: number;
  hrId?: number;
  profilePhoto?: string;
  createdAt: Date;
  
  // Relations
  Requests?: any;
  auth?: any;
  role?: any;
  position?: any;
  Team?: any;
  Audit?: any;
}

export const User = new EntitySchema<UserEntity>({
  name: "User",
  tableName: "users",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    userId: {
      type: "varchar",
      unique: true,
    },
    name: {
      type: "varchar",
    },
    email: {
      type: "varchar",
      unique: true,
    },
    roleId: {
      type: "integer",
      name: "role_id",
      nullable: true,
    },
    teamId: {
      type: "integer",
      name: "team_id",
      nullable: true,
    },
    positionId: {
      type: "integer",
      name: "position_id",
      nullable: true,
    },
    leadId: {
      type: "integer",
      nullable: true,
      name: "lead_id",
    },
    hrId: {
      type: "integer",
      nullable: true,
      name: "hr_id",
    },
    profilePhoto: {
      type: "text",
      nullable: true,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
  },
  relations: {
    leadId: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "lead_id",
        referencedColumnName: "id",
      },
    },
    hrId: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "hr_id",
        referencedColumnName: "id",
      },
    },
    Requests: {
      target: "AssessmentRequest",
      type: "one-to-many",
      inverseSide: "User",
    },
    auth: {
      target: "Auth",
      type: "one-to-one",
      inverseSide: "User",
    },
    role: {
      target: "Role",
      type: "many-to-one",
      joinColumn: {
        name: "role_id",
        referencedColumnName: "id",
      },
    },
    position: {
      target: "Position",
      type: "many-to-one",
      joinColumn: {
        name: "position_id",
        referencedColumnName: "id",
      },
    },
    Team: {
      target: "Team",
      type: "many-to-one",
      joinColumn: {
        name: "team_id",
        referencedColumnName: "id",
      },
    },
    Audit: {
      target: "Audit",
      type: "one-to-many",
      inverseSide: "User",
    },
  },
});