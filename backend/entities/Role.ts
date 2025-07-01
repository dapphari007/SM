import { EntitySchema } from "typeorm";

export const role = {
  EMPLOYEE: 'employee',
  LEAD: 'lead',
  HR: 'hr'
} as const;

export type RoleType = typeof role[keyof typeof role];

export interface RoleEntity {
  id: number;
  name: string;
  
  // Relations
  user?: any;
}

export const Role = new EntitySchema<RoleEntity>({
  name: "Role",
  tableName: "roles",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    name: {
      type: "varchar",
      unique: true,
    },
  },
  relations: {
    user: {
      target: "User",
      type: "one-to-many",
      inverseSide: "roles",
    }
  },
});