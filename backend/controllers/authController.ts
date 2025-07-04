import bcrypt from "bcrypt";
import Jwt from "@hapi/jwt";
import { AppDataSource } from "../config/dataSource";
import * as msal from "@azure/msal-node";
import { User } from "../entities/User";
// import { Auth } from "../entities/Auth";
import dotenv from "dotenv";
import { Request, ResponseToolkit } from '@hapi/hapi';
import { Controller } from '../types/hapi';
import {LoginPayload,SignupPayload,MicrosoftAccount} from "../types/controller";
dotenv.config();

const userRepo = AppDataSource.getRepository(User);
// const authRepo = AppDataSource.getRepository(Auth);


const msalConfig = {
  auth: {
    clientId: process.env.MS_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}`,
    clientSecret: process.env.MS_CLIENT_SECRET,
  },
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

const AuthController: Controller = {
  microsoftLogin: async (request: Request, h: ResponseToolkit) => {
    // Check if this is a callback from Microsoft (has code parameter)
    if (!request.query.code) {
      // No code parameter means this is not a callback, redirect to start login
      console.log("No authorization code found, redirecting to start login");
      return h.redirect('/api/auth/start-login');
    }

    const tokenRequest = {
      code: request.query.code as string,
      scopes: ["user.read"],
      redirectUri: process.env.REDIRECT_URI,
    };

    try {
      console.log("Processing OAuth callback with code:", request.query.code.substring(0, 10) + "...");
      
      const response = await cca.acquireTokenByCode(tokenRequest);
      const account = response.account as MicrosoftAccount;
      const accessToken = response.accessToken;

      const payload = {
        name: account.name,
        email: account.username,
        oid: account.homeAccountId,
      };

      const email = payload.email.toLowerCase();
      console.log("Microsoft OAuth successful for email:", email);

      // Use email or Microsoft ID to find the user
      const user = await userRepo.findOne({
        where: { email: email },
        relations: ["role", "Team", "position"],
      });

      if (!user) {
        console.log("User not found in database:", email);
        return h
          .response({
            error:
              "No account exists for this Microsoft account. Contact Admin.",
          })
          .code(404);
      }

      console.log("User found:", user.name, user.email);

      // Fetch profile photo
      if (!user.profilePhoto) {
        let profilePhoto = null;
      try {
        const photoRes = await fetch(
          "https://graph.microsoft.com/v1.0/me/photo/$value",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (photoRes.ok) {
          const arrayBuffer = await photoRes.arrayBuffer();
          const base64Image = Buffer.from(arrayBuffer).toString("base64");
          profilePhoto = `data:image/jpeg;base64,${base64Image}`;
        } else {
          console.log("No profile photo found for user, using default.");
          profilePhoto = null;
        }
      } catch (err: any) {
        console.error("Error fetching photo:", err.message);
        profilePhoto = null;
      }
        user.profilePhoto = profilePhoto;
        await userRepo.save(user);
      }

      // Generate JWT token for authenticated sessions
      const token = Jwt.token.generate(
        {
          id: user.id,
          role: user.role,
          name: user.name,
          email: user.email,
          hrId: user.hrId,
          leadId: user.leadId,
          position: user.position,
          Team: user.Team,
        },
        { key: process.env.JWT_SECRET_KEY as string, algorithm: "HS256" }
      );
      
      console.log("Redirecting to frontend with token:", process.env.FRONTEND_REDIRECT);
      return h.redirect(`${process.env.FRONTEND_REDIRECT}auth/callback?token=${encodeURIComponent(token)}`);
    } catch (error) {
      console.error("Microsoft OAuth error:", error);
      return h.response({ error: "Internal Server Error" }).code(500);
    }
  },

  startLogin: async (request: Request, h: ResponseToolkit) => {
    try {
      const authCodeUrlParams = {
        scopes: ["user.read"],
        redirectUri: process.env.REDIRECT_URI,
      };
      const url = await cca.getAuthCodeUrl(authCodeUrlParams);
      console.log("Starting Microsoft OAuth login");
      console.log("Redirect URI:", process.env.REDIRECT_URI);
      console.log("Generated Auth URL:", url.substring(0, 100) + "...");
      return h.redirect(url);
    } catch (error) {
      console.error("Error starting login:", error);
      return h.response({ error: "Failed to start login process" }).code(500);
    }
  },

  // Legacy login method (simplified for development)
  login: async (req: Request, h: ResponseToolkit) => {
    try {
      const { email, password } = req.payload as { email: string; password: string };

      if (!email || !password) {
        return h
          .response({ error: "Email and password are required" })
          .code(400);
      }

      const user = await userRepo.findOne({
        where: { email },
        relations: ["role", "Team", "position"],
      });

      if (!user) {
        return h
          .response({
            error: "User not found. Please contact admin or use Microsoft login",
          })
          .code(404);
      }

      // For development: accept any password (remove this in production!)
      // In production, you'd want to verify the password against a hash
      console.log(`Legacy login attempt for: ${email}`);

      const token = Jwt.token.generate(
        {
          id: user.id,
          role: user.role,
          name: user.name,
          email: user.email,
          hrId: user.hrId,
          leadId: user.leadId,
          position: user.position,
          Team: user.Team,
        },
        { key: process.env.JWT_SECRET_KEY as string, algorithm: "HS256" }
      );
      
      return h.response({ 
        success: true,
        token, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          position: user.position,
          Team: user.Team
        }
      }).code(200);
    } catch (error) {
      console.error("Legacy login error:", error);
      return h.response({ error: "Internal Server Error" }).code(500);
    }
  },

  // Legacy signup method (simplified for development)
  signup: async (req: Request, h: ResponseToolkit) => {
    try {
      const { email, password } = req.payload as { email: string; password: string };

      // validation
      if (!email || !password) {
        return h
          .response({ error: "Email and Password are required fields" })
          .code(400);
      }

      const existing = await userRepo.findOneBy({ email });
      
      if (!existing) {
        return h
          .response({
            error: "User not found for this email. Please contact admin to create your account first",
          })
          .code(404);
      }

      // For development: just return success (in production, you'd set up password hash)
      console.log(`Legacy signup attempt for: ${email}`);
      
      return h.response({ 
        success: true,
        message: "Account setup completed. You can now login." 
      }).code(201);
    } catch (error) {
      console.error("Legacy signup error:", error);
      return h.response({ error: "Internal Server Error" }).code(500);
    }
  },
};

export default AuthController;