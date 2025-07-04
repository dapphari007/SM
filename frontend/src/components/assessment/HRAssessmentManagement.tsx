import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  BarChart3,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  UserPlus,
} from "lucide-react";
import { assessmentService, skillService, userService, teamService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import {
  AssessmentWithHistory,
  AssessmentStatus,
  AssessmentCycle,
  TeamStatistics,
  DetailedScore,
} from "@/types/assessmentTypes";

interface User {
  id: string;
  name: string;
  email: string;
  role: { name: string };
  team: { name: string };
}

interface Team {
  id: number;
  name: string;
}

interface Skill {
  id: number;
  name: string;
}

const HRAssessmentManagement: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentWithHistory[]>([]);
  const [cycles, setCycles] = useState<AssessmentCycle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentWithHistory | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [comments, setComments] = useState("");

  // Bulk assessment states
  const [bulkTitle, setBulkTitle] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [excludedUsers, setExcludedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (user?.role?.name === "hr") {
      loadHRData();
    }
  }, [user]);

  const loadHRData = async () => {
    setIsLoading(true);
    try {
      const [assessmentsRes, cyclesRes, usersRes, teamsRes, skillsRes] = await Promise.all([
        assessmentService.getAssessmentsForRole(),
        assessmentService.getAssessmentCycles(),
        userService.getAllUsers(),
        teamService.getAllTeams(),
        skillService.getAllSkills(),
      ]);

      if (assessmentsRes?.success !== false) setAssessments(Array.isArray(assessmentsRes) ? assessmentsRes : assessmentsRes?.data || []);
      if (cyclesRes?.success !== false) setCycles(Array.isArray(cyclesRes) ? cyclesRes : cyclesRes?.data || []);
      if (usersRes?.success !== false) {
        // Filter out HR users
        const usersData = Array.isArray(usersRes) ? usersRes : usersRes?.data || [];
        const nonHRUsers = usersData.filter((u: User) => u.role?.name !== "hr");
        setUsers(nonHRUsers);
      }
      if (teamsRes?.success !== false) setTeams(Array.isArray(teamsRes) ? teamsRes : teamsRes?.data || []);
      if (skillsRes?.success !== false) setSkills(Array.isArray(skillsRes) ? skillsRes : skillsRes?.data || []);
    } catch (error) {
      console.error("Error loading HR data:", error);
      toast({
        title: "Error",
        description: "Failed to load assessment data",
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
      case AssessmentStatus.HR_FINAL_REVIEW:
        return "bg-indigo-100 text-indigo-800";
      case AssessmentStatus.COMPLETED:
        return "bg-gray-100 text-gray-800";
      case AssessmentStatus.CANCELLED:
        return "bg-gray-100 text-gray-500";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleInitiateAssessment = async () => {
    if (!selectedUser || selectedSkills.length === 0) {
      toast({
        title: "Error",
        description: "Please select a user and at least one skill",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await assessmentService.initiateAssessment({
        targetUserId: selectedUser,
        skillIds: selectedSkills,
        scheduledDate: scheduledDate || undefined,
        comments,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Assessment initiated successfully",
        });
        setShowInitiateModal(false);
        resetForm();
        loadHRData();
      }
    } catch (error) {
      console.error("Error initiating assessment:", error);
      toast({
        title: "Error",
        description: "Failed to initiate assessment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkInitiate = async () => {
    if (selectedSkills.length === 0 || !bulkTitle.trim()) {
      toast({
        title: "Error",
        description: "Please provide a title and select at least one skill",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await assessmentService.initiateBulkAssessment({
        skillIds: selectedSkills,
        assessmentTitle: bulkTitle,
        includeTeams: selectedTeams.length > 0 ? selectedTeams : ["all"],
        scheduledDate: scheduledDate || undefined,
        comments,
        excludeUsers: excludedUsers,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Bulk assessment initiated for ${response.data.totalAssessments} users`,
        });
        setShowBulkModal(false);
        resetBulkForm();
        loadHRData();
      }
    } catch (error) {
      console.error("Error initiating bulk assessment:", error);
      toast({
        title: "Error",
        description: "Failed to initiate bulk assessment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHRReview = async (approved: boolean) => {
    if (!selectedAssessment) return;

    setIsSubmitting(true);
    try {
      const response = await assessmentService.hrFinalReview(
        selectedAssessment.id,
        { approved, comments: reviewComments }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `Assessment ${approved ? "approved" : "rejected"} successfully`,
        });
        setShowReviewModal(false);
        loadHRData();
      }
    } catch (error) {
      console.error("Error submitting HR review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedUser("");
    setSelectedSkills([]);
    setScheduledDate("");
    setComments("");
  };

  const resetBulkForm = () => {
    setBulkTitle("");
    setSelectedTeams([]);
    setSelectedSkills([]);
    setExcludedUsers([]);
    setScheduledDate("");
    setComments("");
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch = assessment.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || assessment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingHRReviews = assessments.filter(a => a.status === AssessmentStatus.EMPLOYEE_APPROVED);

  const statistics = {
    total: assessments.length,
    pending: assessments.filter(a => a.status !== AssessmentStatus.COMPLETED && a.status !== AssessmentStatus.CANCELLED).length,
    completed: assessments.filter(a => a.status === AssessmentStatus.COMPLETED).length,
    hrReviews: pendingHRReviews.length,
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "assessments", label: "All Assessments", icon: FileText },
    { id: "cycles", label: "Assessment Cycles", icon: Calendar },
    { id: "pending-reviews", label: "HR Reviews", icon: AlertCircle, count: pendingHRReviews.length },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assessment Management</h1>
          <p className="text-gray-600">Manage skill assessments across the organization</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowInitiateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Initiate Assessment
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Bulk Assessment
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Assessments</p>
              <p className="text-2xl font-bold">{statistics.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{statistics.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Pending HR Review</p>
              <p className="text-2xl font-bold text-red-600">{statistics.hrReviews}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    selectedTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count && tab.count > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Content will be added here */}
          {selectedTab === "overview" && (
            <OverviewTab assessments={assessments} cycles={cycles} statistics={statistics} />
          )}
          
          {selectedTab === "assessments" && (
            <AssessmentsTab
              assessments={filteredAssessments}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              getStatusColor={getStatusColor}
              formatDate={formatDate}
            />
          )}

          {selectedTab === "cycles" && (
            <CyclesTab cycles={cycles} formatDate={formatDate} />
          )}

          {selectedTab === "pending-reviews" && (
            <PendingReviewsTab
              pendingReviews={pendingHRReviews}
              onReview={(assessment) => {
                setSelectedAssessment(assessment);
                setReviewComments("");
                setShowReviewModal(true);
              }}
              getStatusColor={getStatusColor}
              formatDate={formatDate}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showInitiateModal && (
        <InitiateAssessmentModal
          users={users}
          skills={skills}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          selectedSkills={selectedSkills}
          setSelectedSkills={setSelectedSkills}
          scheduledDate={scheduledDate}
          setScheduledDate={setScheduledDate}
          comments={comments}
          setComments={setComments}
          isSubmitting={isSubmitting}
          onSubmit={handleInitiateAssessment}
          onClose={() => setShowInitiateModal(false)}
        />
      )}

      {showBulkModal && (
        <BulkAssessmentModal
          teams={teams}
          users={users}
          skills={skills}
          bulkTitle={bulkTitle}
          setBulkTitle={setBulkTitle}
          selectedTeams={selectedTeams}
          setSelectedTeams={setSelectedTeams}
          selectedSkills={selectedSkills}
          setSelectedSkills={setSelectedSkills}
          excludedUsers={excludedUsers}
          setExcludedUsers={setExcludedUsers}
          scheduledDate={scheduledDate}
          setScheduledDate={setScheduledDate}
          comments={comments}
          setComments={setComments}
          isSubmitting={isSubmitting}
          onSubmit={handleBulkInitiate}
          onClose={() => setShowBulkModal(false)}
        />
      )}

      {showReviewModal && selectedAssessment && (
        <HRReviewModal
          assessment={selectedAssessment}
          comments={reviewComments}
          setComments={setReviewComments}
          isSubmitting={isSubmitting}
          onSubmit={handleHRReview}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  );
};

// Tab Components
const OverviewTab: React.FC<{
  assessments: AssessmentWithHistory[];
  cycles: AssessmentCycle[];
  statistics: any;
}> = ({ assessments, cycles, statistics }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Recent Assessment Activity</h3>
          <div className="space-y-3">
            {assessments.slice(0, 5).map((assessment) => (
              <div key={assessment.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{assessment.user?.name}</p>
                  <p className="text-sm text-gray-500">Assessment #{assessment.id}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {assessment.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Cycles */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Active Assessment Cycles</h3>
          <div className="space-y-3">
            {cycles.filter(c => c.status === "ACTIVE").slice(0, 5).map((cycle) => (
              <div key={cycle.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{cycle.title}</p>
                  <p className="text-sm text-gray-500">{cycle.totalAssessments} assessments</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {cycle.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AssessmentsTab: React.FC<{
  assessments: AssessmentWithHistory[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  getStatusColor: (status: AssessmentStatus) => string;
  formatDate: (date: string | Date) => string;
}> = ({ assessments, searchTerm, setSearchTerm, statusFilter, setStatusFilter, getStatusColor, formatDate }) => {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="INITIATED">Initiated</option>
          <option value="LEAD_WRITING">Lead Writing</option>
          <option value="EMPLOYEE_REVIEW">Employee Review</option>
          <option value="EMPLOYEE_APPROVED">Employee Approved</option>
          <option value="HR_FINAL_REVIEW">HR Review</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Assessments List */}
      <div className="space-y-4">
        {assessments.map((assessment) => (
          <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">{assessment.user?.name}</h4>
                  <p className="text-sm text-gray-500">Assessment #{assessment.id}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                {assessment.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2">{formatDate(assessment.requestedAt)}</span>
              </div>
              <div>
                <span className="text-gray-500">Cycle:</span>
                <span className="ml-2">{assessment.currentCycle}</span>
              </div>
              <div>
                <span className="text-gray-500">Skills:</span>
                <span className="ml-2">{assessment.detailedScores?.length || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Progress:</span>
                <span className="ml-2">{Math.round((assessment.currentCycle / 5) * 100)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CyclesTab: React.FC<{
  cycles: AssessmentCycle[];
  formatDate: (date: string | Date) => string;
}> = ({ cycles, formatDate }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Assessment Cycles</h3>
      <div className="grid grid-cols-1 gap-4">
        {cycles.map((cycle) => (
          <div key={cycle.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">{cycle.title}</h4>
              <span className={`px-2 py-1 rounded text-xs ${
                cycle.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                cycle.status === "COMPLETED" ? "bg-gray-100 text-gray-800" :
                "bg-red-100 text-red-800"
              }`}>
                {cycle.status}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Assessments:</span>
                <span className="ml-2 font-medium">{cycle.totalAssessments}</span>
              </div>
              <div>
                <span className="text-gray-500">Completed:</span>
                <span className="ml-2 font-medium">{cycle.completedAssessments}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2">{formatDate(cycle.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-500">Progress:</span>
                <span className="ml-2">{Math.round((cycle.completedAssessments / cycle.totalAssessments) * 100)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PendingReviewsTab: React.FC<{
  pendingReviews: AssessmentWithHistory[];
  onReview: (assessment: AssessmentWithHistory) => void;
  getStatusColor: (status: AssessmentStatus) => string;
  formatDate: (date: string | Date) => string;
}> = ({ pendingReviews, onReview, getStatusColor, formatDate }) => {
  if (pendingReviews.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <p className="text-lg text-gray-600">No pending HR reviews</p>
        <p className="text-sm text-gray-500">All assessments are up to date</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pending HR Reviews</h3>
      <div className="space-y-4">
        {pendingReviews.map((assessment) => (
          <div key={assessment.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-medium">{assessment.user?.name}</h4>
                  <p className="text-sm text-gray-500">Assessment #{assessment.id}</p>
                </div>
              </div>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                EMPLOYEE APPROVED
              </span>
            </div>

            <div className="mb-4 p-3 bg-white rounded-md border">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Employee has approved the assessment</strong>
              </p>
              <p className="text-sm text-gray-600">
                Skills assessed: {assessment.detailedScores?.length || 0}
              </p>
              <p className="text-sm text-gray-600">
                Cycle: {assessment.currentCycle}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => onReview(assessment)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                Review Assessment
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Modal Components
const InitiateAssessmentModal: React.FC<{
  users: User[];
  skills: Skill[];
  selectedUser: string;
  setSelectedUser: (user: string) => void;
  selectedSkills: number[];
  setSelectedSkills: (skills: number[]) => void;
  scheduledDate: string;
  setScheduledDate: (date: string) => void;
  comments: string;
  setComments: (comments: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
}> = ({ users, skills, selectedUser, setSelectedUser, selectedSkills, setSelectedSkills, scheduledDate, setScheduledDate, comments, setComments, isSubmitting, onSubmit, onClose }) => {
  const handleSkillToggle = (skillId: number) => {
    setSelectedSkills(
      selectedSkills.includes(skillId)
        ? selectedSkills.filter(id => id !== skillId)
        : [...selectedSkills, skillId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Initiate Individual Assessment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Employee/Team Lead
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.role.name} ({user.team.name})
                </option>
              ))}
            </select>
          </div>

          {/* Skills Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Skills to Assess
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
              <div className="space-y-2">
                {skills.map((skill) => (
                  <label key={skill.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(skill.id)}
                      onChange={() => handleSkillToggle(skill.id)}
                      className="mr-2"
                    />
                    {skill.name}
                  </label>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Selected: {selectedSkills.length} skills
            </p>
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments (Optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any comments about this assessment..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting || !selectedUser || selectedSkills.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {isSubmitting ? "Initiating..." : "Initiate Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
};

const BulkAssessmentModal: React.FC<{
  teams: Team[];
  users: User[];
  skills: Skill[];
  bulkTitle: string;
  setBulkTitle: (title: string) => void;
  selectedTeams: string[];
  setSelectedTeams: (teams: string[]) => void;
  selectedSkills: number[];
  setSelectedSkills: (skills: number[]) => void;
  excludedUsers: string[];
  setExcludedUsers: (users: string[]) => void;
  scheduledDate: string;
  setScheduledDate: (date: string) => void;
  comments: string;
  setComments: (comments: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
}> = ({ teams, users, skills, bulkTitle, setBulkTitle, selectedTeams, setSelectedTeams, selectedSkills, setSelectedSkills, excludedUsers, setExcludedUsers, scheduledDate, setScheduledDate, comments, setComments, isSubmitting, onSubmit, onClose }) => {
  const handleTeamToggle = (teamId: string) => {
    setSelectedTeams(
      selectedTeams.includes(teamId)
        ? selectedTeams.filter(id => id !== teamId)
        : [...selectedTeams, teamId]
    );
  };

  const handleSkillToggle = (skillId: number) => {
    setSelectedSkills(
      selectedSkills.includes(skillId)
        ? selectedSkills.filter(id => id !== skillId)
        : [...selectedSkills, skillId]
    );
  };

  const handleUserToggle = (userId: string) => {
    setExcludedUsers(
      excludedUsers.includes(userId)
        ? excludedUsers.filter(id => id !== userId)
        : [...excludedUsers, userId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Initiate Bulk Assessment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Assessment Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment Title *
            </label>
            <input
              type="text"
              value={bulkTitle}
              onChange={(e) => setBulkTitle(e.target.value)}
              placeholder="e.g., Q1 2024 Skills Assessment"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Teams (leave empty for all teams)
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                <div className="space-y-2">
                  {teams.map((team) => (
                    <label key={team.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTeams.includes(team.id.toString())}
                        onChange={() => handleTeamToggle(team.id.toString())}
                        className="mr-2"
                      />
                      {team.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills to Assess *
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                <div className="space-y-2">
                  {skills.map((skill) => (
                    <label key={skill.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill.id)}
                        onChange={() => handleSkillToggle(skill.id)}
                        className="mr-2"
                      />
                      {skill.name}
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Selected: {selectedSkills.length} skills
              </p>
            </div>
          </div>

          {/* Exclude Users */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exclude Users (Optional)
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
              <div className="grid grid-cols-2 gap-2">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={excludedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="mr-2"
                    />
                    {user.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments (Optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any comments about this bulk assessment..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting || !bulkTitle.trim() || selectedSkills.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {isSubmitting ? "Initiating..." : "Initiate Bulk Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
};

const HRReviewModal: React.FC<{
  assessment: AssessmentWithHistory;
  comments: string;
  setComments: (comments: string) => void;
  isSubmitting: boolean;
  onSubmit: (approved: boolean) => void;
  onClose: () => void;
}> = ({ assessment, comments, setComments, isSubmitting, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">HR Final Review</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {assessment.user?.name} - Assessment #{assessment.id}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Assessment Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Assessment Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Employee:</span>
                <span className="ml-2 font-medium">{assessment.user?.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 font-medium">Employee Approved</span>
              </div>
              <div>
                <span className="text-gray-500">Cycle:</span>
                <span className="ml-2">{assessment.currentCycle}</span>
              </div>
              <div>
                <span className="text-gray-500">Skills:</span>
                <span className="ml-2">{assessment.detailedScores?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Skill Scores */}
          <div>
            <h3 className="font-medium mb-3">Lead Assessment Results</h3>
            <div className="space-y-3">
              {assessment.detailedScores?.map((score: DetailedScore) => (
                <div key={score.skillId} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{score.Skill?.name}</span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {score.leadScore}/4
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HR Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HR Comments (Optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any comments about this final review..."
            />
          </div>

          {/* Decision Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Final Review Decision</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Approve:</strong> Assessment is complete and scores are finalized</li>
              <li>• <strong>Reject:</strong> Send back to lead for revision (increases cycle count)</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(false)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Reject & Send Back
          </button>
          <button
            onClick={() => onSubmit(true)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <CheckCircle className="h-4 w-4" />
            Approve & Complete
          </button>
        </div>
      </div>
    </div>
  );
};

export default HRAssessmentManagement;
