import { AppDataSource } from "../config/dataSource";
import { User as UserEntity } from "../entities/User";
import { Role as RoleEntity } from "../entities/Role";
import { Position as PositionEntity } from "../entities/Position";
import { Team as TeamEntity } from "../entities/Team";
import { Auth as AuthEntity } from "../entities/Auth";
import { AssessmentRequest as AssessmentRequestEntity } from "../entities/AssessmentRequest";
import { Score as ScoreEntity } from "../entities/Score";
import { Skill as SkillEntity } from "../entities/Skill";
import { position } from "../entities/Position";
import { FindOptionsWhere } from "typeorm";
import { UserData } from "../types/services";
import { User, Role, Position, Team, Auth, AssessmentRequest, Score, Skill } from "../types/entities";

const userRepo = AppDataSource.getRepository(UserEntity);
const roleRepo = AppDataSource.getRepository(RoleEntity);
const positionRepo = AppDataSource.getRepository(PositionEntity);
const teamRepo = AppDataSource.getRepository(TeamEntity);
const authRepo = AppDataSource.getRepository(AuthEntity);
const assessmentRequestRepo = AppDataSource.getRepository(AssessmentRequestEntity);
const scoreRepo = AppDataSource.getRepository(ScoreEntity);
const skillRepo = AppDataSource.getRepository(SkillEntity);

interface FilterOptions {
  role?: string;
  position?: string;
  teamName?: string;
  [key: string]: any;
}

interface ScoreWithSkill {
  skillId: number;
  skillName: string;
  Score: number;
}

interface UserWithScores extends User {
  mostRecentAssessmentScores: ScoreWithSkill[];
  hasRecentAssessment: boolean;
}

const UserService = {
  // General user operations
  getUserById: async (id: number | string): Promise<User> => {
    const user = await userRepo
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("user.position", "position")
      .leftJoinAndSelect("user.Team", "team")
      .leftJoin("user.hrId", "hr")
      .addSelect(["hr.name"])
      .leftJoin("user.leadId", "lead")
      .addSelect(["lead.name"])
      .where("user.id = :id", { id })
      .getOne();

    if (!user) throw new Error("User not found");
    return user;
  },

  getAllUsers: async (filter: FilterOptions = {}): Promise<User[]> => {
    const where: FindOptionsWhere<User> = {};
    console.log(filter);

    // Handle filtering by related entities
    if (filter.role) {
      const role = await roleRepo.findOneBy({ name: filter.role });
      if (role) where.roleId = role.id;
    }
    if (filter.position) {
      const position = await positionRepo.findOneBy({ name: filter.position });
      if (position) where.positionId = position.id;
    }
    if (filter.teamName) {
      const team = await teamRepo.findOneBy({ name: filter.teamName });
      if (team) where.teamId = team.id;
    }

    return await userRepo.find({
      where,
      relations: ["role", "position", "Team"],
    });
  },

  // Hr CRUD Operations
  createUser: async (data: UserData): Promise<User> => {
    await AppDataSource.query(`
    SELECT setval(
      pg_get_serial_sequence('users', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM users)
      )`);
    await AppDataSource.query(`
    SELECT setval(
      pg_get_serial_sequence('auths', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM auths)
      )`);

    // Convert role, position, and team names to IDs if provided as names
    const userData: UserData = { ...data };

    if (data.role && typeof data.role === "string") {
      const role = await roleRepo.findOneBy({ name: data.role });
      if (role) userData.roleId = role.id;
      delete userData.role;
    }

    if (data.position && typeof data.position === "string") {
      const position = await positionRepo.findOneBy({ name: data.position });
      if (position) userData.positionId = position.id;
      delete userData.position;
    }

    if (data.teamName && typeof data.teamName === "string") {
      const team = await teamRepo.findOneBy({ name: data.teamName });
      if (team) userData.teamId = team.id;
      delete userData.teamName;
    }

    const newUser = userRepo.create(userData as any);
    const savedUser = await userRepo.save(newUser);
    const authDetails = authRepo.create({
      email: userData.email,
      passwordHash: userData.password ? userData.password : null,
    });
    await authRepo.save(authDetails);

    // If this user is assigned as a lead to someone, update their role to 'lead'
    if (data.leadId) {
      await UserService.ensureLeadRole(data.leadId);
    }

    return savedUser as unknown as User;
  },

  updateUser: async (data: UserData): Promise<User> => {
    const id = data.id;
    const user = await userRepo.findOneBy({ id: id as number });
    if (!user) throw new Error("User not found");

    // Check if leadId is being updated
    const leadIdChanged = data.leadId && data.leadId !== user.leadId;

    // Convert role, position, and team names to IDs if provided as names
    const userData: UserData = { ...data };

    if (data.role && typeof data.role === "string") {
      const role = await roleRepo.findOneBy({ name: data.role });
      if (role) userData.roleId = role.id;
      delete userData.role;
    }

    if (data.position && typeof data.position === "string") {
      const position = await positionRepo.findOneBy({ name: data.position });
      if (position) userData.positionId = position.id;
      delete userData.position;
    }

    if (data.teamName && typeof data.teamName === "string") {
      const team = await teamRepo.findOneBy({ name: data.teamName });
      if (team) userData.teamId = team.id;
      delete userData.teamName;
    }

    userRepo.merge(user, userData as any); // accepts only the valid fields for update
    const updatedUser = await userRepo.save(user);

    // If leadId was updated, ensure the lead has the 'lead' role
    if (leadIdChanged) {
      await UserService.ensureLeadRole(data.leadId as number);
    }

    return updatedUser;
  },

  // Helper method to ensure a user has the 'lead' role
  ensureLeadRole: async (userId: number): Promise<void> => {
    const lead = await userRepo.findOne({
      where: { id: userId },
      relations: ["role"],
    });
    if (!lead) throw new Error("Lead user not found");

    // Get the 'lead' role from the roles table
    const leadRole = await roleRepo.findOneBy({ name: "lead" });
    if (!leadRole) throw new Error("Lead role not found in database");

    // If the user is not already a lead, update their role
    if (!lead.role || lead.role.name !== "lead") {
      lead.roleId = leadRole.id;
      await userRepo.save(lead);
      console.log(`User ${userId} role updated to 'lead'`);
    }
  },

  deleteUser: async (id: number): Promise<User> => {
    const user = await userRepo.findOneBy({ id });
    if (!user) throw new Error("User not found");
    return await userRepo.remove(user);
  },

  getTeamMembers: async (teamId: number): Promise<User[]> => {
    try {
      const members = await userRepo.find({
        where: { teamId: teamId },
        relations: ["role", "position", "Requests"],
      });
      return members;
    } catch (error: any) {
      console.error(`Error getting team members for team ${teamId}:`, error);
      throw new Error(`Failed to get team members: ${error.message}`);
    }
  },

  getMostRecentApprovedScores: async (userId: number | string): Promise<ScoreWithSkill[]> => {
    try {
      // Get the most recent approved assessment for the user
      const latestApprovedAssessment = await assessmentRequestRepo.findOne({
        where: {
          userId: userId.toString(),
          status: "Approved",
        },
        order: {
          requestedAt: "DESC",
        },
      });

      if (!latestApprovedAssessment) {
        return [];
      }

      // Get all scores for this assessment with skill details
      const scores = await scoreRepo.find({
        where: {
          assessmentId: latestApprovedAssessment.id,
        },
        relations: ["Skill"],
      });

      return scores.map((score) => ({
        skillId: score.skillId,
        skillName: score.Skill.name,
        Score: score.leadScore as number
      }));
    } catch (error: any) {
      console.error(`Error getting recent scores for user ${userId}:`, error);
      return [];
    }
  },

  getSkillMatrixByTeam: async (teamName: string): Promise<UserWithScores[]> => {
    try {
      // Find the team by name first
      const team = await teamRepo.findOneBy({ name: teamName });
      if (!team) throw new Error("Team not found");

      const users = await userRepo.find({
        where: {
          teamId: team.id,
        },
        select: ["id", "userId", "name"] as any,
        relations: ["role", "position", "Team"],
      });

      // Get the most recent approved assessment scores for each user
      const usersWithScores = await Promise.all(
        users.map(async (user) => {
          const recentScores = await UserService.getMostRecentApprovedScores(
            user.id
          );
          return {
            ...user,
            mostRecentAssessmentScores: recentScores,
            hasRecentAssessment: recentScores.length > 0,
          };
        })
      );

      return usersWithScores;
    } catch (error: any) {
      throw new Error(`Failed to get skill matrix by team: ${error.message}`);
    }
  },

  getFullSkillMatrix: async (): Promise<UserWithScores[]> => {
    try {
      const users = await userRepo.find({
        select: ["id", "userId", "name"] as any,
        relations: ["role", "position", "Team"],
      });

      // Get the most recent approved assessment scores for each user
      const usersWithScores = await Promise.all(
        users.map(async (user) => {
          const recentScores = await UserService.getMostRecentApprovedScores(
            user.id
          );
          return {
            ...user,
            mostRecentAssessmentScores: recentScores,
            hasRecentAssessment: recentScores.length > 0,
          };
        })
      );

      return usersWithScores;
    } catch (error: any) {
      throw new Error(`Failed to get full skill matrix: ${error.message}`);
    }
  },

  getAllPositions: async (): Promise<Position[]> => {
    return await positionRepo.find();
  },
  
  getAllRoles: async (): Promise<Role[]> => {
    return await roleRepo.find();
  },
  
  getAllTeams: async (): Promise<Team[]> => {
    return await teamRepo.find();
  },
};

export default UserService;