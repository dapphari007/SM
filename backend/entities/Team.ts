import { EntitySchema } from "typeorm";

export interface TeamEntity {
  id: number;
  name: string;
  
  // Relations
  user?: any;
}

export const Team = new EntitySchema<TeamEntity>({
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