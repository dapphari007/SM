import { In } from "typeorm";
import { AppDataSource, assessmentRequestRepo, scoreRepo, userRepo, skillRepo, AuditRepo } from "../config/dataSource";
import { 
  AssessmentData, 
  SkillAssessmentData, 
  ReviewData, 
  ScoreData ,
  LatestScore
} from "../types/services";
import { AssessmentRequestType, ScoreType, UserType, SkillType, AuditType } from "../types/entities";
import { AssessmentStatus } from "../enum/enum";

interface AssessmentWithScores extends Omit<AssessmentRequestType, 'Score'> {
  detailedScores: ScoreType[];
  Score?: ScoreType[];
}



const AssessmentService = {
  createAssessment: async (
    userId: string,
    comments: string = "",
    skillAssessments: SkillAssessmentData[] = []
  ): Promise<AssessmentWithScores> => {
    try {
      // Validate user exists
      const user = await userRepo.findOneBy({ id: userId });
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
          status: In([AssessmentStatus.Pending]),
        },
      });

      const status = (user.hrId || user.leadId) ? AssessmentStatus.Pending : AssessmentStatus.Approved;

      let savedAssessment;
      if (existingAssessment) {
        throw new Error("User already has a pending assessment");
      } else {
        // Create assessment request
        const assessment = assessmentRequestRepo.create({
          userId: userId,
          status: status,
          nextApprover: user.leadId ? parseInt(user.leadId) : (user.hrId ? parseInt(user.hrId) : undefined),
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
        await AuditRepo.save({
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
  ): Promise<ScoreType[]> => {
    try {
      const assessment = await assessmentRequestRepo.findOneBy({
        id: assessmentId,
      });
      
      if (!assessment) {
        throw new Error("Assessment not found");
      }

      const user = await userRepo.findOneBy({ id: userId });

      const scores: ScoreType[] = [];

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

        const savedScore = await scoreRepo.save(score);
        scores.push(savedScore);
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

  getUserAssessments: async (userId: string ): Promise<AssessmentWithScores[]> => {
    try {
      const user = await userRepo.findOneBy({ id: userId });
      if (!user) {
        throw new Error("User not found");
      }

      const assessments = await assessmentRequestRepo.find({
        where: { userId: userId.toString() },
        relations: ["Score"],
        order: { requestedAt: "DESC" },
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

  getAllAssessments: async (): Promise<AssessmentRequestType[]> => {
    try {
      return await assessmentRequestRepo.find({
        relations: ["user", "Score"],
        order: { requestedAt: "DESC" },
      });
    } catch (error: any) {
      throw new Error(`Failed to retrieve all assessments: ${error.message}`);
    }
  },
  
  cancelAssessment: async (assessmentId: number): Promise<AssessmentRequestType> => {
    try {
      const assessment = await assessmentRequestRepo.findOneBy({
        id: assessmentId,
      });
      
      if (!assessment) {
        throw new Error("Assessment not found");
      }

      if (
        assessment.status === AssessmentStatus.Approved ||
        assessment.status === AssessmentStatus.Forwarded
      ) {
        throw new Error("Cannot cancel an approved or forwarded assessment");
      }

      assessment.status = AssessmentStatus.Cancelled;
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
        assessment.status !== AssessmentStatus.Pending &&
        assessment.status !== AssessmentStatus.Forwarded
      ) {
        throw new Error("Assessment is not in a reviewable state");
      }

      const hrId = assessment.user?.hrId;

      if (currentUserId !== assessment.nextApprover?.toString()) {
        throw new Error("You are not authorized to review this assessment");
      }

      // Update lead scores if provided
      if (reviewData.scoreUpdates && Array.isArray(reviewData.scoreUpdates)) {
        for (const scoreUpdate of reviewData.scoreUpdates) {
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
        if (currentUserId === hrId?.toString()) {
          throw new Error("HR can only approve assessments, not forward them");
        }
        assessment.status = AssessmentStatus.Forwarded;
      } else if (reviewData.status === "Approved") {
        if (currentUserId !== hrId?.toString()) {
          throw new Error("Only HR can approve assessments");
        }
        assessment.status = AssessmentStatus.Approved;
      } else {
        assessment.status = AssessmentStatus.Forwarded;
      }

      assessment.nextApprover = hrId ? parseInt(hrId.toString()) : undefined;
      if (currentUserId === hrId?.toString()) {
        assessment.nextApprover = undefined;
      }
      
      const reviewed = await assessmentRequestRepo.save(assessment);
      await AuditRepo.save({
        assessmentId: reviewed.id,
        auditType: "Review",
        editorId: typeof currentUserId === 'string' ? parseInt(currentUserId) : currentUserId,
        comments: reviewData.comments,
      });
    } catch (error: any) {
      throw new Error(`Failed to review assessment: ${error.message}`);
    }
  },

  getUserLatestApprovedScores: async (userId: string ): Promise<LatestScore[]> => {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }
      
      const user = await userRepo.findOneBy({ id: userId });
      if (!user) {
        throw new Error("User not found");
      }

      const approvedAssessments = await assessmentRequestRepo.find({
        where: {
          userId: userId.toString(),
          status: AssessmentStatus.Approved,
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
        where: { id },
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
        where: { status: In([AssessmentStatus.Pending, AssessmentStatus.Forwarded]) },
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