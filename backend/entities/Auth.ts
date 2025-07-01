import { EntitySchema } from "typeorm";
import { AuthType } from "../types/entities";

export const Auth = new EntitySchema<AuthType>({
  name: "Auth",
  tableName: "auths",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    email: {
      type: "varchar",
      unique: true,
      nullable: false,
    },
    // passwordHash: {
    //   type: "varchar",
    //   nullable: true,
    //   select: false, // Don't select by default for security
    // },
  },
  relations: {
    user: {
      target: "User", 
      type: "one-to-one",
      joinColumn: {
        name: "email",
        referencedColumnName: "email",
      },
      cascade: false,
    },
  },
});
