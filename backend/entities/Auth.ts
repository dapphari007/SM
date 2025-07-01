import { EntitySchema } from "typeorm";

export interface AuthEntity {
  id: number;
  email: string;
  passwordHash?: string;
  
  // Relations
  user?: any;
}

export const Auth = new EntitySchema<AuthEntity>({
  name: "Auth",
  tableName: "auths",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    email: {
      type: "varchar",
      unique: true
    },
    passwordHash: {
      type: "varchar",
      nullable: true, 
      select: false,
    },
  },
  relations: {
    user: {
      target: "User",
      type: "many-to-one",
      joinColumn: {
        name: "email",
        referencedColumnName: "email"
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    }
  }
});