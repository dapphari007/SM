import { AssessmentStatus } from '../enum/enum';

export interface UserType {
  id: string;
  userId: string;
  name: string;
  email: string;
  roleId?: number;
  teamId?: number;
  positionId?: number;
  leadId?: string;
  hrId?: string;
  profilePhoto?: string;
  createdAt: Date;
  
  // Relations
  Requests?: AssessmentRequestType;
  role?: RoleType;
  position?: PositionType;
  Team?: TeamType;
  Audit?: AuditType;
}

export interface TeamType {
  id: number;
  name: string;
  
  // Relations
  user?: UserType;
}

export interface SkillUpgradeGuideType {
  id: number;
  fromLevel: number;
  toLevel: number;
  guidance: string;
  resourceLink?: string;
  skillId: number;
  
  // Relations
  skill?: SkillType;
}

export interface SkillType {
  id: number;
  name: string;
  low?: string;
  medium?: string;
  average?: string;
  high?: string;
  createdAt: Date;
  createdBy?: string;
  position?: number[];
  
  // Relations
  upgradeGuides?: SkillUpgradeGuideType;
  assessmentRequest?: AssessmentRequestType;
}

export interface ScoreType {
  id: number;
  assessmentId: number;
  selfScore?: number;
  leadScore?: number;
  updatedAt: Date;
  skillId: number;
  
  // Relations
  Skill?: SkillType;
  AssessmentRequest?: AssessmentRequestType;
}

export interface RoleType {
  id: number;
  name: string;
  
  // Relations
  user?: UserType;
}

export interface PositionType {
  id: number;
  name: string;
  
  // Relations
  user?: UserType;
}

export interface AuditType {
  id: number;
  assessmentId: number;
  auditType?: string;
  editorId: number;
  auditedAt: Date;
  createdAt: Date;
  comments?: string;
  cycleNumber?: number;
  
  // Relations
  User?: UserType;
  assessmentRequest?: AssessmentRequestType;
}

export interface AssessmentRequestType {
  id: number;
  userId: string;
  requestedAt: Date;
  status: AssessmentStatus;
  nextApprover?: number;
  
  // New workflow properties
  initiatedBy?: string;
  scheduledDate?: Date;
  completedAt?: Date;
  currentCycle?: number;
  nextScheduledDate?: Date;
  
  // Relations
  Score?: ScoreType[];
  user?: UserType;
  Audit?: AuditType;
  skill?: SkillType;
}

export interface AuthType {
  id: number;
  email: string;
  // passwordHash?: string; // For legacy login - commented out for OAuth only
  
  // Relations
  user?: UserType;
}