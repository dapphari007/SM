import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
  FileText,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Edit3,
} from "lucide-react";
import { assessmentService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import {
  AssessmentWithHistory,
  AssessmentStatus,
  DetailedScore,
  AuditEntry,
} from "@/types/assessmentTypes";

const EmployeeAssessmentReview: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentWithHistory[]>([]);
  const [pendingReviews, setPendingReviews] = useState<AssessmentWithHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentWithHistory | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewComments, setReviewComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    if (user?.role?.name === "employee") {
      loadEmployeeAssessments();
    }
  }, [user]);

  const loadEmployeeAssessments = async () => {
    setIsLoading(true);
    try {
      const [allAssessments, requiresAction] = await Promise.all([
        assessmentService.getAssessmentsForRole(),
        assessmentService.getAssessmentsRequiringAction(),
      ]);

      if (allAssessments.success) setAssessments(allAssessments.data);
      if (requiresAction.success) setPendingReviews(requiresAction.data);
    } catch (error) {
      console.error("Error loading assessments:", error);
      toast({
        title: "Error",
        description: "Failed to load assessments",
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

  const getStatusIcon = (status: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.INITIATED:
        return <Clock className="h-4 w-4" />;
      case AssessmentStatus.LEAD_WRITING:
        return <Edit3 className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_REVIEW:
        return <Eye className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_APPROVED:
        return <ThumbsUp className="h-4 w-4" />;
      case AssessmentStatus.EMPLOYEE_REJECTED:
        return <ThumbsDown className="h-4 w-4" />;
      case AssessmentStatus.HR_FINAL_REVIEW:
        return <AlertCircle className="h-4 w-4" />;
      case AssessmentStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      case AssessmentStatus.CANCELLED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleReviewAssessment = (assessment: AssessmentWithHistory) => {
    setSelectedAssessment(assessment);
    setReviewComments("");
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (approved: boolean) => {
    if (!selectedAssessment) return;

    setIsSubmitting(true);
    try {
      const response = await assessmentService.employeeReviewAssessment(
        selectedAssessment.id,
        { approved, comments: reviewComments }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `Assessment ${approved ? "approved" : "rejected"} successfully`,
        });
        setShowReviewModal(false);
        loadEmployeeAssessments();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewHistory = (assessment: AssessmentWithHistory) => {
    setSelectedAssessment(assessment);
    setShowHistoryModal(true);
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
          <h1 className="text-3xl font-bold">My Assessments</h1>
          <p className="text-gray-600">Review and manage your skill assessments</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Assessments</p>
              <p className="text-2xl font-bold">{assessments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <Eye className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-purple-600">{pendingReviews.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {assessments.filter(a => a.status === AssessmentStatus.COMPLETED).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {assessments.filter(a => a.status !== AssessmentStatus.COMPLETED && a.status !== AssessmentStatus.CANCELLED).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Reviews Section */}
      {pendingReviews.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Action Required
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              The following assessments require your review
            </p>
          </div>

          <div className="p-6 space-y-4">
            {pendingReviews.map((assessment) => (
              <div key={assessment.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Assessment #{assessment.id}</h4>
                      <p className="text-sm text-gray-500">Cycle {assessment.currentCycle}</p>
                    </div>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                    REVIEW REQUIRED
                  </span>
                </div>

                <div className="mb-4 p-3 bg-white rounded-md border">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Assessment completed by your lead</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Skills assessed: {assessment.detailedScores?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">
                    Submitted: {formatDate(assessment.requestedAt)}
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleViewHistory(assessment)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => handleReviewAssessment(assessment)}
                    className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Review Assessment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Assessments */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All My Assessments
          </h2>
        </div>

        <div className="p-6">
          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600">No assessments found</p>
              <p className="text-sm text-gray-500">Your assessments will appear here once they are initiated</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Assessment #{assessment.id}</h4>
                        <p className="text-sm text-gray-500">Cycle {assessment.currentCycle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                        {getStatusIcon(assessment.status)}
                        <span className="ml-1">{assessment.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Created: {formatDate(assessment.requestedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>Scheduled: {formatDate(assessment.scheduledDate || assessment.requestedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span>Skills: {assessment.detailedScores?.length || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {assessment.status === AssessmentStatus.EMPLOYEE_REVIEW ? (
                        <span className="text-purple-600 font-medium">⚠️ Review Required</span>
                      ) : (
                        <span>Status: {assessment.status.replace('_', ' ')}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewHistory(assessment)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </button>
                      {assessment.status === AssessmentStatus.EMPLOYEE_REVIEW && (
                        <button
                          onClick={() => handleReviewAssessment(assessment)}
                          className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedAssessment && (
        <ReviewAssessmentModal
          assessment={selectedAssessment}
          comments={reviewComments}
          setComments={setReviewComments}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmitReview}
          onClose={() => setShowReviewModal(false)}
        />
      )}

      {/* History Modal */}
      {showHistoryModal && selectedAssessment && (
        <AssessmentHistoryModal
          assessment={selectedAssessment}
          onClose={() => setShowHistoryModal(false)}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

// Review Assessment Modal Component
const ReviewAssessmentModal: React.FC<{
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
            <h2 className="text-xl font-semibold">Review Assessment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Assessment #{assessment.id} - Cycle {assessment.currentCycle}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Assessment Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Assessment Overview</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2">{new Date(assessment.requestedAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Current Cycle:</span>
                <span className="ml-2">{assessment.currentCycle}</span>
              </div>
            </div>
          </div>

          {/* Skill Scores Review */}
          <div>
            <h3 className="font-medium mb-3">Lead's Assessment</h3>
            <div className="space-y-3">
              {assessment.detailedScores?.map((score: DetailedScore) => (
                <div key={score.skillId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{score.Skill?.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {score.leadScore}/4
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    1: Low | 2: Medium | 3: Average | 4: High
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments (Optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any comments about this assessment..."
            />
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Review Instructions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Review the skill ratings provided by your team lead</li>
              <li>• If you agree with the assessment, click "Approve"</li>
              <li>• If you disagree, click "Request Changes" with your feedback</li>
              <li>• Your decision will be sent to HR for final review</li>
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
            <ThumbsDown className="h-4 w-4" />
            Request Changes
          </button>
          <button
            onClick={() => onSubmit(true)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <ThumbsUp className="h-4 w-4" />
            Approve Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

// Assessment History Modal Component (reused from TeamAssessment)
const AssessmentHistoryModal: React.FC<{
  assessment: AssessmentWithHistory;
  onClose: () => void;
  formatDate: (date: string | Date) => string;
}> = ({ assessment, onClose, formatDate }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Assessment Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Assessment #{assessment.id} - Cycle {assessment.currentCycle}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Assessment Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Assessment Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 font-medium">{assessment.status.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-gray-500">Cycle:</span>
                <span className="ml-2 font-medium">{assessment.currentCycle}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2">{formatDate(assessment.requestedAt)}</span>
              </div>
              <div>
                <span className="text-gray-500">Scheduled:</span>
                <span className="ml-2">{formatDate(assessment.scheduledDate || assessment.requestedAt)}</span>
              </div>
            </div>
          </div>

          {/* Skill Scores */}
          {assessment.detailedScores && assessment.detailedScores.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Skill Assessment</h3>
              <div className="space-y-3">
                {assessment.detailedScores.map((score: DetailedScore) => (
                  <div key={score.skillId} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                    <span className="font-medium">{score.Skill?.name}</span>
                    <div className="flex items-center gap-2">
                      {score.leadScore !== null && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          Lead: {score.leadScore}/4
                        </span>
                      )}
                      {score.leadScore === null && (
                        <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-sm">
                          Not assessed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          <div>
            <h3 className="font-medium mb-3">Assessment History</h3>
            <div className="space-y-3">
              {assessment.history?.map((audit: AuditEntry, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{audit.auditType.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(audit.auditedAt || audit.createdAt)}
                    </span>
                  </div>
                  {audit.comments && (
                    <p className="text-sm text-gray-600 mt-1">{audit.comments}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAssessmentReview;
