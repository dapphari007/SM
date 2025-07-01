export interface Skill {
  skill_id: number;
  skill_name: string;
  lead_score: number;
  targetLevel?: 4;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: string;
  };
  Team?: {
    id: string;
    name: string;
  };
  position?: {
    id: string;
    name: string;
  };
  leadId?: {
    name: string;
  };
  hrId?: {
    name: string;
  };
  userId?: string;
  createdAt?: string;
  skills?: Skill[];
  data?: Skill[];
}
