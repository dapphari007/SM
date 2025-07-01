import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { AssessmentRequest } from "../entities/AssessmentRequest";
import { Audit } from "../entities/Audit";
import { Position } from "../entities/Position";
import { Role } from "../entities/Role";
import { Score } from "../entities/Score";
import { Team } from "../entities/Team";
import { Skill } from "../entities/Skill";
import { User } from "../entities/User";
import { SkillUpgradeGuide } from "../entities/SkillUpgradeGuide";

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


export const userRepo = AppDataSource.getRepository(User);
export const roleRepo = AppDataSource.getRepository(Role);
export const positionRepo = AppDataSource.getRepository(Position);
export const teamRepo = AppDataSource.getRepository(Team);
export const assessmentRequestRepo = AppDataSource.getRepository(AssessmentRequest);
export const scoreRepo = AppDataSource.getRepository(Score);
export const skillRepo = AppDataSource.getRepository(Skill);
export const AuditRepo = AppDataSource.getRepository(Audit);
export const SkillUpgradeGuideRepo = AppDataSource.getRepository(SkillUpgradeGuide);