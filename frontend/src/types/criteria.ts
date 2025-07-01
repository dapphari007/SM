//components/criteria/SkillCreationModel

export interface Position {
  id: number;
  name: string;
}

export interface SkillCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editSkill?: SkillData & { id: number; position?: number[] };
  mode?: "create" | "edit";
}

export interface SkillData {
  name: string;
  low: string;
  medium: string;
  average: string;
  high: string;
  position?: number[];
}

export interface UpgradeGuide {
  fromLevel: number;
  toLevel: number;
  guidance: string;
  resourceLink: string;
  skillId: number | null;
}

//components/criteria/SkillCriteriaPage

export interface SkillCriterion {
  id: number;
  name: string;
  low: string;
  medium: string;
  average: string;
  high: string;
  createdAt: string;
  createdBy: string;
  position: number[];
}