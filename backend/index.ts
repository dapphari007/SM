import Hapi from "@hapi/hapi";
import dotenv from "dotenv";
import { AppDataSource } from "./config/dataSource";
import userRoutes from "./routes/UserRoute";
import skillRoutes from "./routes/skillRoute";
import guideRoutes from "./routes/skillUpgradeGuideRoute";
import requestRoutes from "./routes/SkillUpdateRequestRoute";
import Jwt from "@hapi/jwt";
import authRoutes from "./routes/AuthRoute";
// import { seedInitialData } from "./seeder";
import assessmentRoutes from "./routes/AssessmentRoute";

dotenv.config();

const init = async () => {
  // Initialize database connection first
  await AppDataSource.initialize();
  console.log("Database connected");
  
  // Then seed initial data
  // await seedInitialData();

  const server = Hapi.server({
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: "localhost",
    routes: {
      cors: {
        origin: ["*"],
        credentials: true,
      },
    },
  });

  await server.register(Jwt);

  server.auth.strategy("jwt", "jwt", {
    keys: process.env.JWT_SECRET_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      nbf: true,
      exp: true,
    },
    validate: async (artifacts: any, request: Hapi.Request, h: Hapi.ResponseToolkit) => {
      return {
        isValid: true,
        credentials: { user: artifacts.decoded.payload },
      };
    },
  });

  server.auth.default("jwt");

  await server.register({
    plugin: userRoutes,
    options: {},
    routes: {
      prefix: "/api/users",
    },
  });

  await server.register({
    plugin: guideRoutes,
    options: {},
    routes: {
      prefix: "/api/guides",
    },
  });

  await server.register({
    plugin: skillRoutes,
    options: {},
    routes: {
      prefix: "/api/skills",
    },
  });

  await server.register({
    plugin: assessmentRoutes,
    options: {},
    routes: {
      prefix: "/api/assess",
    },
  });

  await server.register({
    plugin: requestRoutes,
    options: {},
    routes: {
      prefix: "/api/requests",
    },
  });

  await server.register({
    plugin: authRoutes,
    options: {},
    routes: {
      prefix: "/api/auth",
    },
  });

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

init().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});