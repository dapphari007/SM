/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
   // User role types in the system
  interface UserRoles {
    EMPLOYEE: "employee";
    LEAD: "lead";
    HR: "hr";
  }


   //Position types available in the organization

  interface PositionTypes {
    FRONTEND: "frontend";
    BACKEND: "backend";
    TESTING: "testing";
    HR: "hr";
  }

  // Team names in the organization
  interface TeamNames {
    INFORIVER: "inforiver";
    INFOBRIDGE: "infobridge";
    VALQ: "valq";
  }

  interface BaseEntity {
    id: number;
    createdAt?: string;
    updatedAt?: string;
  }

  /**
   * User entity interface
   */
  interface User extends BaseEntity {
    userId: string;
    name: string;
    email: string;
    roleId?: number;
    teamId?: number;
    positionId?: number;
    leadId?: number;
    hrId?: number;

    // Relations (populated when needed)
    role?: Role;
    team?: Team;
    position?: Position;
    lead?: User;
    hr?: User;
    requests?: AssessmentRequest[];
    auth?: Auth;
    audits?: Audit[];
  }

  /**
   * Role entity interface
   */
  interface Role extends BaseEntity {
    name: string;
    users?: User[];
  }

  /**
   * Team entity interface
   */
  interface Team extends BaseEntity {
    name: string;
    users?: User[];
  }

  /**
   * Position entity interface
   */
  interface Position extends BaseEntity {
    name: string;
    users?: User[];
  }

  /**
   * Skill entity interface
   */
  interface Skill extends BaseEntity {
    name: string;
    low?: string;
    medium?: string;
    average?: string;
    high?: string;
    createdBy?: string;
    position?: number[];

    // Relations
    upgradeGuides?: SkillUpgradeGuide[];
    assessmentRequests?: AssessmentRequest[];
  }

  /**
   * Assessment Request entity interface
   */
  interface AssessmentRequest extends BaseEntity {
    userId: string;
    requestedAt: string;
    status: AssessmentStatus;
    nextApprover?: number;

    // Relations
    user?: User;
    nextApproverUser?: User;
    scores?: Score[];
    audits?: Audit[];
  }

  /**
   * Score entity interface
   */
  interface Score extends BaseEntity {
    assessmentId: number;
    skillId: number;
    selfScore?: number;
    leadScore?: number;
    updatedAt: string;

    // Relations
    skill?: Skill;
    assessmentRequest?: AssessmentRequest;
  }

  /**
   * Authentication entity interface
   */
  interface Auth extends BaseEntity {
    email: string;
    passwordHash?: string; // Usually not sent to frontend

    // Relations
    user?: User;
  }

  /**
   * Skill Upgrade Guide entity interface
   */
  interface SkillUpgradeGuide extends BaseEntity {
    fromLevel: number;
    toLevel: number;
    guidance: string;
    resourceLink?: string;
    skillId: number;

    // Relations
    skill?: Skill;
  }

  /**
   * Audit entity interface
   */
  interface Audit extends BaseEntity {
    assessmentId: number;
    auditType?: string;
    editorId: number;
    auditedAt: string;
    comments?: string;

    // Relations
    user?: User;
    assessmentRequest?: AssessmentRequest;
  }

  // ============================================================================
  // API RESPONSE INTERFACES
  // ============================================================================

  /**
   * Standard API response wrapper
   */
  interface ApiResponse<T = any> {
    data?: T;
    message?: string;
    error?: string;
    success?: boolean;
  }

  /**
   * Paginated response interface
   */
  interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }

  /**
   * User creation/update payload
   */
  interface UserPayload {
    userId?: string;
    name?: string;
    email?: string;
    roleId?: number;
    teamId?: number;
    positionId?: number;
    leadId?: number;
    hrId?: number;
  }

  /**
   * Skill creation/update payload
   */
  interface SkillPayload {
    name?: string;
    low?: string;
    medium?: string;
    average?: string;
    high?: string;
    createdBy?: string;
    position?: number[];
  }

  /**
   * Assessment request creation payload
   */
  interface AssessmentRequestPayload {
    userId?: string;
    status?: AssessmentStatus;
    nextApprover?: number;
  }

  /**
   * Score update payload
   */
  interface ScorePayload {
    assessmentId?: number;
    skillId?: number;
    selfScore?: number;
    leadScore?: number;
  }

  /**
   * Authentication payload
   */
  interface AuthPayload {
    email: string;
    password?: string;
  }

  // ============================================================================
  // SKILL MATRIX INTERFACES
  // ============================================================================

  /**
   * Skill matrix entry for a user
   */
  interface SkillMatrixEntry {
    userId: string;
    userName: string;
    userEmail: string;
    position?: string;
    team?: string;
    role?: string;
    skills: {
      skillId: number;
      skillName: string;
      selfScore?: number;
      leadScore?: number;
      level?: SkillLevel;
    }[];
  }

  /**
   * Team skill matrix response
   */
  interface TeamSkillMatrix {
    teamName: string;
    teamId: number;
    members: SkillMatrixEntry[];
    skills: Skill[];
  }

  /**
   * Full organization skill matrix
   */
  interface FullSkillMatrix {
    teams: TeamSkillMatrix[];
    allSkills: Skill[];
    totalUsers: number;
  }

  // ============================================================================
  // FORM AND UI INTERFACES
  // ============================================================================

  /**
   * Form validation error interface
   */
  interface FormError {
    field: string;
    message: string;
  }

  /**
   * Form state interface
   */
  interface FormState<T> {
    data: T;
    errors: FormError[];
    isSubmitting: boolean;
    isValid: boolean;
  }

  /**
   * Filter options for lists
   */
  interface FilterOptions {
    search?: string;
    role?: string;
    team?: string;
    position?: string;
    status?: AssessmentStatus;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }

  // ============================================================================
  // AUTHENTICATION AND AUTHORIZATION
  // ============================================================================

  /**
   * Current user context
   */
  interface CurrentUser {
    id: number;
    userId: string;
    name: string;
    email: string;
    role: string;
    team?: string;
    position?: string;
    permissions: string[];
  }

  /**
   * Authentication context
   */
  interface AuthContext {
    user: CurrentUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: AuthPayload) => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<void>;
  }

  /**
   * API endpoints configuration
   */
  interface ApiEndpoints {
    // User endpoints
    users: {
      getAll: string;
      getById: string;
      create: string;
      update: string;
      delete: string;
      getTeamMembers: string;
      getTeamMatrix: string;
      getFullMatrix: string;
      getAllDetails: string;
    };

    // Skill endpoints
    skills: {
      getAll: string;
      getById: string;
      create: string;
      update: string;
      delete: string;
    };

    // Assessment endpoints
    assessments: {
      getAll: string;
      getById: string;
      create: string;
      update: string;
      approve: string;
      cancel: string;
    };

    // Auth endpoints
    auth: {
      login: string;
      logout: string;
      refresh: string;
      profile: string;
    };
  }
}

export {};
