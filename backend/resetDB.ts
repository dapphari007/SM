import { AppDataSource } from "./config/dataSource";
import { User } from "./entities/User";
import { Skill } from "./entities/Skill";
import { SkillUpgradeGuide } from "./entities/SkillUpgradeGuide";
import { Role } from "./entities/Role";
import { Position } from "./entities/Position";
import { Team } from "./entities/Team";
import { Auth } from "./entities/Auth";
import { AssessmentRequest } from "./entities/AssessmentRequest.new";
import { Score } from "./entities/Score";
import { Audit } from "./entities/Audit";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export async function resetDatabase(): Promise<void> {
  try {
    console.log("🔄 Starting database reset...");

    // Initialize data source if not already initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("✅ Database connection established");
    }

    // Get all repositories
    const authRepo = AppDataSource.getRepository(Auth);
    const auditRepo = AppDataSource.getRepository(Audit);
    const scoreRepo = AppDataSource.getRepository(Score);
    const assessmentRepo = AppDataSource.getRepository(AssessmentRequest);
    const userRepo = AppDataSource.getRepository(User);
    const skillRepo = AppDataSource.getRepository(Skill);
    const guideRepo = AppDataSource.getRepository(SkillUpgradeGuide);
    const roleRepo = AppDataSource.getRepository(Role);
    const positionRepo = AppDataSource.getRepository(Position);
    const teamRepo = AppDataSource.getRepository(Team);

    console.log("🗑️  Clearing all tables...");

    // For PostgreSQL, we need to disable foreign key checks or use CASCADE
    // Let's use raw SQL to truncate all tables with CASCADE
    const tableNames = [
      'audits', 'scores', 'assessment_requests', 'auths', 'users', 
      'skill_upgrade_guides', 'skills', 'roles', 'positions', 'teams'
    ];

    // Disable foreign key checks
    await AppDataSource.query('SET session_replication_role = replica;');
    console.log("   🔓 Foreign key constraints temporarily disabled");

    // Truncate all tables
    for (const tableName of tableNames) {
      try {
        await AppDataSource.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
        console.log(`   ✅ Cleared ${tableName} table`);
      } catch (error) {
        // Table might not exist or might be empty, that's okay
        console.log(`   ⚠️  Table ${tableName} not found or already empty`);
      }
    }

    // Re-enable foreign key checks
    await AppDataSource.query('SET session_replication_role = DEFAULT;');
    console.log("   🔒 Foreign key constraints re-enabled");

    console.log("✅ Database reset completed successfully!");
    
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    throw error;
  }
}

// Allow running this script directly
console.log("🔄 Running database reset script...");

resetDatabase()
  .then(() => {
    console.log("🎉 Database reset script completed!");
    process.exit(0);
  })
  .catch((error: Error) => {
    console.error("💥 Database reset script failed:", error);
    process.exit(1);
  });
