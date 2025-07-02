import AssessmentService from "../services/AssessmentService";
import Boom from "@hapi/boom";
import { Request, ResponseToolkit } from '@hapi/hapi';
import { Controller, AuthRequest } from '../types/hapi';
import {SkillAssessment,AssessmentPayload,ReviewData} from "../types/controller";

const AssessmentController: Controller = {
  // Create a new assessment
  createAssessment: async (req: Request, h: ResponseToolkit) => {
    try {
      const payload = req.payload as AssessmentPayload;
      const { skillAssessments } = payload;
      const userId = payload.userId;
      const comments = payload.comments;

      const assessment = await AssessmentService.createAssessment(
        userId,
        comments,
        skillAssessments,
      );

      return h
        .response({
          success: true,
          message: "Assessment created successfully",
          data: assessment,
        })
        .code(201);
    } catch (error: any) {
      console.error("Error creating assessment:", error);
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(409);
        }
  },

  // Get assessment by ID
  getAssessmentById: async (req: Request, h: ResponseToolkit) => {
    try {
      const { id } = req.params;
      const assessment = await AssessmentService.getAssessmentById(
        parseInt(id)
      );

      return h
        .response({
          success: true,
          data: assessment,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting assessment:", error);
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
          error: "Failed to retrieve assessment",
        })
        .code(500);
    }
  },

  // Get current user's assessments
  getUserAssessments: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userId = req.auth.credentials.user.id;
      const assessments = await AssessmentService.getUserAssessments(userId);

      return h
        .response({
          success: true,
          data: assessments,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting user assessments:", error);
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
          error: "Failed to retrieve user assessments",
        })
        .code(500);
    }
  },

  // Get assessments for a specific user (by ID)
  getAssessmentsForUser: async (req: Request, h: ResponseToolkit) => {
    try {
      const { userId } = req.params;
      const assessments = await AssessmentService.getUserAssessments(
        parseInt(userId)
      );

      return h
        .response({
          success: true,
          data: assessments,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting assessments for user:", error);
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
          error: "Failed to retrieve assessments for user",
        })
        .code(500);
    }
  },

  // Get all assessments (admin/lead only)
  getAllAssessments: async (req: Request, h: ResponseToolkit) => {
    try {
      const assessments = await AssessmentService.getAllAssessments();

      return h
        .response({
          success: true,
          data: assessments,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting all assessments:", error);
      return h
        .response({
          success: false,
          error: "Failed to retrieve all assessments",
        })
        .code(500);
    }
  },

  // Review an assessment (admin/lead only)
  reviewAssessment: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const { assessmentId } = req.params;
      const reviewData = req.payload as ReviewData;
      const currentUserId = req.auth.credentials.user.id;

      const assessment = await AssessmentService.reviewAssessment(
        parseInt(assessmentId),
        reviewData,
        currentUserId
      );

      return h
        .response({
          success: true,
          message: "Assessment reviewed successfully",
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
      if (error.message.includes("not in a reviewable state")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(400);
      }
      if (error.message.includes("not authorized")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(403);
      }
      if (error.message.includes("Invalid lead score")) {
        return h
          .response({
            success: false,
            error: error.message,
          })
          .code(400);
      }
      if (error.message.includes("HR can only approve")) {
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

  // Cancel an assessment
  cancelAssessment: async (req: Request, h: ResponseToolkit) => {
    try {
      const { assessmentId } = req.params;
      const result = await AssessmentService.cancelAssessment(
        parseInt(assessmentId)
      );

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
          error: "Failed to cancel assessment",
        })
        .code(500);
    }
  },

  // Get user's latest approved scores
  getUserLatestApprovedScores: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userId = req.auth.credentials.user.id;
      const scores = await AssessmentService.getUserLatestApprovedScores(
        userId
      );
      // if(!scores || scores.length === 0) {
      //   throw new Error("No approved scores found for this user");
      // }

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

  // Get user's latest approved scores by user ID
  getUserLatestApprovedScoresByUserId: async (req: Request, h: ResponseToolkit) => {
    try {
      const { userId } = req.params;
      const scores = await AssessmentService.getUserLatestApprovedScores(
        parseInt(userId)
      );

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

  // Get assessments assigned to current reviewer
  getMyAssignedAssessments: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const currentUserId = req.auth.credentials.user.id;

      const assessments = await AssessmentService.getAssessmentsForReviewer(
        currentUserId
      );

      return h
        .response({
          success: true,
          data: assessments,
        })
        .code(200);
    } catch (error: any) {
      console.error("Error getting assigned assessments:", error);
      return h
        .response({
          success: false,
          error: "Failed to retrieve assigned assessments",
        })
        .code(500);
    }
  },
};

export default AssessmentController;