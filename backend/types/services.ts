// Common types used across services

export interface UserData {
  id?: number;
  userId?: string;
  name?: string;
  email?: string;
  roleId?: number;
  role?: string | { id: number; name: string };
  teamId?: number;
  teamName?: string;
  positionId?: number;
  position?: string | { id: number; name: string };
  leadId?: number;
  hrId?: number;
  profilePhoto?: string;
  password?: string;
  [key: string]: any;
}

export interface SkillData {
  id?: number;
  name: string;
  low?: string;
  medium?: string;
  average?: string;
  high?: string;
  createdBy?: string;
  position?: number[];
  [key: string]: any;
}

export interface ScoreData {
  id?: number;
  assessmentId: number;
  skillId: number;
  selfScore?: number;
  leadScore?: number;
  updatedAt?: Date;
  Skill?: any;
}

export interface AssessmentData {
  id?: number;
  userId: string;
  requestedAt?: Date;
  status?: string;
  nextApprover?: number;
  comments?: string;
  skillAssessments?: SkillAssessmentData[];
}

export interface SkillAssessmentData {
  skillId: number;
  selfScore: number;
  leadScore?: number;
}

export interface GuideData {
  id?: number;
  skillId: number;
  fromLevel: number;
  toLevel: number;
  guidance?: string;
  resourceLink?: string;
}

export interface ReviewData {
  leadScore?: number;
  status?: string;
  comments?: string;
  [key: string]: any;
}