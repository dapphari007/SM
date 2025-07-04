import { In, Between } from "typeorm";
import { AppDataSource, assessmentRequestRepo, scoreRepo, userRepo, skillRepo, AuditRepo } from "../config/dataSource";
import { 
  AssessmentData, 
  SkillAssessmentData, 
  LeadSkillAssessmentData,
  ReviewData, 
  ScoreData,
  LatestScore
} from "../types/services";
import { AssessmentRequestType, ScoreType, UserType, SkillType, AuditType } from "../types/entities";
import { AssessmentCycleType } from "../entities/AssessmentCycle.new";
import { AssessmentCycleSkillType } from "../entities/AssessmentCycleSkill.new";
import { AssessmentStatus,  role } from "../enum/enum";
import * as cron from 'node-cron';

// Additional repository setup for new entities
const assessmentCycleRepo = AppDataSource.getRepository("AssessmentCycle");
const assessmentCycleSkillRepo = AppDataSource.getRepository("AssessmentCycleSkill");

interface AssessmentWithHistory extends Omit<AssessmentRequestType, 'Score'> {
  detailedScores: ScoreType[];
  history: AuditType[];
  currentCycle: number;
  nextScheduledDate?: Date;
  isAccessible: boolean;
}

interface AssessmentCycle {
  id: number;
  assessmentId: number;
  cycleNumber: number;
  leadAssessmentDate?: Date;
  employeeResponseDate?: Date;
  employeeApproved: boolean;
  employeeComments?: string;
  hrFinalDecision?: 'APPROVED' | 'REJECTED';
  hrComments?: string;
  createdAt: Date;
}

interface BulkAssessmentRequest {
  skillIds: number[];
  scheduledDate?: Date;
  comments: string;
  assessmentTitle: string;
  includeTeams: string[];
  excludeUsers: string[];
}

interface BulkAssessmentResult {
  assessmentCycleId: number;
  title: string;
  totalAssessments: number;
  targetUsers: number;
  skills: number[];
  createdAt: Date;
}

const AssessmentService = {
  
  // HR initiates assessment for employee or TL
  initiateAssessment: async (
    hrId: string,
    targetUserId: string,
    skillIds: number[],
    scheduledDate?: Date,
    comments: string = ""
  ): Promise<AssessmentWithHistory> => {
    try {
      // Validate HR user
      const hrUser = await userRepo.findOne({ 
        where: { id: hrId },
        relations: ["role"]
      });
      if (!hrUser || hrUser.role?.name !== role.HR) {
        throw new Error("Only HR can initiate assessments");
      }

      // Validate target user
      const targetUser = await userRepo.findOne({ 
        where: { id: targetUserId },
        relations: ["role"]
      });
      if (!targetUser) {
        throw new Error("Target user not found");
      }

      // HR can only initiate for employees and TLs
      if (![role.EMPLOYEE, role.LEAD].includes(targetUser.role?.name as role)) {
        throw new Error("HR can only initiate assessments for employees and team leads");
      }

      // Check for existing active assessments
      const existingAssessment = await assessmentRequestRepo.findOne({
        where: {
          userId: targetUserId,
          status: In([
            AssessmentStatus.INITIATED,
            AssessmentStatus.LEAD_WRITING,
            AssessmentStatus.EMPLOYEE_REVIEW,
            AssessmentStatus.EMPLOYEE_APPROVED,
            AssessmentStatus.EMPLOYEE_REJECTED,
            AssessmentStatus.HR_FINAL_REVIEW
          ]),
        },
      });

      if (existingAssessment) {
        throw new Error("User already has an active assessment");
      }

      // Create assessment request
      const assessment = assessmentRequestRepo.create({
        userId: targetUserId,
        status: AssessmentStatus.INITIATED,
        initiatedBy: hrId,
        nextApprover: targetUser.leadId ? parseInt(targetUser.leadId) : null,
        scheduledDate: scheduledDate || new Date(),
        currentCycle: 1,
        nextScheduledDate: scheduledDate ? new Date(scheduledDate.getTime() + (90 * 24 * 60 * 60 * 1000)) : null // 3 months later
      });

      const savedAssessment = await assessmentRequestRepo.save(assessment);

      // Create initial score entries for skills
      if (skillIds && skillIds.length > 0) {
        for (const skillId of skillIds) {
          const skill = await skillRepo.findOneBy({ id: skillId });
          if (skill) {
            const score = scoreRepo.create({
              assessmentId: savedAssessment.id,
              skillId: skillId,
              leadScore: null
            });
            await scoreRepo.save(score);
          }
        }
      }

      // Create audit log
      await AuditRepo.save({
        assessmentId: savedAssessment.id,
        auditType: "INITIATED",
        editorId: parseInt(hrId),
        comments: comments,
        cycleNumber: 1
      });

      // Update status to LEAD_WRITING if target user has a lead
      if (targetUser.leadId) {
        savedAssessment.status = AssessmentStatus.LEAD_WRITING;
        await assessmentRequestRepo.save(savedAssessment);
      }

      return await AssessmentService.getAssessmentWithHistory(savedAssessment.id);
    } catch (error: any) {
      throw new Error(`Failed to initiate assessment: ${error.message}`);
    }
  },

  // Lead writes assessment for team member
  writeLeadAssessment: async (
    leadId: string,
    assessmentId: number,
    skillScores: LeadSkillAssessmentData[],
    comments: string = ""
  ): Promise<AssessmentWithHistory> => {
    try {
      const assessment = await assessmentRequestRepo.findOne({
        where: { id: assessmentId },
        relations: ["user"],
      });

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      // Validate lead authorization
      if (assessment.user?.leadId !== leadId) {
        throw new Error("You are not authorized to write this assessment");
      }

      if (assessment.status !== AssessmentStatus.LEAD_WRITING) {
        throw new Error("Assessment is not in a writable state");
      }

      // Update lead scores
      for (const skillScore of skillScores) {
        const score = await scoreRepo.findOne({
          where: {
            assessmentId: assessmentId,
            skillId: skillScore.skillId
          }
        });

        if (score) {
          if (skillScore.leadScore < 1 || skillScore.leadScore > 4) {
            throw new Error(`Invalid lead score for skill ${skillScore.skillId}. Must be between 1 and 4`);
          }
          score.leadScore = skillScore.leadScore;
          await scoreRepo.save(score);
        }
      }

      // Update assessment status
      assessment.status = AssessmentStatus.EMPLOYEE_REVIEW;
      assessment.nextApprover = parseInt(assessment.userId);
      await assessmentRequestRepo.save(assessment);

      // Create audit log
      await AuditRepo.save({
        assessmentId: assessmentId,
        auditType: "LEAD_ASSESSMENT_WRITTEN",
        editorId: parseInt(leadId),
        comments: comments,
        cycleNumber: assessment.currentCycle
      });

      return await AssessmentService.getAssessmentWithHistory(assessmentId);
    } catch (error: any) {
      throw new Error(`Failed to write lead assessment: ${error.message}`);
    }
  },

  // Employee reviews and approves/rejects assessment
  employeeReviewAssessment: async (
    employeeId: string,
    assessmentId: number,
    approved: boolean,
    comments: string = ""
  ): Promise<AssessmentWithHistory> => {
    try {
      const assessment = await assessmentRequestRepo.findOneBy({ id: assessmentId });

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      // Validate employee authorization
      if (assessment.userId !== employeeId) {
        throw new Error("You are not authorized to review this assessment");
      }

      if (assessment.status !== AssessmentStatus.EMPLOYEE_REVIEW) {
        throw new Error("Assessment is not in a reviewable state");
      }

      // Update assessment status based on employee decision
      if (approved) {
        assessment.status = AssessmentStatus.EMPLOYEE_APPROVED;
        assessment.nextApprover = parseInt(assessment.initiatedBy); // HR
      } else {
        assessment.status = AssessmentStatus.EMPLOYEE_REJECTED;
        assessment.nextApprover = assessment.user?.leadId ? parseInt(assessment.user.leadId) : null;
      }

      await assessmentRequestRepo.save(assessment);

      // Create audit log
      await AuditRepo.save({
        assessmentId: assessmentId,
        auditType: approved ? "EMPLOYEE_APPROVED" : "EMPLOYEE_REJECTED",
        editorId: parseInt(employeeId),
        comments: comments,
        cycleNumber: assessment.currentCycle
      });

      return await AssessmentService.getAssessmentWithHistory(assessmentId);
    } catch (error: any) {
      throw new Error(`Failed to review assessment: ${error.message}`);
    }
  },

  // HR final review
  hrFinalReview: async (
    hrId: string,
    assessmentId: number,
    approved: boolean,
    comments: string = ""
  ): Promise<AssessmentWithHistory> => {
    try {
      const hrUser = await userRepo.findOne({ 
        where: { id: hrId },
        relations: ["role"]
      });
      if (!hrUser || hrUser.role?.name !== role.HR) {
        throw new Error("Only HR can perform final review");
      }

      const assessment = await assessmentRequestRepo.findOne({
        where: { id: assessmentId },
        relations: ["user"]
      });

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      if (![AssessmentStatus.EMPLOYEE_APPROVED, AssessmentStatus.HR_FINAL_REVIEW].includes(assessment.status)) {
        throw new Error("Assessment is not ready for HR final review");
      }

      if (approved) {
        // Assessment completed
        assessment.status = AssessmentStatus.COMPLETED;
        assessment.completedAt = new Date();
        assessment.nextApprover = null;
        
        // Schedule next assessment (3 months from completion)
        if (assessment.nextScheduledDate) {
          await AssessmentService.scheduleNextAssessment(assessment);
        }
      } else {
        // HR rejected - back to lead for revision
        assessment.status = AssessmentStatus.LEAD_WRITING;
        assessment.nextApprover = assessment.user?.leadId ? parseInt(assessment.user.leadId) : null;
        assessment.currentCycle += 1;
      }

      await assessmentRequestRepo.save(assessment);

      // Create audit log
      await AuditRepo.save({
        assessmentId: assessmentId,
        auditType: approved ? "HR_APPROVED" : "HR_REJECTED",
        editorId: parseInt(hrId),
        comments: comments,
        cycleNumber: assessment.currentCycle
      });

      return await AssessmentService.getAssessmentWithHistory(assessmentId);
    } catch (error: any) {
      throw new Error(`Failed to perform HR final review: ${error.message}`);
    }
  },

  // Get assessment with full history
  getAssessmentWithHistory: async (assessmentId: number): Promise<AssessmentWithHistory> => {
    try {
      const assessment = await assessmentRequestRepo.findOne({
        where: { id: assessmentId },
        relations: ["user"],
      });

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      // Get detailed scores
      const scores = await scoreRepo.find({
        where: { assessmentId: assessmentId },
        relations: ["Skill"],
      });

      // Get audit history
      const history = await AuditRepo.find({
        where: { assessmentId: assessmentId },
        order: { auditedAt: "ASC" }
      });

      // Check if assessment is accessible based on schedule
      const isAccessible = await AssessmentService.isAssessmentAccessible(assessmentId);

      return {
        ...assessment,
        detailedScores: scores,
        history: history,
        currentCycle: assessment.currentCycle || 1,
        isAccessible: isAccessible
      };
    } catch (error: any) {
      throw new Error(`Failed to get assessment with history: ${error.message}`);
    }
  },

  // Check if assessment is accessible based on schedule
  isAssessmentAccessible: async (assessmentId: number): Promise<boolean> => {
    try {
      const assessment = await assessmentRequestRepo.findOneBy({ id: assessmentId });
      if (!assessment) return false;

      const now = new Date();
      const scheduledDate = assessment.scheduledDate || new Date();
      
      // Assessment is accessible if:
      // 1. It's past the scheduled date
      // 2. It's not completed
      // 3. It's not cancelled
      
      return now >= scheduledDate && 
             assessment.status !== AssessmentStatus.COMPLETED &&
             assessment.status !== AssessmentStatus.Cancelled;
    } catch (error: any) {
      return false;
    }
  },

  // Schedule next assessment
  scheduleNextAssessment: async (completedAssessment: AssessmentRequestType): Promise<void> => {
    try {
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 3); // 3 months from now

      // Create a scheduled assessment record
      const scheduledAssessment = assessmentRequestRepo.create({
        userId: completedAssessment.userId,
        status: AssessmentStatus.INITIATED,
        initiatedBy: completedAssessment.initiatedBy,
        scheduledDate: nextDate,
        currentCycle: 1,
        nextScheduledDate: new Date(nextDate.getTime() + (90 * 24 * 60 * 60 * 1000))
      });

      await assessmentRequestRepo.save(scheduledAssessment);

      // Create audit log
      await AuditRepo.save({
        assessmentId: scheduledAssessment.id,
        auditType: "SCHEDULED",
        editorId: parseInt(completedAssessment.initiatedBy),
        comments: `Automatically scheduled 3 months after completion of assessment ${completedAssessment.id}`,
        cycleNumber: 1
      });
    } catch (error: any) {
      console.error('Failed to schedule next assessment:', error);
    }
  },

  // Get assessments for specific user role
  getAssessmentsForRole: async (userId: string, userRole: role): Promise<AssessmentWithHistory[]> => {
    try {
      let whereConditions: any = {};
      
      switch (userRole) {
        case role.HR:
          // HR can see all assessments
          whereConditions = {};
          break;
        case role.LEAD:
          // Lead can see assessments for their team members
          const teamMembers = await userRepo.find({
            where: { leadId: userId }
          });
          const teamMemberIds = teamMembers.map(member => member.id);
          whereConditions = {
            userId: In(teamMemberIds)
          };
          break;
        case role.EMPLOYEE:
          // Employee can only see their own assessments
          whereConditions = {
            userId: userId
          };
          break;
        default:
          throw new Error("Invalid user role");
      }

      const assessments = await assessmentRequestRepo.find({
        where: whereConditions,
        relations: ["user"],
        order: { requestedAt: "DESC" }
      });

      const detailedAssessments: AssessmentWithHistory[] = [];
      for (const assessment of assessments) {
        const detailed = await AssessmentService.getAssessmentWithHistory(assessment.id);
        detailedAssessments.push(detailed);
      }

      return detailedAssessments;
    } catch (error: any) {
      throw new Error(`Failed to get assessments for role: ${error.message}`);
    }
  },

  // Get assessments requiring action from specific user
  getAssessmentsRequiringAction: async (userId: string): Promise<AssessmentWithHistory[]> => {
    try {
      const assessments = await assessmentRequestRepo.find({
        where: {
          nextApprover: parseInt(userId),
          status: In([
            AssessmentStatus.LEAD_WRITING,
            AssessmentStatus.EMPLOYEE_REVIEW,
            AssessmentStatus.EMPLOYEE_APPROVED,
            AssessmentStatus.HR_FINAL_REVIEW
          ])
        },
        relations: ["user"],
        order: { requestedAt: "ASC" }
      });

      const detailedAssessments: AssessmentWithHistory[] = [];
      for (const assessment of assessments) {
        const detailed = await AssessmentService.getAssessmentWithHistory(assessment.id);
        if (detailed.isAccessible) {
          detailedAssessments.push(detailed);
        }
      }

      return detailedAssessments;
    } catch (error: any) {
      throw new Error(`Failed to get assessments requiring action: ${error.message}`);
    }
  },

  // Cancel assessment (HR only)
  cancelAssessment: async (assessmentId: number): Promise<AssessmentWithHistory> => {
    try {
      const assessment = await assessmentRequestRepo.findOne({
        where: { id: assessmentId },
        relations: ["user"]
      });

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      if (assessment.status === AssessmentStatus.COMPLETED) {
        throw new Error("Cannot cancel completed assessment");
      }

      // Cancel the assessment
      assessment.status = AssessmentStatus.Cancelled;
      assessment.nextApprover = null;
      await assessmentRequestRepo.save(assessment);

      // Create audit log
      await AuditRepo.save({
        assessmentId: assessmentId,
        auditType: "CANCELLED",
        editorId: 0, // System cancellation
        comments: "Assessment cancelled",
        cycleNumber: assessment.currentCycle
      });

      return await AssessmentService.getAssessmentWithHistory(assessmentId);
    } catch (error: any) {
      throw new Error(`Failed to cancel assessment: ${error.message}`);
    }
  },

  // Cron job to activate scheduled assessments
  initializeCronJobs: () => {
    // Run every day at 9 AM to check for assessments that should be activated
    cron.schedule('0 9 * * *', async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const scheduledAssessments = await assessmentRequestRepo.find({
          where: {
            status: AssessmentStatus.INITIATED,
            scheduledDate: Between(today, new Date(today.getTime() + 24 * 60 * 60 * 1000))
          },
          relations: ["user"]
        });

        for (const assessment of scheduledAssessments) {
          if (assessment.user?.leadId) {
            assessment.status = AssessmentStatus.LEAD_WRITING;
            assessment.nextApprover = parseInt(assessment.user.leadId);
            await assessmentRequestRepo.save(assessment);

            // Create audit log
            await AuditRepo.save({
              assessmentId: assessment.id,
              auditType: "ACTIVATED",
              editorId: parseInt(assessment.initiatedBy),
              comments: "Assessment automatically activated by cron job",
              cycleNumber: assessment.currentCycle
            });
          }
        }
      } catch (error) {
        console.error('Error in assessment cron job:', error);
      }
    });
  },

  // ===== NEW TEAM-BASED BULK ASSESSMENT METHODS =====

  // HR initiates bulk assessment for all users or specific teams
  initiateBulkAssessment: async (
    hrId: string,
    skillIds: number[],
    assessmentTitle: string,
    includeTeams: string[],
    scheduledDate?: Date,
    comments: string = "",
    excludeUsers: string[] = []
  ): Promise<BulkAssessmentResult> => {
    try {
      // Validate HR user
      const hrUser = await userRepo.findOne({ 
        where: { id: hrId },
        relations: ["role"]
      });
      if (!hrUser || hrUser.role?.name !== role.HR) {
        throw new Error("Only HR can initiate bulk assessments");
      }

      // Validate skills exist
      const validSkills = await skillRepo.findBy({ id: In(skillIds) });
      if (validSkills.length !== skillIds.length) {
        throw new Error("One or more skills not found");
      }

      // Create assessment cycle
      const assessmentCycle = assessmentCycleRepo.create({
        title: assessmentTitle,
        createdBy: hrId,
        scheduledDate: scheduledDate || new Date(),
        status: 'ACTIVE',
        comments: comments,
        targetTeams: includeTeams.includes('all') ? ['all'] : includeTeams.map(String),
        excludedUsers: excludeUsers,
        totalAssessments: 0,
        completedAssessments: 0
      });

      const savedCycle = await assessmentCycleRepo.save(assessmentCycle);

      // Get target users based on team selection
      let targetUsers: UserType[] = [];
      
      if (includeTeams.includes('all')) {
        // Get all employees and team leads
        targetUsers = await userRepo.find({
          where: {
            role: { name: In([role.EMPLOYEE, role.LEAD]) }
          },
          relations: ["role", "Team"]
        });
      } else {
        // Get users from specific teams
        const teamIds = includeTeams.filter(id => id !== 'all').map(Number);
        targetUsers = await userRepo.find({
          where: {
            teamId: In(teamIds),
            role: { name: In([role.EMPLOYEE, role.LEAD]) }
          },
          relations: ["role", "Team"]
        });
      }

      // Exclude specified users
      if (excludeUsers.length > 0) {
        targetUsers = targetUsers.filter(user => !excludeUsers.includes(user.id));
      }

      // Check for existing active assessments and exclude those users
      const existingAssessments = await assessmentRequestRepo.find({
        where: {
          userId: In(targetUsers.map(u => u.id)),
          status: In([
            AssessmentStatus.INITIATED,
            AssessmentStatus.LEAD_WRITING,
            AssessmentStatus.EMPLOYEE_REVIEW,
            AssessmentStatus.EMPLOYEE_APPROVED,
            AssessmentStatus.EMPLOYEE_REJECTED,
            AssessmentStatus.HR_FINAL_REVIEW
          ]),
        },
      });

      const usersWithActiveAssessments = existingAssessments.map(a => a.userId);
      const eligibleUsers = targetUsers.filter(user => !usersWithActiveAssessments.includes(user.id));

      // Create individual assessments for each eligible user
      const assessments = [];
      for (const user of eligibleUsers) {
        const assessment = assessmentRequestRepo.create({
          userId: user.id,
          status: AssessmentStatus.INITIATED,
          initiatedBy: hrId,
          nextApprover: user.leadId ? parseInt(user.leadId) : null,
          scheduledDate: scheduledDate || new Date(),
          currentCycle: 1,
          nextScheduledDate: scheduledDate ? new Date(scheduledDate.getTime() + (90 * 24 * 60 * 60 * 1000)) : null,
          requestedAt: new Date()
        });

        const savedAssessment = await assessmentRequestRepo.save(assessment);
        assessments.push(savedAssessment);

        // Create audit entry
        const auditEntry = AuditRepo.create({
          assessmentId: Array.isArray(savedAssessment) ? savedAssessment[0].id : savedAssessment.id,
          auditType: 'ASSESSMENT_INITIATED',
          editorId: parseInt(hrId),
          comments: `Assessment initiated as part of cycle: ${assessmentTitle}`,
          auditedAt: new Date(),
          createdAt: new Date()
        });
        await AuditRepo.save(auditEntry);
      }

      // Link skills to cycle
      for (const skillId of skillIds) {
        const cycleSkill = assessmentCycleSkillRepo.create({
          cycleId: savedCycle.id,
          skillId: skillId
        });
        await assessmentCycleSkillRepo.save(cycleSkill);
      }

      // Update cycle with assessment count
      savedCycle.totalAssessments = assessments.length;
      await assessmentCycleRepo.save(savedCycle);

      return {
        assessmentCycleId: savedCycle.id,
        title: savedCycle.title,
        totalAssessments: assessments.length,
        targetUsers: eligibleUsers.length,
        skills: skillIds,
        createdAt: savedCycle.createdAt
      };
    } catch (error: any) {
      throw new Error(`Failed to initiate bulk assessment: ${error.message}`);
    }
  },

  // Get team assessments (for Team Lead) - only their team members
  getTeamAssessments: async (leadId: string): Promise<AssessmentWithHistory[]> => {
    try {
      // Validate team lead
      const leadUser = await userRepo.findOne({ 
        where: { id: leadId },
        relations: ["role"]
      });
      if (!leadUser || leadUser.role?.name !== role.LEAD) {
        throw new Error("Only team leads can access team assessments");
      }

      // Get team members under this lead
      const teamMembers = await userRepo.find({
        where: { leadId: leadId },
        relations: ["role"]
      });

      if (teamMembers.length === 0) {
        return [];
      }

      const teamMemberIds = teamMembers.map(member => member.id);

      // Get assessments for team members only
      const assessments = await assessmentRequestRepo.find({
        where: {
          userId: In(teamMemberIds)
        },
        relations: ["user", "user.role"],
        order: { requestedAt: "DESC" }
      });

      // Get detailed scores and history for each assessment
      const assessmentsWithHistory = [];
      for (const assessment of assessments) {
        const scores = await scoreRepo.find({
          where: { assessmentId: assessment.id },
          relations: ["Skill"]
        });

        const history = await AuditRepo.find({
          where: { assessmentId: assessment.id },
          order: { createdAt: "ASC" }
        });

        assessmentsWithHistory.push({
          ...assessment,
          detailedScores: scores,
          history: history,
          currentCycle: assessment.currentCycle,
          isAccessible: true
        });
      }

      return assessmentsWithHistory;
    } catch (error: any) {
      throw new Error(`Failed to get team assessments: ${error.message}`);
    }
  },

  // Get team members (for Team Lead)
  getTeamMembers: async (leadId: string): Promise<UserType[]> => {
    try {
      // Validate team lead
      const leadUser = await userRepo.findOne({ 
        where: { id: leadId },
        relations: ["role"]
      });
      if (!leadUser || leadUser.role?.name !== role.LEAD) {
        throw new Error("Only team leads can access team member data");
      }

      const teamMembers = await userRepo.find({
        where: { leadId: leadId },
        relations: ["role", "Team", "position"],
        order: { name: "ASC" }
      });

      return teamMembers;
    } catch (error: any) {
      throw new Error(`Failed to get team members: ${error.message}`);
    }
  },

  // Get assessment cycles (for HR)
  getAssessmentCycles: async (): Promise<AssessmentCycleType[]> => {
    try {
      const cycles = await assessmentCycleRepo.find({
        relations: ["assessments"],
        order: { createdAt: "DESC" }
      }) as AssessmentCycleType[];

      // Get skills for each cycle
      for (const cycle of cycles) {
        const cycleSkills = await assessmentCycleSkillRepo.find({
          where: { cycleId: cycle.id },
          relations: ["skill"]
        });
        cycle.skills = cycleSkills.map(cs => cs.skill);
      }

      return cycles;
    } catch (error: any) {
      throw new Error(`Failed to get assessment cycles: ${error.message}`);
    }
  },

  // Get specific assessment cycle details
  getAssessmentCycleDetails: async (cycleId: number): Promise<AssessmentCycleType> => {
    try {
      const cycle = await assessmentCycleRepo.findOne({
        where: { id: cycleId },
        relations: ["assessments"]
      }) as AssessmentCycleType;

      if (!cycle) {
        throw new Error("Assessment cycle not found");
      }

      // Get skills for this cycle
      const cycleSkills = await assessmentCycleSkillRepo.find({
        where: { cycleId: cycle.id },
        relations: ["skill"]
      });
      cycle.skills = cycleSkills.map(cs => cs.skill);

      return cycle;
    } catch (error: any) {
      throw new Error(`Failed to get assessment cycle details: ${error.message}`);
    }
  },

  // Get team assessment statistics (for Team Lead)
  getTeamAssessmentStatistics: async (leadId: string): Promise<any> => {
    try {
      // Validate team lead
      const leadUser = await userRepo.findOne({ 
        where: { id: leadId },
        relations: ["role"]
      });
      if (!leadUser || leadUser.role?.name !== role.LEAD) {
        throw new Error("Only team leads can access team statistics");
      }

      // Get team members
      const teamMembers = await userRepo.find({
        where: { leadId: leadId },
        relations: ["role"]
      });

      if (teamMembers.length === 0) {
        return {
          totalTeamMembers: 0,
          assessments: { total: 0, byStatus: {} },
          averageScores: {},
          recentActivity: []
        };
      }

      const teamMemberIds = teamMembers.map(member => member.id);

      // Get assessments for team
      const teamAssessments = await assessmentRequestRepo.find({
        where: { userId: In(teamMemberIds) },
        relations: ["user"]
      });

      // Calculate statistics
      const statistics = {
        totalTeamMembers: teamMembers.length,
        assessments: {
          total: teamAssessments.length,
          byStatus: {
            initiated: teamAssessments.filter(a => a.status === AssessmentStatus.INITIATED).length,
            leadWriting: teamAssessments.filter(a => a.status === AssessmentStatus.LEAD_WRITING).length,
            employeeReview: teamAssessments.filter(a => a.status === AssessmentStatus.EMPLOYEE_REVIEW).length,
            completed: teamAssessments.filter(a => a.status === AssessmentStatus.COMPLETED).length,
          }
        },
        pendingActions: teamAssessments.filter(a => 
          a.status === AssessmentStatus.INITIATED || 
          a.status === AssessmentStatus.LEAD_WRITING
        ).length,
        recentAssessments: teamAssessments
          .filter(a => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return a.requestedAt >= thirtyDaysAgo;
          })
          .length
      };

      return statistics;
    } catch (error: any) {
      throw new Error(`Failed to get team statistics: ${error.message}`);
    }
  },

  // Get pending team assessments (for Team Lead)
  getPendingTeamAssessments: async (leadId: string): Promise<AssessmentWithHistory[]> => {
    try {
      // Validate team lead
      const leadUser = await userRepo.findOne({ 
        where: { id: leadId },
        relations: ["role"]
      });
      if (!leadUser || leadUser.role?.name !== role.LEAD) {
        throw new Error("Only team leads can access pending team assessments");
      }

      // Get team members
      const teamMembers = await userRepo.find({
        where: { leadId: leadId }
      });

      if (teamMembers.length === 0) {
        return [];
      }

      const teamMemberIds = teamMembers.map(member => member.id);

      // Get pending assessments for team
      const pendingAssessments = await assessmentRequestRepo.find({
        where: {
          userId: In(teamMemberIds),
          status: In([
            AssessmentStatus.INITIATED,
            AssessmentStatus.LEAD_WRITING,
            AssessmentStatus.EMPLOYEE_REVIEW
          ])
        },
        relations: ["user", "user.role"],
        order: { scheduledDate: "ASC" }
      });

      // Add detailed scores and history
      const assessmentsWithHistory = [];
      for (const assessment of pendingAssessments) {
        const scores = await scoreRepo.find({
          where: { assessmentId: assessment.id },
          relations: ["Skill"]
        });

        const history = await AuditRepo.find({
          where: { assessmentId: assessment.id },
          order: { createdAt: "ASC" }
        });

        assessmentsWithHistory.push({
          ...assessment,
          detailedScores: scores,
          history: history,
          currentCycle: assessment.currentCycle,
          isAccessible: true
        });
      }

      return assessmentsWithHistory;
    } catch (error: any) {
      throw new Error(`Failed to get pending team assessments: ${error.message}`);
    }
  },

  // Get assessment for specific team member (with team validation)
  getTeamMemberAssessment: async (leadId: string, targetUserId: string): Promise<AssessmentWithHistory[]> => {
    try {
      // Validate team lead
      const leadUser = await userRepo.findOne({ 
        where: { id: leadId },
        relations: ["role"]
      });
      if (!leadUser || leadUser.role?.name !== role.LEAD) {
        throw new Error("Only team leads can access team member assessments");
      }

      // Validate that target user is in the team
      const targetUser = await userRepo.findOne({
        where: { id: targetUserId, leadId: leadId },
        relations: ["role"]
      });

      if (!targetUser) {
        throw new Error("User not found in your team or access denied");
      }

      // Get assessments for this team member
      const assessments = await assessmentRequestRepo.find({
        where: { userId: targetUserId },
        relations: ["user", "user.role"],
        order: { requestedAt: "DESC" }
      });

      // Add detailed scores and history
      const assessmentsWithHistory = [];
      for (const assessment of assessments) {
        const scores = await scoreRepo.find({
          where: { assessmentId: assessment.id },
          relations: ["Skill"]
        });

        const history = await AuditRepo.find({
          where: { assessmentId: assessment.id },
          order: { createdAt: "ASC" }
        });

        assessmentsWithHistory.push({
          ...assessment,
          detailedScores: scores,
          history: history,
          currentCycle: assessment.currentCycle,
          isAccessible: true
        });
      }

      return assessmentsWithHistory;
    } catch (error: any) {
      throw new Error(`Failed to get team member assessment: ${error.message}`);
    }
  },

  // Cancel assessment cycle (for HR)
  cancelAssessmentCycle: async (hrId: string, cycleId: number, comments?: string): Promise<AssessmentCycleType> => {
    try {
      // Validate HR user
      const hrUser = await userRepo.findOne({ 
        where: { id: hrId },
        relations: ["role"]
      });
      if (!hrUser || hrUser.role?.name !== role.HR) {
        throw new Error("Only HR can cancel assessment cycles");
      }

      const cycle = await assessmentCycleRepo.findOne({
        where: { id: cycleId },
        relations: ["assessments"]
      });

      if (!cycle) {
        throw new Error("Assessment cycle not found");
      }

      if (cycle.status === "CANCELLED") {
        throw new Error("Assessment cycle is already cancelled");
      }

      if (cycle.status === "COMPLETED") {
        throw new Error("Cannot cancel completed assessment cycle");
      }

      // Cancel all active assessments in this cycle
      const activeAssessments = await assessmentRequestRepo.find({
        where: {
          status: In([
            AssessmentStatus.INITIATED,
            AssessmentStatus.LEAD_WRITING,
            AssessmentStatus.EMPLOYEE_REVIEW,
            AssessmentStatus.EMPLOYEE_APPROVED,
            AssessmentStatus.EMPLOYEE_REJECTED,
            AssessmentStatus.HR_FINAL_REVIEW
          ])
        }
      });

      for (const assessment of activeAssessments) {
        assessment.status = AssessmentStatus.Cancelled;
        // Note: comments property doesn't exist in AssessmentRequestType, so we'll add it to audit instead
        await assessmentRequestRepo.save(assessment);

        // Create audit entry
        const auditEntry = AuditRepo.create({
          assessmentId: assessment.id,
          auditType: 'ASSESSMENT_CANCELLED',
          editorId: parseInt(hrId),
          comments: `Assessment cancelled as part of cycle cancellation: ${comments || 'No reason provided'}`,
          auditedAt: new Date(),
          createdAt: new Date()
        });
        await AuditRepo.save(auditEntry);
      }

      // Update cycle status
      cycle.status = "CANCELLED";
      cycle.comments = `${cycle.comments || ''}\n\nCancelled by HR: ${comments || 'No reason provided'}`;
      const savedCycle = await assessmentCycleRepo.save(cycle) as AssessmentCycleType;

      return savedCycle;
    } catch (error: any) {
      throw new Error(`Failed to cancel assessment cycle: ${error.message}`);
    }
  },

  // Get team summary for HR
  getTeamSummary: async (teamId: number): Promise<any> => {
    try {
      // Get team members
      const teamMembers = await userRepo.find({
        where: { teamId: teamId },
        relations: ["role", "Team"]
      });

      if (teamMembers.length === 0) {
        return {
          teamId: teamId,
          teamName: "Unknown Team",
          totalMembers: 0,
          assessments: { total: 0, byStatus: {} },
          recentActivity: []
        };
      }

      const teamMemberIds = teamMembers.map(member => member.id);
      const teamName = teamMembers[0].Team?.name || "Unknown Team";

      // Get assessments for team
      const teamAssessments = await assessmentRequestRepo.find({
        where: { userId: In(teamMemberIds) },
        relations: ["user"],
        order: { requestedAt: "DESC" }
      });

      // Calculate team statistics
      const summary = {
        teamId: teamId,
        teamName: teamName,
        totalMembers: teamMembers.length,
        assessments: {
          total: teamAssessments.length,
          byStatus: {
            initiated: teamAssessments.filter(a => a.status === AssessmentStatus.INITIATED).length,
            leadWriting: teamAssessments.filter(a => a.status === AssessmentStatus.LEAD_WRITING).length,
            employeeReview: teamAssessments.filter(a => a.status === AssessmentStatus.EMPLOYEE_REVIEW).length,
            completed: teamAssessments.filter(a => a.status === AssessmentStatus.COMPLETED).length,
            cancelled: teamAssessments.filter(a => a.status === AssessmentStatus.Cancelled).length,
          }
        },
        recentActivity: teamAssessments.slice(0, 10), // Last 10 assessments
        activeAssessments: teamAssessments.filter(a => 
          ![AssessmentStatus.COMPLETED, AssessmentStatus.Cancelled].includes(a.status)
        ).length
      };

      return summary;
    } catch (error: any) {
      throw new Error(`Failed to get team summary: ${error.message}`);
    }
  },

  // Get user's latest approved scores (only lead scores, no self scores)
  getUserLatestApprovedScores: async (userId: string): Promise<LatestScore[]> => {
    try {
      // Get all completed assessments for the user
      const completedAssessments = await assessmentRequestRepo.find({
        where: {
          userId: userId,
          status: AssessmentStatus.COMPLETED
        },
        order: { requestedAt: "DESC" }
      });

      if (completedAssessments.length === 0) {
        return [];
      }

      // Get all scores from completed assessments
      const assessmentIds = completedAssessments.map(a => a.id);
      const allScores = await scoreRepo.find({
        where: {
          assessmentId: In(assessmentIds)
        },
        relations: ["Skill"]
      });

      // Filter scores to only include those with lead scores
      const scoresWithLeadScore = allScores.filter(score => score.leadScore !== null);

      // Group scores by skill and get the latest for each skill
      const latestScoresBySkill = new Map<number, any>();
      
      for (const score of scoresWithLeadScore) {
        const skillId = score.skillId;
        const assessment = completedAssessments.find(a => a.id === score.assessmentId);
        
        if (assessment && score.Skill) {
          if (!latestScoresBySkill.has(skillId) || 
              assessment.requestedAt > latestScoresBySkill.get(skillId).requestedAt) {
            latestScoresBySkill.set(skillId, {
              id: score.id,
              self_score: null, // No self scores in the workflow
              lead_score: score.leadScore,
              updated_at: score.updatedAt,
              skill_name: score.Skill.name,
              skill_id: skillId,
              requestedAt: assessment.requestedAt
            });
          }
        }
      }

      return Array.from(latestScoresBySkill.values());
    } catch (error: any) {
      throw new Error(`Failed to get user's latest approved scores: ${error.message}`);
    }
  }
};

export default AssessmentService;