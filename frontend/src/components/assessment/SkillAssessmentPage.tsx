import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/custom/index";
import { useAuth } from "@/hooks/useAuth";
import { Grid3X3, Save, RefreshCw } from "lucide-react";
import { assessmentService, skillService } from "@/services/api";
import { toast } from "sonner";
import AssessmentForm from "./AssessmentForm";

interface SkillCategory {
  id: string;
  name: string;
  skills: string[];
}

interface SkillAssessment {
  [skillId: number]: number | null;
}

const SkillAssessmentPage = () => {
  const { user } = useAuth();
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [existingAssessment, setExistingAssessment] = useState<SkillAssessment>(
    {}
  );
  const [assessments, setAssessments] = useState<SkillAssessment>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const proficiencyLevels = [
    {
      value: 1,
      label: "Low",
      color: "bg-red-100 hover:bg-red-200 border-red-300",
    },
    {
      value: 2,
      label: "Medium",
      color: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300",
    },
    {
      value: 3,
      label: "Average",
      color: "bg-blue-100 hover:bg-blue-200 border-blue-300",
    },
    {
      value: 4,
      label: "High",
      color: "bg-green-100 hover:bg-green-200 border-green-300",
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const skillData = await skillService.getSkillsByPosition();
      setSkillCategories(skillData);

      const existingAssessments =
        await assessmentService.getUserLatestApprovedScores();
      if (existingAssessments.data.length === 0) {
        toast.warning(
          "No previous assessments found. Please complete the assessment."
        );
      }
      const existingAssessmentObj: SkillAssessment = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      existingAssessments.data.forEach((assessment: any) => {
        console.log(assessment);
        existingAssessmentObj[assessment.skill_id] = assessment.lead_score || 0;
      });
      setAssessments(existingAssessmentObj);
      setExistingAssessment(existingAssessmentObj);
    } catch (error) {
      toast.error("Failed to load skill categories or assessments");
      console.error("Error fetching skill categories or assessments:", error);
    }
  };
  const handleSkillLevelChange = (skillId: number, level: number) => {
    setAssessments((prev) => ({
      ...prev,
      [skillId]: prev[skillId] === level ? 0 : level,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Convert assessments object to array of { skillId, score }
    const skillAssessments = Object.entries(assessments)
      .filter(([_, score]) => score > 0)
      .map(([skillId, score]) => ({
        skillId: Number(skillId),
        score,
      }));

    const data = {
      userId: user?.id,
      skillAssessments,
    };

    try {
      await assessmentService.createAssessment(data);
      toast.success("Skill assessment saved successfully");
      setIsSubmitting(false);
    } catch (error) {
      setIsSubmitting(false);
      toast.error("Failed to save skill assessment");
      console.error("Error saving skill assessment:", error);
      return;
    }
  };

  const handleReset = () => {
    setAssessments(existingAssessment);
  };

  const getCompletionStats = () => {
    const totalSkills = skillCategories.length;
    const assessedSkills = Object.keys(assessments).filter(
      (skill) => assessments[skill] > 0
    ).length;
    return { total: totalSkills, assessed: assessedSkills };
  };

  const stats = getCompletionStats();

  console.log(assessments);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Skill Assessment</h1>
          <p className="text-gray-600 mt-2">
            Rate your proficiency level for each skill (1-4 scale)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            onClick={handleReset}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </button>
          <button
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save Assessment"}
          </button>
        </div>
      </div>
      {/* Completion Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Skills</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Assessed</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.assessed}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.total > 0
                  ? Math.round((stats.assessed / stats.total) * 100)
                  : 0}
                %
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AssessmentForm skillCategories={skillCategories} assessments={assessments} isSubmitting={isSubmitting} handleSkillLevelChange={handleSkillLevelChange}/>

      <div className="text-center">
        <button
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <Save className="h-5 w-5 mr-2" />
          {isSubmitting ? "Saving Assessment..." : "Save Complete Assessment"}
        </button>
      </div>
    </div>
  );
};

const Legend = () => {
  return (
    <div className="flex flex-wrap gap-4 p-4 rounded-sm bg-gray-100 mt-4">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <div className="h-4 w-4 rounded-[50%] border bg-gray-200"></div>
        <span>- Not Rated</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <div className="h-4 w-4 rounded-[50%] border bg-red-200"></div>
        <span> ★ Low </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <div className="h-4 w-4 rounded-[50%] border bg-orange-200"></div>
        <span> ★★ Medium </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <div className="h-4 w-4 rounded-[50%] border bg-yellow-200"></div>
        <span> ★★★ Average </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <div className="h-4 w-4 rounded-[50%] border bg-green-200"></div>
        <span> ★★★★ High</span>
      </div>
    </div>
  );
};

export default SkillAssessmentPage;
