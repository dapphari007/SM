import { EntitySchema } from "typeorm";
import { TeamType } from "../types/entities";

export const Team = new EntitySchema<TeamType>({
  name: "Team",
  tableName: "teams",
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
      inverseSide: "teams",
    }
  },
});