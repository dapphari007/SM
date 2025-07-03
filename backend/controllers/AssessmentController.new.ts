import AssessmentService from "../services/AssessmentServices.new";
import Boom from "@hapi/boom";
import { Request, ResponseToolkit } from '@hapi/hapi';
import { Controller, AuthRequest } from '../types/hapi';
import { SkillAssessmentData, ReviewData } from '../types/controller';
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
        skillScores: SkillAssessmentData[];
        comments?: string;
      };
      
      const leadId = req.auth.credentials.user.id;
      
      const assessment = await AssessmentService.writeLeadAssessment(
        leadId,
        parseInt(assessmentId),
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
      
      const employeeId = req.auth.credentials.user.id;
      
      const assessment = await AssessmentService.employeeReviewAssessment(
        employeeId,
        parseInt(assessmentId),
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
      
      const hrId = req.auth.credentials.user.id;
      
      const assessment = await AssessmentService.hrFinalReview(
        hrId,
        parseInt(assessmentId),
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
      
      const assessment = await AssessmentService.getAssessmentWithHistory(
        parseInt(assessmentId)
      );

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
        userRole as role
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
      
      const isAccessible = await AssessmentService.isAssessmentAccessible(
        parseInt(assessmentId)
      );

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
      const roleAssessments = await AssessmentService.getAssessmentsForRole(userId, userRole as role);
      
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
      if (userRole !== role.HR) {
        return h
          .response({
            success: false,
            error: "Only HR can access assessment statistics",
          })
          .code(403);
      }
      
      const userId = req.auth.credentials.user.id;
      const allAssessments = await AssessmentService.getAssessmentsForRole(userId, userRole as role);
      
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
      
      // Only HR can cancel assessments
      if (userRole !== role.HR) {
        return h
          .response({
            success: false,
            error: "Only HR can cancel assessments",
          })
          .code(403);
      }
      
      const assessment = await AssessmentService.getAssessmentWithHistory(parseInt(assessmentId));
      
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
      const result = await AssessmentService.cancelAssessment(parseInt(assessmentId));

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
    // Legacy method - basic implementation
    return h
      .response({
        success: false,
        error: "Legacy method not implemented in new workflow",
      })
      .code(400);
  },

  getUserLatestApprovedScoresByUserId: async (req: AuthRequest, h: ResponseToolkit) => {
    // Legacy method - basic implementation
    return h
      .response({
        success: false,
        error: "Legacy method not implemented in new workflow",
      })
      .code(400);
  },
};

export default AssessmentController;