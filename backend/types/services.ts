// Common types used across services
import { UserType } from "./entities";

export interface UserData {
  id?: string;
  name?: string;
  email?: string;
  roleId?: number;
  role?: string | { id: number; name: string };
  teamId?: number;
  teamName?: string;
  positionId?: number;
  position?: string | { id: number; name: string };
  leadId?: string;
  hrId?: string;
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
  leadScore: number;
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

export interface FilterOptions {
  role?: string;
  position?: string;
  teamName?: string;
  [key: string]: any;
}

export interface ScoreWithSkill {
  skillId: number;
  skillName: string;
  Score: number;
}

export interface UserWithScores extends UserType {
  mostRecentAssessmentScores: ScoreWithSkill[];
  hasRecentAssessment: boolean;
}

export interface LatestScore {
  id: number;
  self_score: number | null;
  lead_score: number | null;
  updated_at: Date;
  skill_name: string;
  skill_id: number;
  requestedAt: Date;
}