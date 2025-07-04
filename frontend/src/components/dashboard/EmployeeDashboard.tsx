/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/custom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import DashboardStats from "./DashboardStats";
import { Target, TrendingUp } from "lucide-react";
import { userService, skillService, assessmentService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import {SkillProgressItem} from "../../types/dashboardTypes";

const EmployeeDashboard = ({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    low: 0,
    medium: 0,
    average: 0,
    high: 0,
  });
  const [pendingStatus, setPendingStatus] = useState(0);
  const [skillProgress, setSkillProgress] = useState<SkillProgressItem[]>([]);
  const [suggestedSkills, setSuggestedSkills] = useState<
    { id: string; name: string; category: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Get user profile with skills
      const profileData = await userService.getProfile();
      const skillDetails = await assessmentService.getUserLatestApprovedScores();
      const userSkills = skillDetails.data;
      console.log(userSkills)
      // Calculate skill stats
      const skillStats = {
        low: userSkills.filter((skill: any) => skill.lead_score <= 1).length,
        medium: userSkills.filter(
          (skill: any) => skill.lead_score > 1 && skill.lead_score <= 2
        ).length,
        average: userSkills.filter(
          (skill: any) => skill.lead_score > 2 && skill.lead_score <= 3
        ).length,
        high: userSkills.filter((skill: any) => skill.lead_score > 3).length,
      };
      setStats(skillStats);


      // Get pending assessments
      const assessmentsData =
        await assessmentService.getUserLatestApprovedScores();
      setPendingStatus(0);

      // Get skill progress 
      const skillProgressData = userSkills
        .filter((skill: any) => 4 > skill.lead_score)
        .map((skill: any) => ({
          id: skill.skillId,
          name: skill.skill_name,
          current: skill.lead_score,
          target: 4, //(skill.target_level) Need to change this later
        }))
        .slice(0, 3);

      setSkillProgress(skillProgressData);

      // Get suggested skills based on user position
      if (profileData?.positionId) {
        const positionSkills = await skillService.getSkillsByPosition();

        // Filter out skills the user already has
        const userSkillIds = userSkills.map((skill: any) => skill.skillId);
        const suggestedSkillsData = positionSkills
          .filter((skill: any) => !userSkillIds.includes(skill.id))
          .map((skill: any) => ({
            id: skill.id,
            name: skill.name,
          }))
          .slice(0, 5); // Show top 5 suggestions

        setSuggestedSkills(suggestedSkillsData);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardStats stats={stats} title="My Skills Overview" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Skill Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillProgress.length > 0 ? (
              skillProgress.map((skill, index) => (
                <div key={skill.id || index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{skill.name}</span>
                    <Badge variant="outline">{skill.name.toUpperCase()}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Level {skill.current}</span>
                      <span>Target: {skill.target}</span>
                    </div>
                    <Progress
                      value={(skill.current / skill.target) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No skills in progress. Start by setting target levels for your
                skills.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Pending Requests</h4>
                    <p className="text-sm text-gray-600">
                      {pendingStatus} assessments pending
                    </p>
                  </div>
                  <Badge variant="secondary">{pendingStatus}</Badge>
                </div>
              </div>

              <Button
                onClick={() => onNavigate("employee-assessment-review")}
                className="w-full"
                size="lg"
              >
                View My Assessments
              </Button>

              <Button
                onClick={() => onNavigate("skill-upgrade")}
                variant="outline"
                className="w-full"
              >
                View Upgrade Paths
              </Button>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-3">Suggested Skills to Improve</h4>
              <div className="flex flex-wrap gap-2">
                {suggestedSkills.length > 0 ? (
                  suggestedSkills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-50"
                      onClick={() => onNavigate("skill-upgrade")}
                    >
                      {skill.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    No skill suggestions available for your position.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
