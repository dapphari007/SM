//controllers/AssessmetController

export interface SkillAssessment {
  skillId: number;
  selfScore: number;
}

export interface AssessmentPayload {
  userId: string;
  comments?: string;
  skillAssessments: SkillAssessment[];
  [key: string]: any;
}

export interface ReviewData {
  leadScore?: number;
  status?: string;
  comments?: string;
  [key: string]: any;
}

//controllers/authController

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
}

export interface MicrosoftAccount {
  name: string;
  username: string;
  homeAccountId: string;
}


//controller/SkillController

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

//controllers/SkillUpdateRequestController

export interface SkillScore {
  skillId: number;
  score: number;
}

export interface RequestPayload {
  userId?: string;
  editedSkillScore?: SkillScore[];
  skillScore: SkillScore[];
  comments?: string;
  status?: string;
}

export interface ReviewHistoryItem {
  createrRole: string;
  createdBy: string;
  createdAt: Date;
  comments?: string;
}

//controllers/SkillUpgradeGuideController

export interface GuideData {
  id?: number;
  skillId: number;
  fromLevel: number;
  toLevel: number;
  guidance?: string;
  resourceLink?: string;
  [key: string]: any;
}

//controllers/UserController

export interface UserData {
  userId?: string;
  name?: string;
  email?: string;
  roleId?: number;
  teamId?: number;
  positionId?: number;
  leadId?: number;
  hrId?: number;
  profilePhoto?: string;
  [key: string]: any;
}