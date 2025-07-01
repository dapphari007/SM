// Import entity types
import { 
  UserEntity, 
  SkillEntity, 
  RoleEntity, 
  PositionEntity, 
  TeamEntity, 
  ScoreEntity, 
  AssessmentRequestEntity,
  SkillUpgradeGuideEntity,
  AuditEntity,
  AuthEntity
} from '../entities';

// Define runtime types for entities
export type User = UserEntity;
export type Skill = SkillEntity;
export type Role = RoleEntity;
export type Position = PositionEntity;
export type Team = TeamEntity;
export type Score = ScoreEntity;
export type AssessmentRequest = AssessmentRequestEntity;
export type SkillUpgradeGuide = SkillUpgradeGuideEntity;
export type Audit = AuditEntity;
export type Auth = AuthEntity;