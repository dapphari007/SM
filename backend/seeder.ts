import { AppDataSource } from "./config/dataSource";
import { User } from "./entities/User";
import { Skill } from "./entities/Skill";
import { SkillUpgradeGuide } from "./entities/SkillUpgradeGuide";
import { Role } from "./entities/Role";
import { Position } from "./entities/Position";
import { Team } from "./entities/Team";
import { Auth } from "./entities/Auth";
import skillData from "./data/skill";
import userData from "./data/user";
import upgradeGuideData from "./data/upgradeguide";
import roleData from './data/role';
import positionData from './data/position';
import teamData from './data/team';
import authData from './data/auth';
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const users = userData;
const skills = skillData;
const upgradeGuides = upgradeGuideData;
const roles = roleData;
const positions = positionData;
const teams = teamData;
const auths = authData;

export async function seedInitialData(): Promise<void> {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const skillRepo = AppDataSource.getRepository(Skill);
    const guideRepo = AppDataSource.getRepository(SkillUpgradeGuide);
    const roleRepo = AppDataSource.getRepository(Role);
    const positionRepo = AppDataSource.getRepository(Position);
    const teamRepo = AppDataSource.getRepository(Team);
    const authRepo = AppDataSource.getRepository(Auth);

    console.log("🌱 Starting data seeding...");

    // Step 1: Insert independent entities first (no foreign key dependencies)
    console.log("   📝 Inserting roles...");
    await roleRepo.save(roleRepo.create(roles));

    console.log("   📝 Inserting positions...");
    await positionRepo.save(positionRepo.create(positions));

    console.log("   📝 Inserting teams...");
    await teamRepo.save(teamRepo.create(teams));

    console.log("   📝 Inserting skills...");
    await skillRepo.save(skillRepo.create(skills));

    console.log("   📝 Inserting upgrade guides...");
    await guideRepo.save(
      guideRepo.create(
        upgradeGuides.map(guide => ({
          ...guide,
          fromLevel: Number(guide.fromLevel),
          toLevel: Number(guide.toLevel),
        }))
      )
    );

    // Step 2: Insert users (depends on roles, positions, teams)
    console.log("   👥 Inserting users...");
    await userRepo.save(userRepo.create(users as any));

    // Step 3: Insert auth records (depends on users via email)
    console.log("   🔐 Inserting auth records...");
    await authRepo.save(authRepo.create(auths as any));

    console.log("✅ Data seeding complete!");
  } catch (error) {
    console.error("❌ Error during data seeding:", error);
    throw error;
  }
}

// Allow running this script directly
if (require.main === module) {
  console.log("🌱 Running seeder script independently...");
  
  AppDataSource.initialize()
    .then(async () => {
      console.log("✅ Database connection established");
      await seedInitialData();
      await AppDataSource.destroy();
      console.log("🔌 Database connection closed");
      console.log("🎉 Seeding completed successfully!");
      process.exit(0);
    })
    .catch((error: Error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}
