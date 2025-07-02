//components/teams/TeamOverviewPage

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email?: string;
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
  mostRecentAssessmentScores: Array<{
    skillId: number;
    skillName: string;
    Score: number;
  }>;
  hasRecentAssessment: boolean;
}

export interface SkillScore {
  id: number;
  self_score: number;
  lead_score: number;
  updated_at: string;
  skill_name: string;
  skill_id: number;
  requestedAt: string;
}

export interface SkillModalData {
  memberName: string;
  skills: SkillScore[];
}


//components/teams/UserManagementModal

export interface UserFormData {
  id?: number;
  userId: string;
  name: string;
  email: string;
  roleId: number;
  positionId: number;
  teamId: number;
  leadId?: number | undefined;
  hrId?: number | undefined;
}

export interface User {
  createdAt: string;
  email: string;
  id?: number;
  name: string;
  Team?: { id: number; name: string };
  position?: { id: number; name: string };
  role?: { id: number; name: string };
  leadId?: number | undefined;
  hrId?: number | undefined;
  positionId: number;
  roleId: number;
  teamId: number;
  userId: string;
}

export interface InnerDetails { id: number; name: string }

export interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editUser?: any;
  mode: "add" | "edit";
}
