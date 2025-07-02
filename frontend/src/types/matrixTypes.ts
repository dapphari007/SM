export interface SkillScore {
  skillId: number;
  skillName: string;
  Score: number;
}

export interface SkillMatrixData {
  id: number;
  userId: string;
  name: string;
  role: {
    id: number;
    name: string;
  };
  position: {
    id: number;
    name: string;
  };
  Team: {
    id: number;
    name: string;
  };
  mostRecentAssessmentScores: SkillScore[];
  hasRecentAssessment: boolean;
}

export interface Skill {
  id: number;
  name: string;
}