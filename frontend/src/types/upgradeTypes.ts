export interface Resource {
  id: string;
  title: string;
  type: "Course" | "Documentation" | "Tutorial" | "Book";
  url: string;
}

export interface LearningPath {
  id: string;
  skillId: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  priority: "High" | "Medium" | "Low";
  resources: Resource[];
  guidance?: string;
}

export interface Skill {
  id: string;
  name: string;
  level?: number;
}

export interface UpgradeGuide {
  id: string;
  fromLevel: number;
  toLevel: number;
  guidance: string;
  resourceLink?: string;
}
