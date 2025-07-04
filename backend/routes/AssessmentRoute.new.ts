import AssessmentController from "../controllers/AssessmentController.new";
import AssessmentService from "../services/AssessmentServices.new";
import { ServerRegisterOptions } from "@hapi/hapi";
import { role } from "../enum/enum";

const assessmentRoutes = {
  name: "assessment-routes",
  register: async function (server, options) {
    server.route([
      // NEW WORKFLOW ROUTES
      
      // HR initiates assessment
      {
        method: "POST",
        path: "/initiate",
        handler: AssessmentController.initiateAssessment,
        options: {
          auth: 'jwt',
          description: 'HR initiates assessment for employee or team lead',
          tags: ['api', 'assessment', 'hr'],
        }
      },
      
      // Lead writes assessment
      {
        method: "POST",
        path: "/lead-assessment/{assessmentId}",
        handler: AssessmentController.writeLeadAssessment,
        options: {
          auth: 'jwt',
          description: 'Team lead writes assessment for team member',
          tags: ['api', 'assessment', 'lead'],
        }
      },
      
      // Employee reviews assessment
      {
        method: "POST",
        path: "/employee-review/{assessmentId}",
        handler: AssessmentController.employeeReviewAssessment,
        options: {
          auth: 'jwt',
          description: 'Employee reviews and approves/rejects assessment',
          tags: ['api', 'assessment', 'employee'],
        }
      },
      
      // HR final review
      {
        method: "POST",
        path: "/hr-final-review/{assessmentId}",
        handler: AssessmentController.hrFinalReview,
        options: {
          auth: 'jwt',
          description: 'HR performs final review of assessment',
          tags: ['api', 'assessment', 'hr'],
        }
      },
      
      // Get assessment with full history
      {
        method: "GET",
        path: "/history/{assessmentId}",
        handler: AssessmentController.getAssessmentWithHistory,
        options: {
          auth: 'jwt',
          description: 'Get assessment with complete history and audit trail',
          tags: ['api', 'assessment'],
        }
      },
      
      // Get assessments for user role
      {
        method: "GET",
        path: "/role-assessments",
        handler: AssessmentController.getAssessmentsForRole,
        options: {
          auth: 'jwt',
          description: 'Get assessments visible to current user based on role',
          tags: ['api', 'assessment'],
        }
      },
      
      // Get assessments requiring action
      {
        method: "GET",
        path: "/pending-actions",
        handler: AssessmentController.getAssessmentsRequiringAction,
        options: {
          auth: 'jwt',
          description: 'Get assessments requiring action from current user',
          tags: ['api', 'assessment'],
        }
      },
      
      // Check assessment accessibility
      {
        method: "GET",
        path: "/accessibility/{assessmentId}",
        handler: AssessmentController.checkAssessmentAccessibility,
        options: {
          auth: 'jwt',
          description: 'Check if assessment is accessible based on schedule',
          tags: ['api', 'assessment'],
        }
      },
      
      // Get dashboard data
      {
        method: "GET",
        path: "/dashboard",
        handler: AssessmentController.getDashboardData,
        options: {
          auth: 'jwt',
          description: 'Get dashboard data for current user',
          tags: ['api', 'assessment', 'dashboard'],
        }
      },
      
      // Get assessment statistics (HR only)
      {
        method: "GET",
        path: "/statistics",
        handler: AssessmentController.getAssessmentStatistics,
        options: {
          auth: 'jwt',
          description: 'Get assessment statistics for HR dashboard',
          tags: ['api', 'assessment', 'hr', 'statistics'],
        }
      },

      // LEGACY ROUTES (for backward compatibility)
      
      // Create assessment (legacy) - DEPRECATED
      {
        method: "POST",
        path: "/create",
        handler: async (request, h) => {
          return h
            .response({
              success: false,
              error: "Self-assessment functionality has been removed. Assessments must be initiated by HR and written by team leads.",
              message: "Use the new workflow: HR initiates -> Lead writes -> Employee reviews -> HR approves"
            })
            .code(410); // Gone
        },
        options: {
          auth: 'jwt',
          description: 'Legacy: Create assessment (DEPRECATED)',
          tags: ['api', 'assessment', 'legacy', 'deprecated'],
        }
      },
      
      // Get assessment by ID (legacy)
      {
        method: "GET",
        path: "/{id}",
        handler: AssessmentController.getAssessmentById,
        options: {
          auth: 'jwt',
          description: 'Legacy: Get assessment by ID (backward compatibility)',
          tags: ['api', 'assessment', 'legacy'],
        }
      },
      
      // Get all assessments (legacy)
      {
        method: "GET",
        path: "/all",
        handler: AssessmentController.getAllAssessments,
        options: {
          auth: 'jwt',
          description: 'Legacy: Get all assessments (backward compatibility)',
          tags: ['api', 'assessment', 'legacy'],
        }
      },
      
      // Review assessment (legacy)
      {
        method: "POST",
        path: "/review/{assessmentId}",
        handler: AssessmentController.reviewAssessment,
        options: {
          auth: 'jwt',
          description: 'Legacy: Review assessment (backward compatibility)',
          tags: ['api', 'assessment', 'legacy'],
        }
      },
      
      // Get assigned assessments (legacy)
      {
        method: "GET",
        path: "/assigned",
        handler: AssessmentController.getMyAssignedAssessments,
        options: {
          auth: 'jwt',
          description: 'Legacy: Get assigned assessments (backward compatibility)',
          tags: ['api', 'assessment', 'legacy'],
        }
      },
      
      // Cancel assessment (updated for new workflow)
      {
        method: "DELETE",
        path: "/cancel/{assessmentId}",
        handler: AssessmentController.cancelAssessment,
        options: {
          auth: 'jwt',
          description: 'Cancel assessment (HR only)',
          tags: ['api', 'assessment', 'hr'],
        }
      },
      
      // Get user scores (legacy)
      {
        method: "GET",
        path: "/scores",
        handler: AssessmentController.getUserLatestApprovedScores,
        options: {
          auth: 'jwt',
          description: 'Legacy: Get user latest approved scores',
          tags: ['api', 'assessment', 'scores', 'legacy'],
        }
      },
      
      // Get user scores by ID (legacy)
      {
        method: "GET",
        path: "/scores/{userId}",
        handler: AssessmentController.getUserLatestApprovedScoresByUserId,
        options: {
          auth: 'jwt',
          description: 'Legacy: Get user latest approved scores by user ID',
          tags: ['api', 'assessment', 'scores', 'legacy'],
        }
      },

      // ADDITIONAL UTILITY ROUTES
      
      // Get assessment workflow status
      {
        method: "GET",
        path: "/workflow-status/{assessmentId}",
        handler: async (request, h) => {
          try {
            const { assessmentId } = request.params;
            const assessment = await AssessmentService.getAssessmentWithHistory(parseInt(assessmentId));
            
            if (!assessment) {
              return h.response({ success: false, error: "Assessment not found" }).code(404);
            }
            
            return h.response({
              success: true,
              data: {
                currentStatus: assessment.status,
                currentCycle: assessment.currentCycle,
                nextApprover: assessment.nextApprover,
                isAccessible: assessment.isAccessible,
                completedSteps: assessment.history?.map(audit => audit.auditType) || []
              }
            }).code(200);
          } catch (error: any) {
            return h.response({ success: false, error: error.message }).code(500);
          }
        },
        options: {
          auth: 'jwt',
          description: 'Get workflow status of assessment',
          tags: ['api', 'assessment', 'workflow'],
        }
      },
      
      // Get assessments by status
      {
        method: "GET",
        path: "/by-status/{status}",
        handler: async (request, h) => {
          try {
            const { status } = request.params;
            const userId = request.auth.credentials.user.id;
            const userRole = request.auth.credentials.user.role;
            
            const roleAssessments = await AssessmentService.getAssessmentsForRole(userId, userRole as role);
            const filteredAssessments = roleAssessments.filter(assessment => 
              assessment.status === status.toUpperCase()
            );
            
            return h.response({
              success: true,
              data: filteredAssessments
            }).code(200);
          } catch (error: any) {
            return h.response({ success: false, error: error.message }).code(500);
          }
        },
        options: {
          auth: 'jwt',
          description: 'Get assessments by status',
          tags: ['api', 'assessment', 'filter'],
        }
      },
      
      // Get overdue assessments (HR only)
      {
        method: "GET",
        path: "/overdue",
        handler: async (request, h) => {
          try {
            const userRole = request.auth.credentials.user.role;
            
            if (userRole !== role.HR) {
              return h.response({
                success: false,
                error: "Only HR can access overdue assessments"
              }).code(403);
            }
            
            const userId = request.auth.credentials.user.id;
            const allAssessments = await AssessmentService.getAssessmentsForRole(userId, userRole as role);
            
            const now = new Date();
            const overdueAssessments = allAssessments.filter(assessment => {
              const scheduledDate = new Date(assessment.scheduledDate);
              return scheduledDate < now && 
                     !['COMPLETED', 'CANCELLED'].includes(assessment.status);
            });
            
            return h.response({
              success: true,
              data: overdueAssessments
            }).code(200);
          } catch (error: any) {
            return h.response({ success: false, error: error.message }).code(500);
          }
        },
        options: {
          auth: 'jwt',
          description: 'Get overdue assessments (HR only)',
          tags: ['api', 'assessment', 'hr', 'overdue'],
        }
      },
      
      // Get upcoming assessments
      {
        method: "GET",
        path: "/upcoming",
        handler: async (request, h) => {
          try {
            const userId = request.auth.credentials.user.id;
            const userRole = request.auth.credentials.user.role;
            
            const roleAssessments = await AssessmentService.getAssessmentsForRole(userId, userRole as role);
            
            const now = new Date();
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            const upcomingAssessments = roleAssessments.filter(assessment => {
              const scheduledDate = new Date(assessment.scheduledDate);
              return scheduledDate >= now && 
                     scheduledDate <= nextWeek &&
                     assessment.status === 'INITIATED';
            });
            
            return h.response({
              success: true,
              data: upcomingAssessments
            }).code(200);
          } catch (error: any) {
            return h.response({ success: false, error: error.message }).code(500);
          }
        },
        options: {
          auth: 'jwt',
          description: 'Get upcoming assessments in next 7 days',
          tags: ['api', 'assessment', 'upcoming'],
        }
      },

      // ===== NEW TEAM-BASED BULK ASSESSMENT ROUTES =====
      
      // HR initiates bulk assessment
      {
        method: "POST",
        path: "/bulk-assessment",
        handler: AssessmentController.initiateBulkAssessment,
        options: {
          auth: 'jwt',
          description: 'HR initiates bulk assessment for all users or specific teams',
          tags: ['api', 'assessment', 'hr', 'bulk'],
        }
      },
      
      // Get assessment cycles (HR only)
      {
        method: "GET",
        path: "/cycles",
        handler: AssessmentController.getAssessmentCycles,
        options: {
          auth: 'jwt',
          description: 'Get all assessment cycles for HR',
          tags: ['api', 'assessment', 'hr', 'cycles'],
        }
      },
      
      // Get specific assessment cycle details (HR only)
      {
        method: "GET",
        path: "/cycles/{cycleId}",
        handler: AssessmentController.getAssessmentCycleDetails,
        options: {
          auth: 'jwt',
          description: 'Get specific assessment cycle details',
          tags: ['api', 'assessment', 'hr', 'cycles'],
        }
      },
      
      // Cancel assessment cycle (HR only)
      {
        method: "POST",
        path: "/cycles/{cycleId}/cancel",
        handler: AssessmentController.cancelAssessmentCycle,
        options: {
          auth: 'jwt',
          description: 'Cancel assessment cycle and all associated assessments',
          tags: ['api', 'assessment', 'hr', 'cycles'],
        }
      },
      
      // Get team assessments (Team Lead only)
      {
        method: "GET",
        path: "/team/assessments",
        handler: AssessmentController.getTeamAssessments,
        options: {
          auth: 'jwt',
          description: 'Get all assessments for team members (Team Lead only)',
          tags: ['api', 'assessment', 'lead', 'team'],
        }
      },
      
      // Get team members (Team Lead only)
      {
        method: "GET",
        path: "/team/members",
        handler: AssessmentController.getTeamMembers,
        options: {
          auth: 'jwt',
          description: 'Get all team members (Team Lead only)',
          tags: ['api', 'assessment', 'lead', 'team'],
        }
      },
      
      // Get team assessment statistics (Team Lead only)
      {
        method: "GET",
        path: "/team/statistics",
        handler: AssessmentController.getTeamAssessmentStatistics,
        options: {
          auth: 'jwt',
          description: 'Get team assessment statistics (Team Lead only)',
          tags: ['api', 'assessment', 'lead', 'team', 'statistics'],
        }
      },
      
      // Get pending team assessments (Team Lead only)
      {
        method: "GET",
        path: "/team/pending",
        handler: AssessmentController.getPendingTeamAssessments,
        options: {
          auth: 'jwt',
          description: 'Get pending team assessments (Team Lead only)',
          tags: ['api', 'assessment', 'lead', 'team'],
        }
      },
      
      // Get team member assessment (Team Lead only)
      {
        method: "GET",
        path: "/team/member/{userId}",
        handler: AssessmentController.getTeamMemberAssessment,
        options: {
          auth: 'jwt',
          description: 'Get assessments for specific team member (Team Lead only)',
          tags: ['api', 'assessment', 'lead', 'team'],
        }
      },
      
      // Get team summary (HR only)
      {
        method: "GET",
        path: "/team/{teamId}/summary",
        handler: AssessmentController.getTeamSummary,
        options: {
          auth: 'jwt',
          description: 'Get team summary for HR dashboard',
          tags: ['api', 'assessment', 'hr', 'team'],
        }
      },

      // ===== END NEW TEAM-BASED BULK ASSESSMENT ROUTES =====
    ]);
  },
};

export default assessmentRoutes;