import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Search,
  Edit,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  User,
  Calendar,
  MessageSquare,
  TrendingUp,
  FileText,
} from "lucide-react";
import { assessmentService, skillService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import {
  AssessmentWithHistory,
  TeamMemberAssessment,
  AssessmentStatus,
  LeadSkillAssessment,
  TeamStatistics,
  DetailedScore,
} from "@/types/assessmentTypes";

interface Skill {
  id: number;
  name: string;
}

const TeamAssessmentManagement: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMemberAssessment[]>([]);
  const [assessments, setAssessments] = useState<AssessmentWithHistory[]>([]);
  const [pendingAssessments, setPendingAssessments] = useState<AssessmentWithHistory[]>([]);
  const [statistics, setStatistics] = useState<TeamStatistics | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");

  // Modal states
  const [showWriteAssessmentModal, setShowWriteAssessmentModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentWithHistory | null>(null);
  const [skillScores, setSkillScores] = useState<{ [skillId: number]: number }>({});
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assessment history modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAssessmentHistory, setSelectedAssessmentHistory] = useState<AssessmentWithHistory | null>(null);

  useEffect(() => {
    if (user?.role?.name === "lead") {
      loadTeamData();
    }
  }, [user]);

  const loadTeamData = async () => {
    setIsLoading(true);
    try {
      const [membersRes, assessmentsRes, pendingRes, statsRes, skillsRes] = await Promise.all([
        assessmentService.getTeamMembers(),
        assessmentService.getTeamAssessments(),
        assessmentService.getPendingTeamAssessments(),
        assessmentService.getTeamAssessmentStatistics(),
        skillService.getAllSkills(),
      ]);

      if (membersRes.success) setTeamMembers(membersRes.data);
      if (assessmentsRes.success) setAssessments(assessmentsRes.data);
      if (pendingRes.success) setPendingAssessments(pendingRes.data);
      if (statsRes.success) setStatistics(statsRes.data);
      if (skillsRes.success) setSkills(skillsRes.data);
    } catch (error) {
      console.error("Error loading team data:", error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.INITIATED:
        return "bg-blue-100 text-blue-800";
      case AssessmentStatus.LEAD_WRITING:
        return "bg-yellow-100 text-yellow-800";
      case AssessmentStatus.EMPLOYEE_REVIEW:
        return "bg-purple-100 text-purple-800";
      case AssessmentStatus.EMPLOYEE_APPROVED:
        return "bg-green-100 text-green-800";
      case AssessmentStatus.EMPLOYEE_REJECTED:
        return "bg-red-100 text-red-800";
      case AssessmentStatus.COMPLETED:
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.INITIATED:
        return <Clock className="h-4 w-4" />;
      case AssessmentStatus.LEAD_WRITING:
        return <Edit className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_REVIEW:
        return <Eye className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_APPROVED:
        return <CheckCircle className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_REJECTED:
        return <XCircle className="h-4 w-4" />;
      case AssessmentStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleWriteAssessment = (assessment: AssessmentWithHistory) => {
    setSelectedAssessment(assessment);
    
    // Initialize skill scores for existing scores
    const initialScores: { [skillId: number]: number } = {};
    assessment.detailedScores.forEach((score) => {
      if (score.leadScore !== null) {
        initialScores[score.skillId] = score.leadScore;
      }
    });
    setSkillScores(initialScores);
    setComments("");
    setShowWriteAssessmentModal(true);
  };

  const handleSkillScoreChange = (skillId: number, score: number) => {
    setSkillScores((prev) => ({
      ...prev,
      [skillId]: score,
    }));
  };

  const submitAssessment = async () => {
    if (!selectedAssessment) return;

    setIsSubmitting(true);
    try {
      const skillScoresArray: LeadSkillAssessment[] = Object.entries(skillScores).map(
        ([skillId, score]) => ({
          skillId: parseInt(skillId),
          leadScore: score,
        })
      );

      const response = await assessmentService.writeLeadAssessment(
        selectedAssessment.id,
        skillScoresArray,
        comments
      );

      if (response.success) {
        toast({
          title: "Assessment Submitted",
          description: "Assessment has been submitted for employee review",
        });
        setShowWriteAssessmentModal(false);
        loadTeamData(); // Refresh data
      } else {
        throw new Error(response.error || "Failed to submit assessment");
      }
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast({
        title: "Error",
        description: "Failed to submit assessment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewAssessmentHistory = (assessment: AssessmentWithHistory) => {
    setSelectedAssessmentHistory(assessment);
    setShowHistoryModal(true);
  };

  const filteredMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAssessments = assessments.filter((assessment) =>
    assessment.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Assessment Management</h1>
        <p className="text-gray-600">Manage assessments for your team members</p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Team Members</p>
                <p className="text-2xl font-bold">{statistics.totalTeamMembers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Assessments</p>
                <p className="text-2xl font-bold">{statistics.assessments.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending Actions</p>
                <p className="text-2xl font-bold">{statistics.pendingActions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{statistics.assessments.byStatus.completed}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search team members or assessments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab("overview")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab("pending")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === "pending"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pending Assessments
            </button>
            <button
              onClick={() => setSelectedTab("history")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === "history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Assessment History
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === "overview" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Team Members</h2>
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <p className="text-sm text-gray-500">
                        {member.position.name} • {member.role.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {member.activeAssessments?.length || 0} Active
                    </span>
                    <button
                      onClick={() => {
                        setSearchTerm(member.name);
                        setSelectedTab("history");
                      }}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Assessments
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === "pending" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Assessments Requiring Your Action</h2>
            <div className="space-y-4">
              {pendingAssessments
                .filter((assessment) => assessment.status === AssessmentStatus.LEAD_WRITING)
                .map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(assessment.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                          {assessment.status.replace("_", " ")}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{assessment.user?.name}</h3>
                        <p className="text-sm text-gray-600">
                          {assessment.user?.email} • Cycle {assessment.currentCycle}
                        </p>
                        <p className="text-sm text-gray-500">
                          Scheduled: {new Date(assessment.scheduledDate || "").toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewAssessmentHistory(assessment)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      <button
                        onClick={() => handleWriteAssessment(assessment)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Write Assessment
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === "history" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">All Team Assessments</h2>
            <div className="space-y-4">
              {filteredAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(assessment.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                        {assessment.status.replace("_", " ")}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{assessment.user?.name}</h3>
                      <p className="text-sm text-gray-600">
                        {assessment.user?.email} • Cycle {assessment.currentCycle}
                      </p>
                      <p className="text-sm text-gray-500">
                        Requested: {new Date(assessment.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => viewAssessmentHistory(assessment)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                    {assessment.status === AssessmentStatus.LEAD_WRITING && (
                      <button
                        onClick={() => handleWriteAssessment(assessment)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Write Assessment
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Write Assessment Modal */}
      {showWriteAssessmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                Write Assessment for {selectedAssessment?.user?.name}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Assessment Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Employee:</span> {selectedAssessment?.user?.name}
                  </div>
                  <div>
                    <span className="font-medium">Cycle:</span> {selectedAssessment?.currentCycle}
                  </div>
                  <div>
                    <span className="font-medium">Scheduled:</span>{" "}
                    {selectedAssessment?.scheduledDate
                      ? new Date(selectedAssessment.scheduledDate).toLocaleDateString()
                      : "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedAssessment?.status || AssessmentStatus.INITIATED)}`}>
                      {selectedAssessment?.status?.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Skills Assessment</h3>
                <div className="space-y-4">
                  {selectedAssessment?.detailedScores.map((score) => (
                    <div
                      key={score.skillId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{score.Skill.name}</h4>
                        <p className="text-sm text-gray-600">Skill ID: {score.skillId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Score (1-4):</span>
                        <select
                          value={skillScores[score.skillId] || ""}
                          onChange={(e) =>
                            handleSkillScoreChange(score.skillId, parseInt(e.target.value))
                          }
                          className="border border-gray-300 rounded px-2 py-1 w-20"
                        >
                          <option value="">0</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="comments" className="block text-sm font-medium mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  id="comments"
                  placeholder="Add any comments about this assessment..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowWriteAssessmentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitAssessment}
                disabled={isSubmitting || Object.keys(skillScores).length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Assessment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assessment History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                Assessment History - {selectedAssessmentHistory?.user?.name}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Assessment Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Assessment Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedAssessmentHistory?.status || AssessmentStatus.INITIATED)}`}>
                      {selectedAssessmentHistory?.status?.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Cycle:</span> {selectedAssessmentHistory?.currentCycle}
                  </div>
                  <div>
                    <span className="font-medium">Requested:</span>{" "}
                    {selectedAssessmentHistory?.requestedAt
                      ? new Date(selectedAssessmentHistory.requestedAt).toLocaleDateString()
                      : "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Completed:</span>{" "}
                    {selectedAssessmentHistory?.completedAt
                      ? new Date(selectedAssessmentHistory.completedAt).toLocaleDateString()
                      : "In Progress"}
                  </div>
                </div>
              </div>

              {/* Current Scores */}
              <div>
                <h3 className="font-semibold mb-4">Current Scores</h3>
                <div className="space-y-2">
                  {selectedAssessmentHistory?.detailedScores.map((score) => (
                    <div
                      key={score.skillId}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <span className="font-medium">{score.Skill.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Lead Score:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${score.leadScore ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
                          {score.leadScore || "Not Scored"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* History Timeline */}
              <div>
                <h3 className="font-semibold mb-4">History Timeline</h3>
                <div className="space-y-4">
                  {selectedAssessmentHistory?.history
                    .sort((a, b) => new Date(b.auditedAt).getTime() - new Date(a.auditedAt).getTime())
                    .map((entry) => (
                      <div key={entry.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <Calendar className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{entry.auditType.replace("_", " ")}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(entry.auditedAt).toLocaleString()}
                            </span>
                          </div>
                          {entry.comments && (
                            <p className="text-sm text-gray-600">{entry.comments}</p>
                          )}
                          <p className="text-xs text-gray-500">Cycle {entry.cycleNumber}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamAssessmentManagement;
