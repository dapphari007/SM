import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Search,
  UserPlus,
  BarChart3,
  TrendingUp,
  X,
  User,
  Mail,
  Briefcase,
  Building2,
  Edit,
  Trash2,
  MoreVertical,
  ChevronDown,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Plus,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { userService, assessmentService, skillService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import DeleteModal from "../../lib/DeleteModal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TeamMember, SkillScore, SkillModalData } from "../../types/teamTypes";
import { 
  AssessmentWithHistory, 
  AssessmentStatus, 
  LeadSkillAssessment, 
  TeamStatistics,
  DetailedScore 
} from "../../types/assessmentTypes";
import { getAverageSkillLevel } from "@/utils/helper";

interface Skill {
  id: number;
  name: string;
}
const TeamAssessment = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [assessments, setAssessments] = useState<AssessmentWithHistory[]>([]);
    const [pendingAssessments, setPendingAssessments] = useState<AssessmentWithHistory[]>([]);
    const [statistics, setStatistics] = useState<TeamStatistics | null>(null);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState("pending");
    
    const [openDropdowns, setOpenDropdowns] = useState<{
        [key: string]: boolean;
    }>({});
    const [userModalMode, setUserModalMode] = useState<"add" | "edit">("add");
    const [usertoDelete, setUserToDelete] = useState<TeamMember | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<TeamMember | null>(null);
    const [showSkillModal, setShowSkillModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [skillModalData, setSkillModalData] = useState<SkillModalData | null>(null);

    // Assessment workflow states
    const [showWriteAssessmentModal, setShowWriteAssessmentModal] = useState(false);
    const [selectedAssessment, setSelectedAssessment] = useState<AssessmentWithHistory | null>(null);
    const [skillScores, setSkillScores] = useState<{ [skillId: number]: number }>({});
    const [comments, setComments] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
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
                assessmentService.getTeamMembers().catch(() => ({ success: false, data: [] })),
                assessmentService.getTeamAssessments().catch(() => ({ success: false, data: [] })),
                assessmentService.getPendingTeamAssessments().catch(() => ({ success: false, data: [] })),
                assessmentService.getTeamAssessmentStatistics().catch(() => ({ success: false, data: null })),
                skillService.getAllSkills(),
            ]);

            // If assessment service doesn't return team members, fall back to user service
            if (membersRes.success && membersRes.data.length > 0) {
                setTeamMembers(membersRes.data);
            } else if (user?.Team?.name) {
                // Fallback to user service
                const fallbackData = await userService.getTeamMatrix(user.Team.name);
                setTeamMembers(fallbackData || []);
            }

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

    useEffect(()=>{
        const isAnyModalOpen=showSkillModal || showUserModal || showDeleteModal;
        if(isAnyModalOpen){
            document.body.style.overflow="hidden";
            return()=>{
                document.body.style.overflow="unset";
            };
        }
    },[showSkillModal,showUserModal,showDeleteModal]);

    const toggleDropdown=(id:string)=>{
        setOpenDropdowns((prev)=>({
            ...prev,
            [id]:!prev[id],
        }));
    };

    const handleEditUser=(member:TeamMember)=>{
        setUserModalMode("edit");
        setEditingUser(member);
        setShowUserModal(true);
    };

    const handleDeleteUser=(member:TeamMember)=>{
        setUserToDelete(member);
        setShowDeleteModal(true);
    };

    const filteredMembers=teamMembers.filter((member)=>{
        const matchesSearch=
        member.name.toLowerCase().includes(searchTerm.toLowerCase())||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    })

    const fetchTeamData=async()=>{
        try{
            let data;
            if(user?.role?.name==="lead"){
                data=await userService.getTeamMatrix(user?.Team?.name);
            }
            console.log("First data",data);
            setTeamMembers(data);
        }catch(err){
            toast({title:"Failed to load team members",variant:"destructive"});
        }finally{
            setIsLoading(false);
        }
    };
    
    const getSkillLevelColor=(level:number)=>{
        if(level>=4) return "bg-green-100 text-green-800";
        if(level>=3) return "bg-blue-100 text-blue-800";
        if(level>=2) return "bg-yellow-100 text-yellow-800";
        return "bg-red-100 text-red-800";
    }

    const getAverageSkillLevel=(member:TeamMember)=>{
        if(
            !member.mostRecentAssessmentScores||member.mostRecentAssessmentScores.length===0
        ){
            return 0;
        }
        const total=member.mostRecentAssessmentScores.reduce((sum,score)=>sum + score.Score,0);
        return total / member.mostRecentAssessmentScores.length;
    }

    const handleViewScores=async(member:TeamMember)=>{
        try{
            const response= await assessmentService.getUserLatestApprovedScoresByUserId(parseInt(member.id));
            const scores=response.success?response.data:[];
            setSkillModalData({
                memberName:member.name,
                skills:scores,
            });
            setShowSkillModal(true);
        }
        catch(error){
            toast({title:"Filed to load skill scores",variant:"destructive"});
        }
    }

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
                return <Edit className="h-4 w-4" />;
            case AssessmentStatus.EMPLOYEE_REVIEW:
                return <Eye className="h-4 w-4" />;
            case AssessmentStatus.EMPLOYEE_APPROVED:
                return <CheckCircle className="h-4 w-4" />;
            case AssessmentStatus.EMPLOYEE_REJECTED:
                return <X className="h-4 w-4" />;
            case AssessmentStatus.HR_FINAL_REVIEW:
                return <AlertCircle className="h-4 w-4" />;
            case AssessmentStatus.COMPLETED:
                return <CheckCircle className="h-4 w-4" />;
            case AssessmentStatus.CANCELLED:
                return <X className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const handleWriteAssessment = (assessment: AssessmentWithHistory) => {
        setSelectedAssessment(assessment);
        // Initialize skill scores from existing assessment or empty
        const initialScores: { [skillId: number]: number } = {};
        assessment.detailedScores?.forEach((score: DetailedScore) => {
            if (score.leadScore) {
                initialScores[score.skillId] = score.leadScore;
            }
        });
        setSkillScores(initialScores);
        setComments("");
        setShowWriteAssessmentModal(true);
    };

    const handleSubmitAssessment = async () => {
        if (!selectedAssessment) return;

        setIsSubmitting(true);
        try {
            const skillAssessments: LeadSkillAssessment[] = selectedAssessment.detailedScores.map((score: DetailedScore) => ({
                skillId: score.skillId,
                leadScore: skillScores[score.skillId] || 1,
            }));

            const response = await assessmentService.writeLeadAssessment(
                selectedAssessment.id,
                skillAssessments,
                comments
            );

            if (response.success) {
                toast({
                    title: "Success",
                    description: "Assessment submitted successfully",
                });
                setShowWriteAssessmentModal(false);
                loadTeamData(); // Refresh data
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

    const handleViewHistory = (assessment: AssessmentWithHistory) => {
        setSelectedAssessmentHistory(assessment);
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

    // Check if team member has pending assessments
    const getMemberPendingAssessment = (memberId: string): AssessmentWithHistory | null => {
        return pendingAssessments.find(assessment => 
            assessment.userId === memberId && 
            (assessment.status === AssessmentStatus.LEAD_WRITING || assessment.status === AssessmentStatus.INITIATED)
        ) || null;
    };

    const tabs = [
        { id: "overview", label: "Team Overview", icon: Users },
        { id: "assessments", label: "All Assessments", icon: FileText },
        { id: "pending", label: "Pending Actions", icon: Clock },
    ];

    return (
        <div className="space-y-6">
            {/* Header with Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-gray-600">Total Members</p>
                            <p className="text-2xl font-bold">{statistics?.totalTeamMembers || teamMembers.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div>
                            <p className="text-sm text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-green-600">
                                {statistics?.assessments.byStatus.completed || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 flex items-center gap-3">
                        <Clock className="h-8 w-8 text-yellow-600" />
                        <div>
                            <p className="text-sm text-gray-600">Pending Actions</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {statistics?.pendingActions || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-gray-600">Recent Activity</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {statistics?.recentAssessments || 0}
                            </p>
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
                                    {tab.id === "pending" && statistics?.pendingActions > 0 && (
                                        <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                            {statistics.pendingActions}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-6">
                    {/* Tab Content */}
                    {selectedTab === "overview" && (
                        <TeamOverviewTab 
                            teamMembers={teamMembers}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            isLoading={isLoading}
                            handleViewScores={handleViewScores}
                            getAverageSkillLevel={getAverageSkillLevel}
                            getSkillLevelColor={getSkillLevelColor}
                            getMemberPendingAssessment={getMemberPendingAssessment}
                            handleWriteAssessment={handleWriteAssessment}
                        />
                    )}

                    {selectedTab === "assessments" && (
                        <AllAssessmentsTab 
                            assessments={assessments}
                            isLoading={isLoading}
                            handleWriteAssessment={handleWriteAssessment}
                            handleViewHistory={handleViewHistory}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                            formatDate={formatDate}
                            userRole={user?.role?.name}
                        />
                    )}

                    {selectedTab === "pending" && (
                        <PendingActionsTab 
                            pendingAssessments={pendingAssessments}
                            isLoading={isLoading}
                            handleWriteAssessment={handleWriteAssessment}
                            handleViewHistory={handleViewHistory}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                            formatDate={formatDate}
                        />
                    )}
                </div>
            </div>

            {/* Write Assessment Modal */}
            {showWriteAssessmentModal && selectedAssessment && (
                <WriteAssessmentModal 
                    assessment={selectedAssessment}
                    skills={skills}
                    skillScores={skillScores}
                    setSkillScores={setSkillScores}
                    comments={comments}
                    setComments={setComments}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmitAssessment}
                    onClose={() => setShowWriteAssessmentModal(false)}
                />
            )}

            {/* Assessment History Modal */}
            {showHistoryModal && selectedAssessmentHistory && (
                <AssessmentHistoryModal 
                    assessment={selectedAssessmentHistory}
                    onClose={() => setShowHistoryModal(false)}
                    formatDate={formatDate}
                />
            )}



            {/* Skill Scores Modal */}
            {showSkillModal && skillModalData && (
                <SkillScoresModal 
                    data={skillModalData}
                    onClose={() => setShowSkillModal(false)}
                />
            )}
        </div>
    );

}

// Tab Components
const TeamOverviewTab: React.FC<{
    teamMembers: TeamMember[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    isLoading: boolean;
    handleViewScores: (member: TeamMember) => void;
    getAverageSkillLevel: (member: TeamMember) => number;
    getSkillLevelColor: (level: number) => string;
    getMemberPendingAssessment: (memberId: string) => AssessmentWithHistory | null;
    handleWriteAssessment: (assessment: AssessmentWithHistory) => void;
}> = ({ teamMembers, searchTerm, setSearchTerm, isLoading, handleViewScores, getAverageSkillLevel, getSkillLevelColor, getMemberPendingAssessment, handleWriteAssessment }) => {
    const filteredMembers = teamMembers.filter((member) => {
        const matchesSearch =
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                </h3>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        placeholder="Search members..."
                        className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Team Members Cards */}
            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <p className="text-lg text-gray-600">Loading team members...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredMembers.map((member) => {
                        const pendingAssessment = getMemberPendingAssessment(member.id);
                        return (
                        <div
                            key={member.id}
                            className={`rounded-lg border shadow-sm hover:shadow-lg transition-shadow ${
                                pendingAssessment 
                                    ? "bg-yellow-50 border-yellow-200" 
                                    : "bg-gray-50 border-gray-200"
                            }`}
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                            pendingAssessment ? "bg-yellow-100" : "bg-blue-100"
                                        }`}>
                                            <User className={`h-6 w-6 ${
                                                pendingAssessment ? "text-yellow-600" : "text-blue-600"
                                            }`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{member.name}</h3>
                                            <p className="text-sm text-gray-500">ID: {member.userId}</p>
                                            {pendingAssessment && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    Assessment Pending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSkillLevelColor(
                                            getAverageSkillLevel(member)
                                        )}`}
                                    >
                                        {getAverageSkillLevel(member).toFixed(1)}/4
                                    </span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Briefcase className="h-4 w-4 text-gray-400" />
                                        <span>{member.role.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Building2 className="h-4 w-4 text-gray-400" />
                                        <span>{member.position.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        <span>{member.Team?.name}</span>
                                    </div>
                                    {member.email && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            <span className="truncate">{member.email}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-sm">
                                        <span className="text-gray-500">Skills Assessed: </span>
                                        <span className="font-medium">
                                            {member.mostRecentAssessmentScores?.length || 0}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {(() => {
                                            const pendingAssessment = getMemberPendingAssessment(member.id);
                                            if (pendingAssessment) {
                                                return (
                                                    <button
                                                        onClick={() => handleWriteAssessment(pendingAssessment)}
                                                        className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-1"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        {pendingAssessment.status === AssessmentStatus.INITIATED ? 'Start Assessment' : 'Write Assessment'}
                                                    </button>
                                                );
                                            }
                                            return null;
                                        })()}
                                        <button
                                            className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${
                                                member.hasRecentAssessment
                                                    ? "border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    : "border-gray-200 text-gray-400 cursor-not-allowed"
                                            }`}
                                            onClick={() => handleViewScores(member)}
                                            disabled={!member.hasRecentAssessment}
                                        >
                                            View Scores
                                        </button>
                                    </div>
                                </div>

                                {!member.hasRecentAssessment && (
                                    <div className="mt-3 p-2 bg-orange-50 rounded-md">
                                        <p className="text-xs text-orange-600">
                                            No recent assessment available
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const AllAssessmentsTab: React.FC<{
    assessments: AssessmentWithHistory[];
    isLoading: boolean;
    handleWriteAssessment: (assessment: AssessmentWithHistory) => void;
    handleViewHistory: (assessment: AssessmentWithHistory) => void;
    getStatusColor: (status: AssessmentStatus) => string;
    getStatusIcon: (status: AssessmentStatus) => React.ReactNode;
    formatDate: (date: string | Date) => string;
    userRole: string | undefined;
}> = ({ assessments, isLoading, handleWriteAssessment, handleViewHistory, getStatusColor, getStatusIcon, formatDate, userRole }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <p className="text-lg text-gray-600">Loading assessments...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Team Assessments
            </h3>

            {assessments.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-600">No assessments found</p>
                    <p className="text-sm text-gray-500">Assessments will appear here once they are initiated</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {assessments.map((assessment) => (
                        <div key={assessment.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">{assessment.user?.name}</h4>
                                        <p className="text-sm text-gray-500">Assessment #{assessment.id}</p>
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
                                    <span>Cycle: {assessment.currentCycle}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    <span>Skills: {assessment.detailedScores?.length || 0}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    {assessment.status === AssessmentStatus.LEAD_WRITING && userRole === "lead" ? (
                                        <span className="text-yellow-600 font-medium">⚠️ Action Required</span>
                                    ) : (
                                        <span>Current Status: {assessment.status.replace('_', ' ')}</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleViewHistory(assessment)}
                                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
                                    >
                                        <Eye className="h-4 w-4" />
                                        View History
                                    </button>
                                    {assessment.status === AssessmentStatus.LEAD_WRITING && userRole === "lead" && (
                                        <button
                                            onClick={() => handleWriteAssessment(assessment)}
                                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Write Assessment
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const PendingActionsTab: React.FC<{
    pendingAssessments: AssessmentWithHistory[];
    isLoading: boolean;
    handleWriteAssessment: (assessment: AssessmentWithHistory) => void;
    handleViewHistory: (assessment: AssessmentWithHistory) => void;
    getStatusColor: (status: AssessmentStatus) => string;
    getStatusIcon: (status: AssessmentStatus) => React.ReactNode;
    formatDate: (date: string | Date) => string;
}> = ({ pendingAssessments, isLoading, handleWriteAssessment, handleViewHistory, getStatusColor, getStatusIcon, formatDate }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <p className="text-lg text-gray-600">Loading pending actions...</p>
            </div>
        );
    }

    const leadWritingAssessments = pendingAssessments.filter(a => 
        a.status === AssessmentStatus.LEAD_WRITING || a.status === AssessmentStatus.INITIATED
    );

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Actions
            </h3>

            {leadWritingAssessments.length === 0 ? (
                <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-600">No pending actions</p>
                    <p className="text-sm text-gray-500">All assessments are up to date</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {leadWritingAssessments.map((assessment) => (
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
                                    ACTION REQUIRED
                                </span>
                            </div>

                            <div className="mb-4 p-3 bg-white rounded-md border">
                                <p className="text-sm text-gray-700 mb-2">
                                    <strong>Next Action:</strong> {assessment.status === AssessmentStatus.INITIATED ? 'Assessment ready to start' : 'Write assessment for team member'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Scheduled: {formatDate(assessment.scheduledDate)}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Skills to assess: {assessment.detailedScores?.length || 0}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Status: <span className="font-medium">{assessment.status.replace('_', ' ')}</span>
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
                                    onClick={() => handleWriteAssessment(assessment)}
                                    className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-1"
                                >
                                    <Edit className="h-4 w-4" />
                                    {assessment.status === AssessmentStatus.INITIATED ? 'Start Assessment' : 'Write Assessment'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Modal Components
const WriteAssessmentModal: React.FC<{
    assessment: AssessmentWithHistory;
    skills: Skill[];
    skillScores: { [skillId: number]: number };
    setSkillScores: (scores: { [skillId: number]: number }) => void;
    comments: string;
    setComments: (comments: string) => void;
    isSubmitting: boolean;
    onSubmit: () => void;
    onClose: () => void;
}> = ({ assessment, skills, skillScores, setSkillScores, comments, setComments, isSubmitting, onSubmit, onClose }) => {
    const handleScoreChange = (skillId: number, score: number) => {
        setSkillScores({ ...skillScores, [skillId]: score });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Write Assessment</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                        Assessment for {assessment.user?.name} - #{assessment.id}
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-medium mb-4">Rate Skills (1-4 scale)</h3>
                        <div className="space-y-4">
                            {assessment.detailedScores?.map((score: DetailedScore) => {
                                const skill = skills.find(s => s.id === score.skillId);
                                return (
                                    <div key={score.skillId} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium">{skill?.name || score.Skill?.name}</h4>
                                            <span className="text-sm text-gray-500">
                                                Current: {skillScores[score.skillId] || 1}/4
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map((rating) => (
                                                <button
                                                    key={rating}
                                                    onClick={() => handleScoreChange(score.skillId, rating)}
                                                    className={`p-2 rounded-md transition-colors ${
                                                        skillScores[score.skillId] === rating
                                                            ? "text-yellow-500"
                                                            : "text-gray-300 hover:text-yellow-400"
                                                    }`}
                                                >
                                                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                                        <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z"/>
                                                    </svg>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500">
                                            1: Low | 2: Medium | 3: Average | 4: High
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

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
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        {isSubmitting ? "Submitting..." : "Submit Assessment"}
                    </button>
                </div>
            </div>
        </div>
    );
};

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
                        <h2 className="text-xl font-semibold">Assessment History</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                        {assessment.user?.name} - Assessment #{assessment.id}
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
                                <span className="ml-2">{formatDate(assessment.scheduledDate)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Skill Scores */}
                    {assessment.detailedScores && assessment.detailedScores.length > 0 && (
                        <div>
                            <h3 className="font-medium mb-3">Skill Scores</h3>
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

                    {/* Audit History */}
                    <div>
                        <h3 className="font-medium mb-3">History</h3>
                        <div className="space-y-3">
                            {assessment.history?.map((audit, index) => (
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

const SkillScoresModal: React.FC<{
    data: SkillModalData;
    onClose: () => void;
}> = ({ data, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Skill Scores</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{data.memberName}</p>
                </div>

                <div className="p-6">
                    {data.skills.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No skill scores available</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.skills.map((skill, index) => (
                                <div key={index} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                                    <span className="font-medium">{skill.skill_name}</span>
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                        {skill.lead_score}/4
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
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

export default TeamAssessment;
