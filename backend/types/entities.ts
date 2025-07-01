import { AssessmentStatus } from '../enum/enum';

export interface UserType {
  id: string;
  name: string;
  email: string;
  roleId?: number;
  teamId?: number;
  positionId?: number;
  leadId?: number;
  hrId?: number;
  profilePhoto?: string;
  createdAt: Date;
  
  // Relations
  Requests?: any;
  auth?: any;
  role?: any;
  position?: any;
  Team?: any;
  Audit?: any;
}

export interface TeamType {
  id: number;
  name: string;
  
  // Relations
  user?: any;
}

export interface SkillUpgradeGuideType {
  id: number;
  fromLevel: number;
  toLevel: number;
  guidance: string;
  resourceLink?: string;
  skillId: number;
  
  // Relations
  skill?: any;
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
  upgradeGuides?: any;
  assessmentRequest?: any;
}

export interface ScoreType {
  id: number;
  assessmentId: number;
  selfScore?: number;
  leadScore?: number;
  updatedAt: Date;
  skillId: number;
  
  // Relations
  Skill?: any;
  AssessmentRequest?: any;
}

export interface RoleType {
  id: number;
  name: string;
  
  // Relations
  user?: any;
}

export interface PositionType {
  id: number;
  name: string;
  
  // Relations
  user?: any;
}

export interface AuditType {
  id: number;
  assessmentId: number;
  auditType?: string;
  editorId: number;
  auditedAt: Date;
  comments?: string;
  
  // Relations
  User?: any;
  assessmentRequest?: any;
}

export interface AssessmentRequestType {
  id: number;
  userId: string;
  requestedAt: Date;
  status: AssessmentStatus;
  nextApprover?: number;
  
  // Relations
  Score?: any;
  user?: any;
  Audit?: any;
  skill?: any;
}