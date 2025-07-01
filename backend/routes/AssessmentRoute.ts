import AssessmentController from "../controllers/AssessmentController";
import { ServerRegisterOptions } from "@hapi/hapi";

const assessmentRoutes = {
  name: "assessment-routes",
  register: async function (server, options) {
    server.route([
      {
        method: "POST",
        path: "/create",
        handler: AssessmentController.createAssessment,
      },
      {
        method: "GET",
        path: "/{id}",
        handler: AssessmentController.getAssessmentById,
      },
      {
        method: "GET",
        path: "/all",
        handler: AssessmentController.getAllAssessments,
      },
      {
        method: "POST",
        path: "/review/{assessmentId}",
        handler: AssessmentController.reviewAssessment,
      },
      {
        method: "GET",
        path: "/pending",
        handler: AssessmentController.getMyAssignedAssessments,
      },
      {
        method: "DELETE",
        path: "/cancel/{assessmentId}",
        handler: AssessmentController.cancelAssessment,
      },
      {
        method: "GET",
        path: "/score",
        handler: AssessmentController.getUserLatestApprovedScores,
      },
      {
        method: "GET",
        path: "/score/{userId}",
        handler: AssessmentController.getUserLatestApprovedScoresByUserId,
      },
    ]);
  },
};

export default assessmentRoutes;