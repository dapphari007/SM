import bcrypt from "bcrypt";
import Jwt from "@hapi/jwt";
import { AppDataSource } from "../config/dataSource";
import * as msal from "@azure/msal-node";
import { User } from "../entities/User";
import { Auth } from "../entities/Auth";
import dotenv from "dotenv";
import { Request, ResponseToolkit } from '@hapi/hapi';
import { Controller } from '../types/hapi';

dotenv.config();

const userRepo = AppDataSource.getRepository(User);
const authRepo = AppDataSource.getRepository(Auth);

interface LoginPayload {
  email: string;
  password: string;
}

interface SignupPayload {
  email: string;
  password: string;
}

interface MicrosoftAccount {
  name: string;
  username: string;
  homeAccountId: string;
}

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
    const tokenRequest = {
      code: request.query.code as string,
      scopes: ["user.read"],
      redirectUri: process.env.REDIRECT_URI,
    };

    try {
      const response = await cca.acquireTokenByCode(tokenRequest);
      const account = response.account as MicrosoftAccount;
      const accessToken = response.accessToken;

      const payload = {
        name: account.name,
        email: account.username,
        oid: account.homeAccountId,
      };

      const email = payload.email.toLowerCase();

      // Use email or Microsoft ID to find the user
      const user = await userRepo.findOne({
        where: { email: email },
        relations: ["role", "Team", "position"],
      });

      if (!user) {
        return h
          .response({
            error:
              "No account exists for this Microsoft account. Contact Admin.",
          })
          .code(404);
      }

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

      const token = Jwt.token.generate(
        {
          id: user.id,
          userId: user.userId,
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
      return h.redirect(`${process.env.FRONTEND_REDIRECT}?token=${token}`);
    } catch (error) {
      console.log(error);
      return h.response({ error: "Internal Server Error" }).code(500);
    }
  },

  startLogin: async (request: Request, h: ResponseToolkit) => {
    const authCodeUrlParams = {
      scopes: ["user.read"],
      redirectUri: process.env.REDIRECT_URI,
    };
    const url = await cca.getAuthCodeUrl(authCodeUrlParams);
    console.log("inside start login");
    return h.redirect(url);
  },

  login: async (req: Request, h: ResponseToolkit) => {
    try {
      const { email, password } = req.payload as LoginPayload;
      const auth = await authRepo
        .createQueryBuilder("auth")
        .addSelect("auth.passwordHash")
        .where("auth.email = :email", { email: email })
        .getOne();

      const user = await userRepo.findOne({
        where: { email },
        relations: ["role", "Team", "position"],
      });

      if (!user || !auth?.passwordHash) {
        return h
          .response({
            error:
              "Invalid username or password does not exist. Please sign up",
          })
          .code(401);
      }

      const isMatch = await bcrypt.compare(password, auth.passwordHash);
      if (!isMatch) {
        return h.response({ error: "Invalid credentials" }).code(401);
      }

      const token = Jwt.token.generate(
        {
            id: user.id,
          userId: user.userId,
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
      return h.response({ token, user }).code(200);
    } catch (error) {
      console.log(error);
      return h.response({ error: "Internal Server Error" }).code(500);
    }
  },

  signup: async (req: Request, h: ResponseToolkit) => {
    try {
      const { email, password } = req.payload as SignupPayload;

      // validation
      if (!email || !password) {
        return h
          .response({ error: "Email and Password are required fields" })
          .code(400);
      }

      const existing = await userRepo.findOneBy({ email });
      const authDetails = await authRepo.findOne({
        where: { email: email },
        select: ["id", "email", "passwordHash"] as any,
      });
      
      if (!existing) {
        return h
          .response({
            error: "User not found for this email. Please Contact Admin",
          })
          .code(404);
      }

      if (authDetails?.passwordHash) {
        return h
          .response({
            error: "Password already set for this email address. Please Login",
          })
          .code(409);
      }

      const passwordHash = await bcrypt.hash(password, 10);

      if (authDetails) {
        authDetails.passwordHash = passwordHash;
        await authRepo.save(authDetails);
      }

      return h.response({ message: "Password set successfully" }).code(201);
    } catch (error) {
      console.log(error);
      return h.response({ error: "Internal Server Error" }).code(500);
    }
  },
};

export default AuthController;