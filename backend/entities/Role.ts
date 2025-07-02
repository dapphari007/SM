import { EntitySchema } from "typeorm";
import { RoleType } from "../types/entities";

export const Role = new EntitySchema<RoleType>({
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