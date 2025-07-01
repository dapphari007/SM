import { toast } from "@/hooks/use-toast";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;
console.log(API_BASE_URL);

interface ApiOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
}

interface SkillDetails {
  id: number;
  name: string;
  low: string;
  medium: string;
  average: string;
  high: string;
  position: number[];
}

// Function to make authenticated requests to the backend API
export const apiRequest = async (
  endpoint: string,
  options: ApiOptions = {}
) => {
  const { method = "GET", headers = {}, body, requiresAuth = true } = options;

  try {
    const token = localStorage.getItem("authToken");

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (requiresAuth && token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Request failed with status ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    toast({
      title: "Error",
      description:
        error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
    });
    throw error;
  }
};

// Auth Services
export const authService = {
  login: (email: string, password: string) =>
    apiRequest("/auth/legacy-login", {
      method: "POST",
      body: { email, password },
      requiresAuth: false,
    }),

  signup: (email: string, password: string) =>
    apiRequest("/auth/signup", {
      method: "POST",
      body: { email, password },
      requiresAuth: false,
    }),
    microsoftLogin: () =>{
      window.location.href = `${API_BASE_URL}/auth/start-login`;}
    }


// User Services
export const userService = {
  getProfile: () => apiRequest("/users/profile"),

  getAllUsers: (filters: { role?: string; position?: string } = {}) =>
    apiRequest("/users/all-users", { method: "POST", body: filters }),

  getTeamMatrix: (teamName: string) =>
    apiRequest(`/users/matrix/team/${teamName}`),

  getFullMatrix: () => apiRequest("/users/matrix/full"),

  getTeamMemebers: (teamName: string) => apiRequest(`/users/team/${teamName}`),

  createUser: (userData: {
    userId: string;
    name: string;
    email?: string;
    roleId: number;
    positionId: number;
    teamId?: number;
    leadId?: number;
    hrId?: number;
  }) => apiRequest("/users/create", { method: "POST", body: userData }),

  updateUser: (userData: {
    id: number;
    userId?: string;
    name?: string;
    email?: string;
    roleId?: number;
    positionId?: number;
    teamId?: number;
    leadId?: number;
    hrId?: number;
  }) => apiRequest("/users/update", { method: "POST", body: userData }),

  deleteUser: (id: number) =>
    apiRequest(`/users/delete/${id}`, { method: "DELETE" }),
};

// Skill Services
export const skillService = {
  getSkillById: (id: string) => apiRequest(`/skills/${id}`),

  getAllSkills: () => apiRequest("/skills/all-skills"),

  getSkillsByPosition: () => apiRequest("/skills/position"),

  getSkillsWithUpgradeGuides: () => apiRequest("/skills/guide"),

  createSkill: (data: SkillDetails) =>
    apiRequest("/skills/create", { method: "POST", body: data }),

  updateSkill: (data: SkillDetails) =>
    apiRequest("/skills/update", { method: "POST", body: data }),

  deleteSkill: (id: number) =>
    apiRequest(`/skills/delete/${id}`, { method: "DELETE" }),
};

export const positionService = {
  getAllPositions: () => apiRequest("/users/details?type=position"),
};

export const roleService = {
  getAllRoles: () => apiRequest("/users/details?type=role"),
};

export const teamService = {
  getAllTeams: () => apiRequest("/users/details?type=team"),
};

// Assessment Services
export const assessmentService = {
  createAssessment: (data) =>
    apiRequest("/assess/create", { method: "POST", body: data }),

  getAssessmentById: (id: string) => apiRequest(`/assess/${id}`),

  getAllAssessments: () => apiRequest("/assess/all"),

  reviewAssessment: (assessmentId: string, data: any) =>
    apiRequest(`/assess/review/${assessmentId}`, {
      method: "POST",
      body: data,
    }),

  getMyAssignedAssessments: () => apiRequest("/assess/pending"),

  cancelAssessment: (assessmentId: string) =>
    apiRequest(`/assess/cancel/${assessmentId}`, { method: "DELETE" }),

  getUserLatestApprovedScores: () => apiRequest("/assess/score"),

  getUserLatestApprovedScoresByUserId: (userId: number) =>
    apiRequest(`/assess/score/${userId}`),
};

// Skill Upgrade Guide Services
export const skillUpgradeService = {
  getGuide: (data: {
    skillId: string;
    currentLevel: number;
    targetLevel: number;
  }) => apiRequest("/guides/get", { method: "POST", body: data }),

  getAllGuidesBySkillId: (skillId: string) =>
    apiRequest(`/guides/skill/${skillId}`),

  createGuide: (data: {
    skillId: number;
    fromLevel: number;
    toLevel: number;
    guidance: string;
    resourceLink?: string;
  }) => {
    console.log("API call data:", data);
    return apiRequest("/guides/create", {
      method: "POST",
      body: data,
    });
  },

  updateGuide: (data: {
    id: number;
    skillId?: number;
    fromLevel?: number;
    toLevel?: number;
    guidance?: string;
    resourceLink?: string;
  }) => apiRequest("/guides/update", { method: "POST", body: data }),
};
