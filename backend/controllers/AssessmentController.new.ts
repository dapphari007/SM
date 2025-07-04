import AssessmentService from "../services/AssessmentServices.new";
import Boom from "@hapi/boom";
import { Request, ResponseToolkit } from '@hapi/hapi';
import { Controller, AuthRequest } from '../types/hapi';
import { SkillAssessmentData, ReviewData } from '../types/controller';
import { LeadSkillAssessmentData } from '../types/services';
import { role, AssessmentStatus } from '../enum/enum';

const AssessmentController: Controller = {
  // HR initiates assessment for employee or TL
  initiateAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { targetUserId, skillIds, scheduledDate, comments } = req.payload as {
        targetUserId: string;
        skillIds: number[];
        scheduledDate?: string;
        comments?: string;
      };
      
      const hrId = req.auth.credentials.user.id;
      
      const assessment = await AssessmentService.initiateAssessment(
        hrId,
        targetUserId,
        skillIds,
        scheduledDate ? new Date(scheduledDate) : undefined,
        comments || ""
      );

      return h
        .response({
          success: true,
          message: "Assessment initiated successfully",
          data: assessment,
        })
        .code(201);
    } catch (error: any) {
      console.error("Error initiating assessment:", error);
      
      if (error.message.includes("Only HR can initiate")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(403);
      }
      
      if (error.message.includes("not found") || error.message.includes("Target user")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(404);
      }
      
      if (error.message.includes("already has an active assessment")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(409);
      }
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Lead writes assessment for team member
  writeLeadAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { assessmentId } = req.params;
      const { skillScores, comments } = req.payload as {
        skillScores: LeadSkillAssessmentData[];
        comments?: string;
      };
      
      // Validate assessmentId parameter
      if (!assessmentId || assessmentId === 'undefined' || assessmentId === 'NaN') {
        return h
          .response({
            success: false,
            error: "Invalid assessment ID provided",
          })
          .code(400);
      }
      
      const parsedId = parseInt(assessmentId);
      if (isNaN(parsedId)) {
        return h
          .response({
            success: false,
            error: "Assessment ID must be a valid number",
          })
          .code(400);
      }
      
      const leadId = req.auth.credentials.user.id;
      
      const assessment = await AssessmentService.writeLeadAssessment(
        leadId,
        parsedId,
        skillScores,
        comments || ""
      );

      return h
        .response({
          success: true,
          message: "Lead assessment written successfully",
          data: assessment,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error writing lead assessment:", error);
      
      if (error.message.includes("not found")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(404);
      }
      
      if (error.message.includes("not authorized")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(403);
      }
      
      if (error.message.includes("not in a writable state") || error.message.includes("Invalid lead score")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(400);
      }
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Employee reviews and approves/rejects assessment
  employeeReviewAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { assessmentId } = req.params;
      const { approved, comments } = req.payload as {
        approved: boolean;
        comments?: string;
      };
      
      // Validate assessmentId parameter
      if (!assessmentId || assessmentId === 'undefined' || assessmentId === 'NaN') {
        return h
          .response({
            success: false,
            error: "Invalid assessment ID provided",
          })
          .code(400);
      }
      
      const parsedId = parseInt(assessmentId);
      if (isNaN(parsedId)) {
        return h
          .response({
            success: false,
            error: "Assessment ID must be a valid number",
          })
          .code(400);
      }
      
      const employeeId = req.auth.credentials.user.id;
      
      const assessment = await AssessmentService.employeeReviewAssessment(
        employeeId,
        parsedId,
        approved,
        comments || ""
      );

      return h
        .response({
          success: true,
          message: `Assessment ${approved ? 'approved' : 'rejected'} successfully`,
          data: assessment,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error reviewing assessment:", error);
      
      if (error.message.includes("not found")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(404);
      }
      
      if (error.message.includes("not authorized")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(403);
      }
      
      if (error.message.includes("not in a reviewable state")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(400);
      }
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // HR final review
  hrFinalReview: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { assessmentId } = req.params;
      const { approved, comments } = req.payload as {
        approved: boolean;
        comments?: string;
      };
      
      // Validate assessmentId parameter
      if (!assessmentId || assessmentId === 'undefined' || assessmentId === 'NaN') {
        return h
          .response({
            success: false,
            error: "Invalid assessment ID provided",
          })
          .code(400);
      }
      
      const parsedId = parseInt(assessmentId);
      if (isNaN(parsedId)) {
        return h
          .response({
            success: false,
            error: "Assessment ID must be a valid number",
          })
          .code(400);
      }
      
      const hrId = req.auth.credentials.user.id;
      
      const assessment = await AssessmentService.hrFinalReview(
        hrId,
        parsedId,
        approved,
        comments || ""
      );

      return h
        .response({
          success: true,
          message: `HR final review completed: ${approved ? 'approved' : 'rejected'}`,
          data: assessment,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error in HR final review:", error);
      
      if (error.message.includes("Only HR can perform")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(403);
      }
      
      if (error.message.includes("not found")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(404);
      }
      
      if (error.message.includes("not ready for HR final review")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(400);
      }
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Get assessment with full history
  getAssessmentWithHistory: async (req: Request, h: ResponseToolkit) => {
    try {
      const { assessmentId } = req.params;
      
      // Validate assessmentId parameter
      if (!assessmentId || assessmentId === 'undefined' || assessmentId === 'NaN') {
        return h
          .response({
            success: false,
            error: "Invalid assessment ID provided",
          })
          .code(400);
      }
      
      const parsedId = parseInt(assessmentId);
      if (isNaN(parsedId)) {
        return h
          .response({
            success: false,
            error: "Assessment ID must be a valid number",
          })
          .code(400);
      }
      
      const assessment = await AssessmentService.getAssessmentWithHistory(parsedId);

      return h
        .response({
          success: true,
          data: assessment,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting assessment with history:", error);
      
      if (error.message.includes("not found")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(404);
      }
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Get assessments for specific user role
  getAssessmentsForRole: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userId = req.auth.credentials.user.id;
      const userRole = req.auth.credentials.user.role;
      
      const assessments = await AssessmentService.getAssessmentsForRole(
        userId,
        userRole?.name as role
      );

      return h
        .response({
          success: true,
          data: assessments,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting assessments for role:", error);
      
      if (error.message.includes("Invalid user role")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(400);
      }
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Get assessments requiring action from specific user
  getAssessmentsRequiringAction: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userId = req.auth.credentials.user.id;
      
      const assessments = await AssessmentService.getAssessmentsRequiringAction(
        userId
      );

      return h
        .response({
          success: true,
          data: assessments,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting assessments requiring action:", error);
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Check if assessment is accessible
  checkAssessmentAccessibility: async (req: Request, h: ResponseToolkit) => {
    try {
      const { assessmentId } = req.params;
      
      // Validate assessmentId parameter
      if (!assessmentId || assessmentId === 'undefined' || assessmentId === 'NaN') {
        return h
          .response({
            success: false,
            error: "Invalid assessment ID provided",
          })
          .code(400);
      }
      
      const parsedId = parseInt(assessmentId);
      if (isNaN(parsedId)) {
        return h
          .response({
            success: false,
            error: "Assessment ID must be a valid number",
          })
          .code(400);
      }
      
      const isAccessible = await AssessmentService.isAssessmentAccessible(parsedId);

      return h
        .response({
          success: true,
          data: { isAccessible },
        })
        .code(200);
    } catch (error: any) {
      console.error("Error checking assessment accessibility:", error);
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Get dashboard data for different user roles
  getDashboardData: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userId = req.auth.credentials.user.id;
      const userRole = req.auth.credentials.user.role;
      
      // Get assessments requiring action
      const pendingAssessments = await AssessmentService.getAssessmentsRequiringAction(userId);
      
      // Get role-specific assessments
      const roleAssessments = await AssessmentService.getAssessmentsForRole(userId, userRole?.name as role);
      
      // Filter for recent assessments (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentAssessments = roleAssessments.filter(assessment => 
        assessment.requestedAt >= thirtyDaysAgo
      );

      return h
        .response({
          success: true,
          data: {
            pendingActions: pendingAssessments,
            recentAssessments: recentAssessments,
            totalAssessments: roleAssessments.length,
            pendingCount: pendingAssessments.length,
          },
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting dashboard data:", error);
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Get assessment statistics (for HR dashboard)
  getAssessmentStatistics: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userRole = req.auth.credentials.user.role;
      
      // Only HR can access statistics
      if (userRole?.name !== role.HR) {
        return h
          .response({
            success: false,
            error: "Only HR can access assessment statistics",
          })
          .code(403);
      }
      
      const userId = req.auth.credentials.user.id;
      const allAssessments = await AssessmentService.getAssessmentsForRole(userId, userRole?.name as role);
      
      // Calculate statistics
      const statistics = {
        total: allAssessments.length,
        byStatus: {
          initiated: allAssessments.filter(a => a.status === AssessmentStatus.INITIATED).length,
          leadWriting: allAssessments.filter(a => a.status === AssessmentStatus.LEAD_WRITING).length,
          employeeReview: allAssessments.filter(a => a.status === AssessmentStatus.EMPLOYEE_REVIEW).length,
          employeeApproved: allAssessments.filter(a => a.status === AssessmentStatus.EMPLOYEE_APPROVED).length,
          employeeRejected: allAssessments.filter(a => a.status === AssessmentStatus.EMPLOYEE_REJECTED).length,
          hrFinalReview: allAssessments.filter(a => a.status === AssessmentStatus.HR_FINAL_REVIEW).length,
          completed: allAssessments.filter(a => a.status === AssessmentStatus.COMPLETED).length,
          cancelled: allAssessments.filter(a => a.status === AssessmentStatus.Cancelled).length,
        },
        averageCycle: allAssessments.reduce((sum, a) => sum + a.currentCycle, 0) / allAssessments.length || 0,
        completionRate: allAssessments.length > 0 ? 
          (allAssessments.filter(a => a.status === AssessmentStatus.COMPLETED).length / allAssessments.length) * 100 : 0,
      };

      return h
        .response({
          success: true,
          data: statistics,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting assessment statistics:", error);
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Cancel assessment (updated for new workflow)
  cancelAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { assessmentId } = req.params;
      const { comments } = req.payload as { comments?: string };
      const currentUserId = req.auth.credentials.user.id;
      const userRole = req.auth.credentials.user.role;
      
      // Validate assessmentId parameter
      if (!assessmentId || assessmentId === 'undefined' || assessmentId === 'NaN') {
        return h
          .response({
            success: false,
            error: "Invalid assessment ID provided",
          })
          .code(400);
      }
      
      const parsedId = parseInt(assessmentId);
      if (isNaN(parsedId)) {
        return h
          .response({
            success: false,
            error: "Assessment ID must be a valid number",
          })
          .code(400);
      }
      
      // Only HR can cancel assessments
      if (userRole?.name !== role.HR) {
        return h
          .response({
            success: false,
            error: "Only HR can cancel assessments",
          })
          .code(403);
      }
      
      const assessment = await AssessmentService.getAssessmentWithHistory(parsedId);
      
      if (!assessment) {
        return h
          .response({
            success: false,
            error: "Assessment not found",
          })
          .code(404);
      }
      
      // Cannot cancel completed assessments
      if (assessment.status === AssessmentStatus.COMPLETED) {
        return h
          .response({
            success: false,
            error: "Cannot cancel completed assessments",
          })
          .code(400);
      }
      
      // Update assessment status to cancelled
      // This would need to be implemented in the service
      // For now, we'll call the existing cancelAssessment method
      const result = await AssessmentService.cancelAssessment(parsedId);

      return h
        .response({
          success: true,
          message: "Assessment cancelled successfully",
          data: result,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error cancelling assessment:", error);
      
      if (error.message.includes("not found")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(404);
      }
      
      if (error.message.includes("Cannot cancel")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(400);
      }
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // LEGACY METHODS FOR BACKWARD COMPATIBILITY
  createAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    // Legacy method - redirect to new workflow
    return h
      .response({
        success: false,
        error: "Legacy method. Use /initiate instead",
      })
      .code(400);
  },

  getAssessmentById: async (req: Request, h: ResponseToolkit) => {
    // Legacy method - redirect to new workflow
    // Map the old 'id' parameter to the new 'assessmentId' parameter
    const { id } = req.params;
    req.params.assessmentId = id;
    return AssessmentController.getAssessmentWithHistory(req, h);
  },

  getAllAssessments: async (req: AuthRequest, h: ResponseToolkit) => {
    // Legacy method - redirect to new workflow
    return AssessmentController.getAssessmentsForRole(req, h);
  },

  reviewAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    // Legacy method - redirect to new workflow
    return h
      .response({
        success: false,
        error: "Legacy method. Use /employee-review/{assessmentId} instead",
      })
      .code(400);
  },

  getMyAssignedAssessments: async (req: AuthRequest, h: ResponseToolkit) => {
    // Legacy method - redirect to new workflow
    return AssessmentController.getAssessmentsRequiringAction(req, h);
  },

  getUserLatestApprovedScores: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userId = req.auth.credentials.user.id;
      const scores = await AssessmentService.getUserLatestApprovedScores(userId);
      
      return h
        .response({
          success: true,
          data: scores,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting user's latest approved scores:", error);
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(404);
    }
  },

  getUserLatestApprovedScoresByUserId: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return h
          .response({
            success: false,
            error: "User ID is required",
          })
          .code(400);
      }
      
      const scores = await AssessmentService.getUserLatestApprovedScores(userId);
      
      return h
        .response({
          success: true,
          data: scores,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting user's latest approved scores by ID:", error);
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(404);
    }
  },

  // ===== NEW TEAM-BASED BULK ASSESSMENT METHODS =====

  // HR initiates bulk assessment for all users or specific teams
  initiateBulkAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { skillIds, assessmentTitle, includeTeams, scheduledDate, comments, excludeUsers } = req.payload as {
        skillIds: number[];
        assessmentTitle: string;
        includeTeams: string[];
        scheduledDate?: string;
        comments?: string;
        excludeUsers?: string[];
      };
      
      const hrId = req.auth.credentials.user.id;
      
      const result = await AssessmentService.initiateBulkAssessment(
        hrId,
        skillIds,
        assessmentTitle,
        includeTeams,
        scheduledDate ? new Date(scheduledDate) : undefined,
        comments || "",
        excludeUsers || []
      );

      return h
        .response({
          success: true,
          message: "Bulk assessment initiated successfully",
          data: result,
        })
        .code(201);
    } catch (error: any) {
      console.error("Error initiating bulk assessment:", error);
      
      if (error.message.includes("Only HR can initiate")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(403);
      }
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Get assessment cycles (for HR)
  getAssessmentCycles: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const cycles = await AssessmentService.getAssessmentCycles();

      return h
        .response({
          success: true,
          message: "Assessment cycles retrieved successfully",
          data: cycles,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting assessment cycles:", error);
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Get specific assessment cycle details
  getAssessmentCycleDetails: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { cycleId } = req.params;
      
      const parsedId = parseInt(cycleId);
      if (isNaN(parsedId)) {
        return h
          .response({
            success: false,
            error: "Cycle ID must be a valid number",
          })
          .code(400);
      }
      
      const cycle = await AssessmentService.getAssessmentCycleDetails(parsedId);

      return h
        .response({
          success: true,
          message: "Assessment cycle details retrieved successfully",
          data: cycle,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting assessment cycle details:", error);
      
      if (error.message.includes("not found")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(404);
      }
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Cancel assessment cycle (for HR)
  cancelAssessmentCycle: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { cycleId } = req.params;
      const { comments } = req.payload as { comments?: string };
      
      const parsedId = parseInt(cycleId);
      if (isNaN(parsedId)) {
        return h
          .response({
            success: false,
            error: "Cycle ID must be a valid number",
          })
          .code(400);
      }
      
      const hrId = req.auth.credentials.user.id;
      
      const result = await AssessmentService.cancelAssessmentCycle(hrId, parsedId, comments);

      return h
        .response({
          success: true,
          message: "Assessment cycle cancelled successfully",
          data: result,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error cancelling assessment cycle:", error);
      
      if (error.message.includes("not found")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(404);
      }
      
      if (error.message.includes("already cancelled") || error.message.includes("Cannot cancel")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(409);
      }
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Get team assessments (for Team Lead)
  getTeamAssessments: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const leadId = req.auth.credentials.user.id;
      
      const assessments = await AssessmentService.getTeamAssessments(leadId);

      return h
        .response({
          success: true,
          message: "Team assessments retrieved successfully",
          data: assessments,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting team assessments:", error);
      
      if (error.message.includes("not authorized") || error.message.includes("not a team lead")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(403);
      }
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Get team members (for Team Lead)
  getTeamMembers: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const leadId = req.auth.credentials.user.id;
      
      const members = await AssessmentService.getTeamMembers(leadId);

      return h
        .response({
          success: true,
          message: "Team members retrieved successfully",
          data: members,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting team members:", error);
      
      if (error.message.includes("not authorized") || error.message.includes("not a team lead")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(403);
      }
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Get team assessment statistics (for Team Lead)
  getTeamAssessmentStatistics: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const leadId = req.auth.credentials.user.id;
      
      const statistics = await AssessmentService.getTeamAssessmentStatistics(leadId);

      return h
        .response({
          success: true,
          message: "Team assessment statistics retrieved successfully",
          data: statistics,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting team assessment statistics:", error);
      
      if (error.message.includes("not authorized") || error.message.includes("not a team lead")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(403);
      }
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Get pending team assessments (for Team Lead)
  getPendingTeamAssessments: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const leadId = req.auth.credentials.user.id;
      
      const assessments = await AssessmentService.getPendingTeamAssessments(leadId);

      return h
        .response({
          success: true,
          message: "Pending team assessments retrieved successfully",
          data: assessments,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting pending team assessments:", error);
      
      if (error.message.includes("not authorized") || error.message.includes("not a team lead")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(403);
      }
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Get team member assessment (for Team Lead)
  getTeamMemberAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { userId } = req.params;
      const leadId = req.auth.credentials.user.id;
      
      const assessment = await AssessmentService.getTeamMemberAssessment(leadId, userId);

      return h
        .response({
          success: true,
          message: "Team member assessment retrieved successfully",
          data: assessment,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting team member assessment:", error);
      
      if (error.message.includes("not authorized") || error.message.includes("not found")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(error.message.includes("not found") ? 404 : 403);
      }
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Get team summary (for HR)
  getTeamSummary: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { teamId } = req.params;
      
      const parsedId = parseInt(teamId);
      if (isNaN(parsedId)) {
        return h
          .response({
            success: false,
            error: "Team ID must be a valid number",
          })
          .code(400);
      }
      
      const summary = await AssessmentService.getTeamSummary(parsedId);

      return h
        .response({
          success: true,
          message: "Team summary retrieved successfully",
          data: summary,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting team summary:", error);
      
      if (error.message.includes("not found")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(404);
      }
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Get user assessment summaries (for HR All Assessments view)
  getUserAssessmentSummaries: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userRole = req.auth.credentials.user.role;
      
      // Only HR can access user assessment summaries
      if (userRole?.name !== role.HR) {
        return h
          .response({
            success: false,
            error: "Only HR can access user assessment summaries",
          })
          .code(403);
      }
      
      const summaries = await AssessmentService.getUserAssessmentSummaries();
      
      return h
        .response({
          success: true,
          data: summaries,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting user assessment summaries:", error);
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Get user assessment history (for history modal)
  getUserAssessmentHistory: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { userId } = req.params;
      const userRole = req.auth.credentials.user.role;
      
      // Only HR can access user assessment history
      if (userRole?.name !== role.HR) {
        return h
          .response({
            success: false,
            error: "Only HR can access user assessment history",
          })
          .code(403);
      }
      
      if (!userId) {
        return h
          .response({
            success: false,
            error: "User ID is required",
          })
          .code(400);
      }
      
      const history = await AssessmentService.getUserAssessmentHistory(userId);
      
      return h
        .response({
          success: true,
          data: history,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting user assessment history:", error);
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // Get assessment score change history
  getAssessmentScoreHistory: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { assessmentId } = req.params as { assessmentId: string };
      
      if (!assessmentId) {
        return h
          .response({
            success: false,
            error: "Assessment ID is required",
          })
          .code(400);
      }

      const scoreHistory = await AssessmentService.getAssessmentScoreHistory(parseInt(assessmentId));

      return h
        .response({
          success: true,
          data: scoreHistory,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting assessment score history:", error);
      
      return h
        .response({
          success: false,
          error: error.message,
        })
        .code(500);
    }
  },

  // ===== END NEW TEAM-BASED BULK ASSESSMENT METHODS =====
};

export default AssessmentController;