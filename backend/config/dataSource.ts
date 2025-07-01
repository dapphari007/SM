import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { 
  User, 
  Skill, 
  AssessmentRequest, 
  SkillUpgradeGuide, 
  Role, 
  Score, 
  Team, 
  Position, 
  Auth, 
  Audit 
} from "../entities";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: [
    Auth,
    Skill,
    AssessmentRequest,
    SkillUpgradeGuide,
    Role,
    Score,
    Team,
    Position,
    User,
    Audit
  ],
});