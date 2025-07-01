import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/custom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import DashboardStats from "./DashboardStats";
import { Users, FileText, BarChart3 } from "lucide-react";

const TeamLeadDashboard = ({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    low: 0,
    medium: 0,
    average: 0,
    high: 0,
  });
  const [pendingRequests, setPendingRequests] = useState(0);
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    avgSkillLevel: 0,
    skillGaps: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simulated data - replace with actual API calls
      setStats({ low: 15, medium: 25, average: 18, high: 12 });
      setPendingRequests(8);
      setTeamStats({
        totalMembers: 12,
        avgSkillLevel: 2.8,
        skillGaps: 5,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  return (
    <div className="space-y-8">
      <DashboardStats
        stats={stats}
        pendingRequests={pendingRequests}
        title="Team Skills Overview"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">
                  {teamStats.totalMembers}
                </div>
                <p className="text-sm text-gray-600">Team Members</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {teamStats.avgSkillLevel}
                </div>
                <p className="text-sm text-gray-600">Average Skill Level</p>
              </div>
              <Button
                onClick={() => onNavigate("team-overview")}
                className="w-full"
                variant="outline"
              >
                View Team Details
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {pendingRequests}
                </div>
                <p className="text-sm text-gray-600">Skill Updates to Review</p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="w-full justify-center">
                  High Priority: 3
                </Badge>
                <Badge variant="outline" className="w-full justify-center">
                  Regular: 5
                </Badge>
              </div>
              <Button className="w-full">Review Requests</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Skill Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {teamStats.skillGaps}
                </div>
                <p className="text-sm text-gray-600">Skill Gaps Identified</p>
              </div>
              <div className="text-sm text-gray-600">
                Most needed skills:
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="destructive" className="text-xs">
                    React
                  </Badge>
                  <Badge variant="destructive" className="text-xs">
                    Leadership
                  </Badge>
                </div>
              </div>
              <Button
                onClick={() => onNavigate("skill-matrix")}
                className="w-full"
                variant="outline"
              >
                View Matrix
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamLeadDashboard;
