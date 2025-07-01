//components/dashboard/dashboardStats
export interface SkillStats {
  low: number;
  medium: number;
  average: number;
  high: number;
}

export interface DashboardStatsProps {
  stats: SkillStats;
  pendingRequests?: number;
  title: string;
}

//components/dashboard/EmployeeDashboard

export interface SkillProgressItem {
  id: string;
  name: string;
  current: number;
  target: number;
  category: string;
}