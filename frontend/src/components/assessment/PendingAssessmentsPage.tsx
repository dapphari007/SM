import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/custom/index";
import { useAuth } from "@/hooks/useAuth";
import {
  ClipboardList,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowRight,
  Edit,
  Save,
  Info,
} from "lucide-react";
import { assessmentService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import RatingControl from "./RatingControl";

interface Score {
  id: number;
  skillId: number;
  assessmentId: number;
  selfScore: number;
  leadScore: number | null;
  Skill: {
    id: number;
    name: string;
  };
}

interface Assessment {
  id: number;
  userId: number;
  status: string;
  requestedAt: string;
  nextApprover: number;
  user: {
    id: number;
    name: string;
    email: string;
    position: {
      name: string;
    };
  };
  detailedScores: Score[];
}

const PendingAssessmentsPage = () => {
  const { user } = useAuth();
  const [pendingAssessments, setPendingAssessments] = useState<Assessment[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] =
    useState<Assessment | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewComments, setReviewComments] = useState("");
  const [scoreUpdates, setScoreUpdates] = useState<{ [key: number]: number }>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingAssessments();
  }, []);

  const fetchPendingAssessments = async () => {
    try {
      setIsLoading(true);
      const response = await assessmentService.getMyAssignedAssessments();
      if (response.success && response.data) {
        setPendingAssessments(response.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load pending assessments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReviewDialog = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setReviewComments("");

    // Initialize score updates with existing lead scores if any, or self scores as default
    const initialScores: { [key: number]: number } = {};
    assessment.detailedScores.forEach((score) => {
      if (score.leadScore) {
        // Use existing lead score if available
        initialScores[score.skillId] = score.leadScore;
      } else {
        // Otherwise use self score as a starting point
        initialScores[score.skillId] = score.selfScore;
      }
    });
    setScoreUpdates(initialScores);

    setReviewDialogOpen(true);
  };

  const handleScoreChange = (skillId: number, score: number) => {
    setScoreUpdates((prev) => ({
      ...prev,
      [skillId]: score,
    }));
  };

  const handleReviewSubmit = async (action: "Approved" | "Forwarded") => {
    if (!selectedAssessment) return;

    setIsSubmitting(true);

    try {
      // For HR users, don't include score updates (they can't modify scores)
      // For Lead users, format score updates for the API
      const formattedScoreUpdates = isHR
        ? []
        : Object.entries(scoreUpdates).map(([skillId, score]) => ({
            skillId: parseInt(skillId),
            score,
          }));

      const reviewData = {
        status: action,
        comments: reviewComments,
        scoreUpdates: formattedScoreUpdates,
      };

      await assessmentService.reviewAssessment(
        selectedAssessment.id.toString(),
        reviewData
      );

      toast({
        title: "Success",
        description: `Assessment ${
          action === "Approved" ? "approved" : "forwarded"
        } successfully`,
      });

      // Refresh the list
      fetchPendingAssessments();
      setReviewDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to review assessment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case "Forwarded":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Forwarded
          </span>
        );
      case "Approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Approved
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getScoreBadge = (score: number | null) => {
    if (score === null)
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Not Rated
        </span>
      );

    if (score >= 4)
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {score} - High
        </span>
      );
    if (score >= 3)
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {score} - Average
        </span>
      );
    if (score >= 2)
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {score} - Medium
        </span>
      );
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        {score} - Low
      </span>
    );
  };

  const isHR = user?.role?.name === "hr";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pending Assessments</h1>
          <p className="text-gray-600 mt-2">
            Review and process assessment requests assigned to you
          </p>
        </div>
        <button
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={fetchPendingAssessments}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading pending assessments...</p>
        </div>
      ) : pendingAssessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <ClipboardList className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900">
              No Pending Assessments
            </h3>
            <p className="text-gray-500 mt-2">
              You don't have any assessments waiting for your review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingAssessments.map((assessment) => (
            <Card key={assessment.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      {assessment.user.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {assessment.user.email} •{" "}
                      {assessment.user.position?.name.toUpperCase() ||
                        "No Position"}{" "}
                      •{" "}
                      {(assessment.user.Team?.name).toUpperCase() || "No Team"}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(assessment.status)}
                    <span className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(assessment.requestedAt), "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="flex justify-end gap-2 pt-2">
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={() => handleOpenReviewDialog(assessment)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Review Assessment
                </button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      {reviewDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setReviewDialogOpen(false)}
              ></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Review Assessment
                  </h3>
                  {selectedAssessment && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <span className="font-medium">
                        {selectedAssessment.user.name}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span>
                        {selectedAssessment.user.role?.name || "No Role"}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span>
                        {selectedAssessment.user.position?.name ||
                          "No Position"}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span>
                        {selectedAssessment.user.Team?.name || "No Team"}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        Submitted on{" "}
                        {format(
                          new Date(selectedAssessment.requestedAt),
                          "MMM dd, yyyy"
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {selectedAssessment && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-md flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800">
                          Review Instructions
                        </h4>
                        <p className="text-sm text-blue-700">
                          {isHR
                            ? "As HR, you can review both self and lead scores before approving the assessment. You cannot modify the lead scores."
                            : "As a Lead, you should provide scores for each skill based on your evaluation. The scores are pre-filled with the employee's self-assessment."}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        Skills Assessment
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="w-1/3 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Skill
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Self Score
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Lead Score (
                                {selectedAssessment.user.leadId?.name}){" "}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedAssessment.detailedScores.map((score) => (
                              <tr key={score.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {score.Skill.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {getScoreBadge(score.selfScore)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {isHR ? (
                                    // For HR users, just show the lead score as a badge (read-only)
                                    getScoreBadge(
                                      scoreUpdates[score.skillId] || null
                                    )
                                  ) : (
                                    // For Lead users, show interactive RatingControl
                                    <div className="flex justify-center">
                                      <RatingControl
                                        value={scoreUpdates[score.skillId] || 0}
                                        onChange={(value) =>
                                          handleScoreChange(
                                            score.skillId,
                                            value
                                          )
                                        }
                                        disabled={isSubmitting}
                                      />
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Legend for rating system */}
                      {!isHR && (
                        <div className="mt-4">
                          <div className="flex flex-wrap gap-4 p-4 rounded-sm bg-gray-50 border">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <div className="h-4 w-4 rounded-full border bg-gray-200"></div>
                              <span>- Not Rated</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <div className="h-4 w-4 rounded-full border bg-red-200"></div>
                              <span>★ Low</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <div className="h-4 w-4 rounded-full border bg-orange-200"></div>
                              <span>★★ Medium</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <div className="h-4 w-4 rounded-full border bg-yellow-200"></div>
                              <span>★★★ Average</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <div className="h-4 w-4 rounded-full border bg-green-200"></div>
                              <span>★★★★ High</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        Review Comments
                      </h3>
                      <textarea
                        placeholder="Add your comments about this assessment..."
                        value={reviewComments}
                        onChange={(e) => setReviewComments(e.target.value)}
                        className="min-h-[100px] w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-700 focus:border-gray-500 sm:text-sm"
                        rows={4}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <div className="flex gap-4">
                  {!isHR && (
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleReviewSubmit("Forwarded")}
                      disabled={isSubmitting}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Processing..." : "Forward to HR"}
                    </button>
                  )}
                  {isHR && (
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleReviewSubmit("Approved")}
                      disabled={isSubmitting}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Processing..." : "Approve Assessment"}
                    </button>
                  )}
                </div>
                <button
                  className="mt-3 w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setReviewDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingAssessmentsPage;
