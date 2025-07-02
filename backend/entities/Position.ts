import { EntitySchema } from "typeorm";
import { PositionType } from "../types/entities";

export const Position = new EntitySchema<PositionType>({
  name: "Position",
  tableName: "positions",
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
      inverseSide: "positions",
    }
  },
});