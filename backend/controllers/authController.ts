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

  // login: async (req: Request, h: ResponseToolkit) => {
  //   try {
  //     const { email, password } = req.payload as LoginPayload;
  //     // const auth = await authRepo
  //     //   .createQueryBuilder("auth")
  //     //   .addSelect("auth.passwordHash")
  //     //   .where("auth.email = :email", { email: email })
  //     //   .getOne();

  //     const user = await userRepo.findOne({
  //       where: { email },
  //       relations: ["role", "Team", "position"],
  //     });

  //     // if (!user || !auth?.passwordHash) {
  //     //   return h
  //     //     .response({
  //     //       error:
  //     //         "Invalid username or password does not exist. Please sign up",
  //     //     })
  //     //     .code(401);
  //     // }

  //     // const isMatch = await bcrypt.compare(password, auth.passwordHash);
  //     // if (!isMatch) {
  //     //   return h.response({ error: "Invalid credentials" }).code(401);
  //     // }

  //     const token = Jwt.token.generate(
  //       {
  //         id: user.id,
  //         role: user.role,
  //         name: user.name,
  //         email: user.email,
  //         hrId: user.hrId,
  //         leadId: user.leadId,
  //         position: user.position,
  //         Team: user.Team,
  //       },
  //       { key: process.env.JWT_SECRET_KEY as string, algorithm: "HS256" }
  //     );
  //     return h.response({ token, user }).code(200);
  //   } catch (error) {
  //     console.log(error);
  //     return h.response({ error: "Internal Server Error" }).code(500);
  //   }
  // },

  // signup: async (req: Request, h: ResponseToolkit) => {
  //   try {
  //     const { email, password } = req.payload as SignupPayload;

  //     // validation
  //     if (!email || !password) {
  //       return h
  //         .response({ error: "Email and Password are required fields" })
  //         .code(400);
  //     }

  //     const existing = await userRepo.findOneBy({ email });
  //     // const authDetails = await authRepo.findOne({
  //     //   where: { email: email },
  //     //   select: ["id", "email", "passwordHash"] as any,
  //     // });
      
  //     if (!existing) {
  //       return h
  //         .response({
  //           error: "User not found for this email. Please Contact Admin",
  //         })
  //         .code(404);
  //     }

  //     // if (authDetails?.passwordHash) {
  //     //   return h
  //     //     .response({
  //     //       error: "Password already set for this email address. Please Login",
  //     //     })
  //     //     .code(409);
  //     // }

  //     // const passwordHash = await bcrypt.hash(password, 10);

  //     // if (authDetails) {
  //     //   authDetails.passwordHash = passwordHash;
  //     //   await authRepo.save(authDetails);
  //     // }

  //     return h.response({ message: "Password set successfully" }).code(201);
  //   } catch (error) {
  //     console.log(error);
  //     return h.response({ error: "Internal Server Error" }).code(500);
  //   }
  // },
};

export default AuthController;