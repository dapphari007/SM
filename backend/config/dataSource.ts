import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { AssessmentRequest } from "../entities/AssessmentRequest.new";
import { AssessmentCycle } from "../entities/AssessmentCycle.new";
import { AssessmentCycleSkill } from "../entities/AssessmentCycleSkill.new";
import { Audit } from "../entities/Audit";
import { Position } from "../entities/Position";
import { Role } from "../entities/Role";
import { Score } from "../entities/Score";
import { Team } from "../entities/Team";
import { Skill } from "../entities/Skill";
import { User } from "../entities/User";
import { SkillUpgradeGuide } from "../entities/SkillUpgradeGuide";
import { Auth } from "../entities/Auth";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false, // Disable for production - use migrations instead
  logging: false,
  entities: [
    Skill,
    AssessmentRequest,
    AssessmentCycle,
    AssessmentCycleSkill,
    SkillUpgradeGuide,
    Role,
    Score,
    Team,
    Position,
    User,
    Audit,
    Auth
  ],
});


export const userRepo = AppDataSource.getRepository(User);
export const roleRepo = AppDataSource.getRepository(Role);
export const positionRepo = AppDataSource.getRepository(Position);
export const teamRepo = AppDataSource.getRepository(Team);
export const assessmentRequestRepo = AppDataSource.getRepository(AssessmentRequest);
export const assessmentCycleRepo = AppDataSource.getRepository(AssessmentCycle);
export const assessmentCycleSkillRepo = AppDataSource.getRepository(AssessmentCycleSkill);
export const scoreRepo = AppDataSource.getRepository(Score);
export const skillRepo = AppDataSource.getRepository(Skill);
export const AuditRepo = AppDataSource.getRepository(Audit);
export const SkillUpgradeGuideRepo = AppDataSource.getRepository(SkillUpgradeGuide);