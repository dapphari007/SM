import { In, Between } from "typeorm";
import { AppDataSource, assessmentRequestRepo, scoreRepo, userRepo, skillRepo, AuditRepo } from "../config/dataSource";
import { 
  AssessmentData, 
  SkillAssessmentData, 
  ReviewData, 
  ScoreData ,
  LatestScore
} from "../types/services";
import { AssessmentRequestType, ScoreType, UserType, SkillType, AuditType } from "../types/entities";
import { AssessmentStatus,  role } from "../enum/enum";
import * as cron from 'node-cron';

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
    skillScores: SkillAssessmentData[],
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
  }
};

export default AssessmentService;