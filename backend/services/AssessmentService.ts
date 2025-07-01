import { In } from "typeorm";
import { AppDataSource } from "../config/dataSource";
import { AssessmentRequest as AssessmentRequestEntity } from "../entities/AssessmentRequest";
import { Score as ScoreEntity } from "../entities/Score";
import { User as UserEntity } from "../entities/User";
import { Skill as SkillEntity } from "../entities/Skill";
import { Audit as AuditEntity } from "../entities/Audit";
import { 
  AssessmentData, 
  SkillAssessmentData, 
  ReviewData, 
  ScoreData 
} from "../types/services";
import { AssessmentRequest, Score, User, Skill, Audit } from "../types/entities";

const assessmentRequestRepo = AppDataSource.getRepository(AssessmentRequestEntity);
const scoreRepo = AppDataSource.getRepository(ScoreEntity);
const userRepo = AppDataSource.getRepository(UserEntity);
const skillRepo = AppDataSource.getRepository(SkillEntity);
const auditRepo = AppDataSource.getRepository(AuditEntity);

interface AssessmentWithScores extends Omit<AssessmentRequest, 'Score'> {
  detailedScores: Score[];
  Score?: Score[];
}

interface LatestScore {
  id: number;
  self_score: number | null;
  lead_score: number | null;
  updated_at: Date;
  skill_name: string;
  skill_id: number;
  requestedAt: Date;
}

const AssessmentService = {
  createAssessment: async (
    userId: string,
    comments: string = "",
    skillAssessments: SkillAssessmentData[] = []
  ): Promise<AssessmentWithScores> => {
    try {
      // Validate user exists
      const user = await userRepo.findOneBy({ id: parseInt(userId) });
      if (!user) {
        throw new Error("User not found");
      }

      if (skillAssessments.length === 0) {
        throw new Error("No skill assessments provided");
      }

      // Check for existing pending assessments
      const existingAssessment = await assessmentRequestRepo.findOne({
        where: {
          userId: userId,
          status: In(["Pending"]),
        },
      });

      const status = (user.hrId || user.leadId) ? 'Pending' : 'Approved';

      let savedAssessment;
      if (existingAssessment) {
        throw new Error("User already has a pending assessment");
      } else {
        // Create assessment request
        const assessment = assessmentRequestRepo.create({
          userId: userId,
          status: status,
          nextApprover: user.leadId || user.hrId,
        });
        savedAssessment = await assessmentRequestRepo.save(assessment);
      }

      // Create scores for each skill assessment
      if (skillAssessments && skillAssessments.length > 0) {
        await AssessmentService.addSkillScores(
          savedAssessment.id,
          skillAssessments,
          userId
        );
      }
      
      if (savedAssessment) {
        await auditRepo.save({
          assessmentId: savedAssessment.id,
          auditType: "Create",
          editorId: typeof userId === 'string' ? parseInt(userId) : userId,
          comments: comments,
        });
      }
      
      return await AssessmentService.getAssessmentById(savedAssessment.id);
    } catch (error: any) {
      throw new Error(`Failed to create assessment: ${error.message}`);
    }
  },

  addSkillScores: async (
    assessmentId: number,
    skillAssessments: SkillAssessmentData[],
    userId: string
  ): Promise<Score[]> => {
    try {
      const assessment = await assessmentRequestRepo.findOneBy({
        id: assessmentId,
      });
      
      if (!assessment) {
        throw new Error("Assessment not found");
      }

      const user = await userRepo.findOneBy({ id: typeof userId === 'string' ? parseInt(userId) : userId });

      const scores: Score[] = [];

      for (const skillAssessment of skillAssessments) {
        // Validate skill exists
        const skill = await skillRepo.findOneBy({
          id: skillAssessment.skillId,
        });
        
        if (!skill) {
          throw new Error(`Skill with ID ${skillAssessment.skillId} not found`);
        }

        const scoreValue = skillAssessment.selfScore;

        // Check if score already exists for this assessment and skill
        let existingScore = await scoreRepo.findOne({
          where: {
            assessmentId: assessmentId,
            skillId: skillAssessment.skillId,
          },
        });

        // Determine where to store the score based on who created it
        let selfScore: number | null = null;
        let leadScore: number | null = null;

        if (!user?.leadId) {
          selfScore = scoreValue;
          leadScore = scoreValue;
        } else {
          selfScore = scoreValue;
          leadScore = null;
        }

        const score = scoreRepo.create({
          assessmentId: assessmentId,
          skillId: skillAssessment.skillId,
          selfScore: selfScore,
          leadScore: leadScore,
        });

        scores.push(await scoreRepo.save(score));
      }

      return scores;
    } catch (error: any) {
      throw new Error(`Failed to add skill scores: ${error.message}`);
    }
  },

  getAssessmentById: async (id: number): Promise<AssessmentWithScores> => {
    try {
      const assessment = await assessmentRequestRepo.findOne({
        where: { id },
        relations: ["user"],
      });
      
      if (!assessment) {
        throw new Error("Assessment not found");
      }

      // Get detailed scores with skill information
      const scores = await scoreRepo.find({
        where: { assessmentId: id },
        relations: ["Skill"],
      });

      return {
        ...assessment,
        detailedScores: scores,
      };
    } catch (error: any) {
      throw new Error(`Failed to retrieve assessment: ${error}`);
    }
  },

  getUserAssessments: async (userId: string | number): Promise<AssessmentWithScores[]> => {
    try {
      const user = await userRepo.findOneBy({ id: typeof userId === 'string' ? parseInt(userId as string) : userId });
      if (!user) {
        throw new Error("User not found");
      }

      const assessments = await assessmentRequestRepo.find({
        where: { userId: userId.toString() },
        relations: ["Score"],
        order: { requestedAt: "DESC" } as any,
      });

      // Get detailed information for each assessment
      const detailedAssessments: AssessmentWithScores[] = [];
      for (const assessment of assessments) {
        const scores = await scoreRepo.find({
          where: { assessmentId: assessment.id },
          relations: ["Skill"],
        });

        detailedAssessments.push({
          ...assessment,
          detailedScores: scores,
        });
      }

      return detailedAssessments;
    } catch (error: any) {
      throw new Error(`Failed to retrieve user assessments: ${error.message}`);
    }
  },

  getAllAssessments: async (): Promise<AssessmentRequest[]> => {
    try {
      return await assessmentRequestRepo.find({
        relations: ["user", "Score"],
        order: { requestedAt: "DESC" } as any,
      });
    } catch (error: any) {
      throw new Error(`Failed to retrieve all assessments: ${error.message}`);
    }
  },
  
  cancelAssessment: async (assessmentId: number): Promise<AssessmentRequest> => {
    try {
      const assessment = await assessmentRequestRepo.findOneBy({
        id: assessmentId,
      });
      
      if (!assessment) {
        throw new Error("Assessment not found");
      }

      if (
        assessment.status === "Approved" ||
        assessment.status === "Forwarded"
      ) {
        throw new Error("Cannot cancel an approved or forwarded assessment");
      }

      assessment.status = "Cancelled";
      await scoreRepo?.delete({ assessmentId: assessmentId });
      
      // Reset sequence for scores
      await AppDataSource.query(`
          SELECT setval(
            pg_get_serial_sequence('scores', 'id'),
            (SELECT COALESCE(MAX(id), 0) FROM scores)
          )
        `);
        
      return await assessmentRequestRepo.save(assessment);
    } catch (error: any) {
      throw new Error(`Failed to cancel assessment: ${error.message}`);
    }
  },

  reviewAssessment: async (
    assessmentId: number, 
    reviewData: ReviewData, 
    currentUserId: string
  ): Promise<void> => {
    try {
      const assessment = await assessmentRequestRepo.findOne({
        where: { id: assessmentId },
        relations: ["user", "Score"],
      });
      
      if (!assessment) {
        throw new Error("Assessment not found");
      }

      if (
        assessment.status !== "Pending" &&
        assessment.status !== "Forwarded"
      ) {
        throw new Error("Assessment is not in a reviewable state");
      }

      const hrId = assessment.user.hrId;

      if (currentUserId !== assessment.nextApprover?.toString()) {
        throw new Error("You are not authorized to review this assessment");
      }

      // Update lead scores if provided
      if (reviewData.scoreUpdates && Array.isArray(reviewData.scoreUpdates)) {
        for (const scoreUpdate of reviewData.scoreUpdates as any[]) {
          const score = await scoreRepo.findOneBy({
            skillId: scoreUpdate.skillId,
            assessmentId: assessmentId,
          });

          if (score) {
            if (scoreUpdate.score < 1 || scoreUpdate.score > 4) {
              throw new Error(`Invalid lead score. Must be between 1 and 4`);
            }
            score.leadScore = scoreUpdate.score;
            await scoreRepo.save(score);
          }
        }
      }

      if (reviewData.status === "Forwarded") {
        // Only non-HR users can forward
        if (currentUserId === hrId) {
          throw new Error("HR can only approve assessments, not forward them");
        }
        assessment.status = "Forwarded";
      } else if (reviewData.status === "Approved") {
        if (currentUserId !== hrId) {
          throw new Error("Only HR can approve assessments");
        }
        assessment.status = "Approved";
      } else {
        assessment.status = "Forwarded";
      }

      assessment.nextApprover = hrId;
      if (currentUserId === hrId) {
        assessment.nextApprover = null;
      }
      
      const reviewed = await assessmentRequestRepo.save(assessment);
      await auditRepo.save({
        assessmentId: reviewed.id,
        auditType: "Review",
        editorId: typeof currentUserId === 'string' ? parseInt(currentUserId) : currentUserId,
        comments: reviewData.comments,
      });
    } catch (error: any) {
      throw new Error(`Failed to review assessment: ${error.message}`);
    }
  },

  getUserLatestApprovedScores: async (userId: string | number): Promise<LatestScore[]> => {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }
      
      const user = await userRepo.findOneBy({ id: typeof userId === 'string' ? parseInt(userId as string) : userId });
      if (!user) {
        throw new Error("User not found");
      }

      const approvedAssessments = await assessmentRequestRepo.find({
        where: {
          userId: userId.toString(),
          status: "Approved",
        },
        order: { requestedAt: "DESC" } as any,
        relations: ["Score", "Score.Skill"],
      });

      if (!approvedAssessments || approvedAssessments.length === 0) {
        return [];
      }

      // Create a map to store the latest score for each skill
      const latestScoresMap = new Map<number, LatestScore>();

      for (const assessment of approvedAssessments) {
        if (assessment.Score && assessment.Score.length > 0) {
          for (const score of assessment.Score) {
            const skillId = score.skillId;

            // If we haven't seen this skill yet, or this assessment is newer
            if (!latestScoresMap.has(skillId)) {
              latestScoresMap.set(skillId, {
                id: score.id,
                self_score: score.selfScore,
                lead_score: score.leadScore,
                updated_at: score.updatedAt,
                skill_name: score.Skill?.name,
                skill_id: skillId,
                requestedAt: assessment.requestedAt,
              });
            }
          }
        }
      }

      // Convert map to array
      const latestScores = Array.from(latestScoresMap.values());

      return latestScores;
    } catch (error: any) {
      throw new Error(
        `Failed to get user's latest approved scores: ${error.message}`
      );
    }
  },
  
  getNextApprover: async (id: string, hrId: string): Promise<string | null> => {
    try {
      const user = await userRepo.findOne({
        where: { id: parseInt(id) },
      });
      
      if (!user) {
        throw new Error("User Not Found");
      }

      let nextApprover = user.leadId?.toString();
      if (!nextApprover) {
        nextApprover = hrId;
      }

      return nextApprover;
    } catch (error: any) {
      throw new Error(`Failed to get next approver: ${error.message}`);
    }
  },

  getAssessmentsForReviewer: async (reviewerId: string): Promise<AssessmentWithScores[]> => {
    try {
      // Get all pending and forwarded assessments
      const allPendingAssessments = await assessmentRequestRepo.find({
        where: { status: In(["Pending", "Forwarded"]) },
        relations: ["user", "user.position", "user.leadId", "user.hrId", "user.Team", "user.role"],
        order: { requestedAt: "ASC" } as any,
      });

      // Filter assessments that should be reviewed by this reviewer
      const assessmentsForReviewer: AssessmentWithScores[] = [];
      for (const assessment of allPendingAssessments) {
        // If this reviewer is the next approver, include the assessment
        if (assessment.nextApprover?.toString() === reviewerId) {
          const scores = await scoreRepo.find({
            where: { assessmentId: assessment.id },
            relations: ["Skill"],
          });

          assessmentsForReviewer.push({
            ...assessment,
            detailedScores: scores,
          });
        }
      }

      return assessmentsForReviewer;
    } catch (error: any) {
      throw new Error(
        `Failed to get assessments for reviewer: ${error.message}`
      );
    }
  },
};

export default AssessmentService;