// src/components/assessment/AssessmentForm.tsx
export interface Skill {
  id: number;
  name: string;
}

export interface SkillCategory {
  id: string;         // string ID for category
  name: string;       // category name (e.g., "Frontend Skills")
  skills: string[];   // skill names inside the category
}

export interface SkillAssessment {
  [skillId: number]: number | null;
}

export interface AssessmentFormProps {
  skillCategories: SkillCategory[];
  assessments: { [skillId: number]: number | null };
  isSubmitting: boolean;
  handleSkillLevelChange: (skillId: number, level: number) => void;
}

// src/components/assessment/PendingAssessmentsPage.tsx

export interface score {
  id: number;
  skillId: number;
  assessmentId: number;
  selfScore: number;
  leadScore: number | null;
  skill: Skill;
}

export interface Position {
  name: string;
}

export interface Team {
  name: string;
}

export interface Role {
  name: string;
}

export interface Lead {
  name: string;
}

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  position: Position;
  Team?: Team;
  role?: Role;
  leadId?: Lead;
}

export interface Assessment {
  id: number;
  userId: number;
  status: string;
  requestedAt: string;
  nextApprover: number;
  user: UserInfo;
  detailedScores: Score[];
}


// src/components/assessment/RatingControl.tsx

export interface RatingControlProps{
  value:number;
  onChange:(value:number)=>void;
  disabled?:boolean;
}


// src/components/assessment/SkillAssessment.tsx

export interface SkillCategory {
  id: string;
  name: string;
  skills: string[];
}


