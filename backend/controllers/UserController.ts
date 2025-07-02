import UserService from "../services/UserService";
import { Request, ResponseToolkit } from '@hapi/hapi';
import { Controller, AuthRequest } from '../types/hapi';
import { UserData } from "../types/controller";

const UserController: Controller = {
  getUserById: async (req: AuthRequest, h: ResponseToolkit) => {
    try {
      const userId = req.auth.credentials.user.id;
      const user = await UserService.getUserById(userId);
      return h.response(user).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(404);
    }
  },

  getAllUsers: async (req: Request, h: ResponseToolkit) => {
    try {
      const users = await UserService.getAllUsers(req.payload as any);
      return h.response(users).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  createUser: async (req: Request, h: ResponseToolkit) => {
    try {
      const data = req.payload as any;
      if(!data.userId || !data.name){
        return h.response({error:"Missing required fields ID and Name"}).code(400);
      }
      const created = await UserService.createUser(data);
      
      return h.response({message: "User Added successfully!"}).code(201);
    } catch (err: any) {
      return h.response({ error: err.message }).code(400);
    }
  },

  updateUser: async (req: Request, h: ResponseToolkit) => {
    try {
      const updated = await UserService.updateUser(req.payload as any);
      return h.response({message: "Updated successfully!"}).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(404);
    }
  },

  deleteUser: async (req: Request, h: ResponseToolkit) => {
    try {
      const deleted = await UserService.deleteUser(req.params.id);
      return h.response({message:"Successfully Deleted user with ID " + req.params.id + "!"}).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(404);
    }
  },

  getTeamMemebers: async (req: Request, h: ResponseToolkit) => {
    try {
      const teamId = req.params.teamId;
      if (!teamId) {
        return h.response({ error: "Team ID is required" }).code(400);
      }
      const members = await UserService.getTeamMembers(teamId);
      return h.response(members).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  getTeamMatrix: async (req: Request, h: ResponseToolkit) => {
    try {
      const matrix = await UserService.getSkillMatrixByTeam(req.params.teamName);
      return h.response(matrix).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  getFullMatrix: async (req: Request, h: ResponseToolkit) => {
    try {
      const matrix = await UserService.getFullSkillMatrix();
      return h.response(matrix).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },

  getAllDetails: async (req: Request, h: ResponseToolkit) => {
    try {
      const type = req.query.type as string || "all";
      let data;
      
      switch (type) {
        case "all":
          const positions = await UserService.getAllPositions();
          const roles = await UserService.getAllRoles();
          const teams = await UserService.getAllTeams();
          return h.response({ positions, roles, teams }).code(200);
        case "position":
           data = await UserService.getAllPositions();
          break;
        case "role":
          data = await UserService.getAllRoles();
          break;
        case "team":
          data = await UserService.getAllTeams();
          break;
        default:
          return h.response({ error: "Invalid type parameter" }).code(400);
      }
      return h.response(data).code(200);
    } catch (err: any) {
      return h.response({ error: err.message }).code(500);
    }
  },
};

export default UserController;