// This is a placeholder for the actual service
// The service file doesn't exist yet, so we'll create a mock
const SkillUpdateRequestService = {
  createRequest: async (
    skillScore: any,
    targetUserId: any,
    reviewHistory: any,
    editedSkillScore: any,
    reviewChain: any,
    currentReviewer: any
  ) => {
    return { currentReviewer };
  },
  getRequestById: async (id: string) => {
    return { id };
  },
  getRequestForUser: async (userId: string) => {
    return [];
  },
  getAllRequests: async () => {
    return [];
  },
  getPendingRequests: async (reviewerId: string) => {
    return [];
  },
  cancelRequest: async (id: string) => {
    return true;
  },
  updateRequestStatus: async (
    id: string,
    status: string,
    reviewedBy: string,
    editedSkillScore: any,
    comments: any
  ) => {
    return { currentReviewer: "next-reviewer" };
  }
};
import { AppDataSource, roleRepo } from "../config/dataSource";
// import { role, User } from "../entities/User";
import { Request, ResponseToolkit } from '@hapi/hapi';
import { Controller, AuthRequest } from '../types/hapi';
import SkillService from '../services/SkillService';
import { userRepo, } from "../config/dataSource";

// const userRepo = AppDataSource.getRepository(User);

interface SkillScore {
  skillId: number;
  score: number;
}

interface RequestPayload {
  userId?: string;
  editedSkillScore?: SkillScore[];
  skillScore: SkillScore[];
  comments?: string;
  status?: string;
}

interface ReviewHistoryItem {
  createrRole: string;
  createdBy: string;
  createdAt: Date;
  comments?: string;
}

const SkillUpdateRequestController: Controller = {
  createRequest: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userData = req.auth.credentials.user;
      const createdBy = userData.id;
      const createrRole = userData.role?.name;
      const payload = req.payload as RequestPayload;
      const { userId, editedSkillScore, skillScore } = payload;

      // Use the authenticated user's ID if userId is not provided
      const targetUserId = userId || createdBy;

      let reviewHistory: ReviewHistoryItem[] = [];
        reviewHistory.push({
          createrRole,
          createdBy,
          createdAt: new Date(),
        });
      
      const user = await userRepo.findOneBy({ id: (targetUserId) });
      if (!user) return h.response({ error: "User not found" }).code(404);

      const reviewChain: string[] = [];
      let id = user.id;
      while (id) {
        const record = await userRepo.findOneBy({ id: id });
        if (record && record.leadId) reviewChain.push(record.leadId);
        id = record && record.leadId ? record.leadId : null;
      }
      if (user.hrId && user.leadId) reviewChain.push(user.hrId);

      const request = await SkillUpdateRequestService.createRequest(
        skillScore,
        targetUserId,
        reviewHistory,
        editedSkillScore,
        reviewChain,
        reviewChain.length > 0 ? reviewChain[0] : null
      );

      const responseMessage = request.currentReviewer
        ? `Request created successfully by ${createdBy} and forwarded to ${request.currentReviewer}`
        : "Request created successfully";

      return h.response(responseMessage).code(201);
    } catch (err: any) {
      console.error("Error creating request:", err);
      return h.response({ error: err.message }).code(500);
    }
  },

  getRequestById: async (req: Request, h: ResponseToolkit) => {
    try {
      const request = await SkillUpdateRequestService.getRequestById(
        req.params.id
      );
      if (!request) return h.response({ error: "Request not found" }).code(404);
      return h.response(request).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  getRequestForUser: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userId = req.auth.credentials.user.id;
      const requests = await SkillUpdateRequestService.getRequestForUser(
        userId
      );
      return h.response(requests).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  getAllRequests: async (req: Request, h: ResponseToolkit) => {
    try {
      const requests = await SkillUpdateRequestService.getAllRequests();
      return h.response(requests).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  getPendingRequests: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const reviewerId = req.auth.credentials.user.id;
      if (!reviewerId)
        return h.response({ error: "Missing reviewerId" }).code(400);
      const requests = await SkillUpdateRequestService.getPendingRequests(
        reviewerId
      );
      return h.response(requests).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  cancelRequest: async (req: Request, h: ResponseToolkit) => {
    try {
      await SkillUpdateRequestService.cancelRequest(req.params.id);
      return h.response({ message: "Request cancelled" }).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(400);
    }
  },

  updateRequestStatus: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userData = req.auth.credentials.user;
      const reviewedBy = userData.id;
      const payload = req.payload as RequestPayload;
      const { status, editedSkillScore, comments } = payload;

      const user = await userRepo.findOneBy({
        id: (reviewedBy),
      });
      const role = await roleRepo.findOneBy({
        id: user?.roleId
      })

      
      if(!user?.leadId && role?.name !== "hr" && editedSkillScore){
        return h.response({error:"You are not allowed to edit skills"}).code(403);
      }
      
      const updated = await SkillUpdateRequestService.updateRequestStatus(
        req.params.id,
        status as string,
        reviewedBy,
        editedSkillScore,
        comments
      );
      
      if (status === "Forwarded") {
        return h
          .response(
            "Updated successfully and forwarded to " +
              updated.currentReviewer +
              " " +
              updated
          )
          .code(200);
      } else {
        return h.response("Fully Approved" + updated).code(200);
      }
    } catch (err: any) {
      return h.response({ error: err.message }).code(400);
    }
  },
};

export default SkillUpdateRequestController;