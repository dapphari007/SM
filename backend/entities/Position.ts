import { EntitySchema } from "typeorm";

export const position = {
  FRONTEND: 'frontend',
  BACKEND: 'backend',
  TESTING: 'testing',
  HR: 'hr'
} as const;

export type PositionType = typeof position[keyof typeof position];

export interface PositionEntity {
  id: number;
  name: string;
  
  // Relations
  user?: any;
}

export const Position = new EntitySchema<PositionEntity>({
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