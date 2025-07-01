import { ResponseToolkit } from "@hapi/hapi";
import { Controller, AuthRequest } from "../types/hapi";

export const SkillUpdateRequestService = {
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