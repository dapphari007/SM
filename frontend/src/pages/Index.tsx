import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import OAuthLoginForm from "../components/auth/OAuthLoginForm";
import OAuthCallback from "../components/auth/OAuthCallback";
import TopNavigation from "../components/layout/TopNavigation";
import EmployeeDashboard from "../components/dashboard/EmployeeDashboard";
import TeamLeadDashboard from "../components/dashboard/TeamLeadDashboard";
import HRDashboard from "../components/dashboard/HRDashboard";
import ProfilePage from "../components/profile/ProfilePage";
import TeamOverviewPage from "../components/team/TeamOverviewPage";
import SkillCriteriaPage from "../components/criteria/SkillCriteriaPage";
import SkillMatrixPage from "../components/matrix/SkillMatrixPage";
import SkillUpgradePage from "../components/upgrade/SkillUpgradePage";
import SkillAssessmentPage from "../components/assessment/SkillAssessmentPage";
import PendingAssessmentsPage from "../components/assessment/PendingAssessmentsPage";
import TeamAssessment from "@/components/assessment/TeamAssessment";


const Index = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname;
    if (path === "/") {
      setActiveTab("dashboard");
    } else if (path.startsWith("/profile")) {
      setActiveTab("profile");
    } else if (path.startsWith("/team-overview")) {
      setActiveTab("team-overview");
    } else if (path.startsWith("/skill-criteria")) {
      setActiveTab("skill-criteria");
    } else if (path.startsWith("/skill-matrix")) {
      setActiveTab("skill-matrix");
    } else if (path.startsWith("/skill-upgrade")) {
      setActiveTab("skill-upgrade");
    } else if (path.startsWith("/skill-assessment")) {
      setActiveTab("skill-assessment");
    } else if (path.startsWith("/pending-assessments")) {
      setActiveTab("pending-assessments");
    } else if(path.startsWith("/team-assessment")){
      setActiveTab("team-assessment");
    }
    else {
      setActiveTab("dashboard");
    }
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Check if we're on the OAuth callback route
    if (location.pathname === "/auth/callback") {
      return <OAuthCallback />;
    }
    // Check if we're on the legacy login route
    if (location.pathname === "/legacy-login") {
      return <LoginForm />;
    }
    return <OAuthLoginForm />;
  }
  
  const renderDashboard = () => {
    switch (user?.role.name) {
      case "employee":
        return <EmployeeDashboard onNavigate={handleNavigate} />;
      case "lead":
        return <TeamLeadDashboard onNavigate={handleNavigate} />;
      case "hr":
        return <HRDashboard onNavigate={handleNavigate} />;
      default:
        return <EmployeeDashboard onNavigate={handleNavigate} />;
    }
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);

    switch (tab) {
      case "dashboard":
        navigate("/");
        break;
      case "profile":
        navigate("/profile");
        break;
      case "team-overview":
        navigate("/team-overview");
        break;
      case "skill-criteria":
        navigate("/skill-criteria");
        break;
      case "skill-matrix":
        navigate("/skill-matrix");
        break;
      case "skill-upgrade":
        navigate("/skill-upgrade");
        break;
      case "skill-assessment":
        navigate("/skill-assessment",{state:{user}});
        break;
      case "pending-assessments":
        navigate("/pending-assessments");
        break;
      case "team-assessment":
        navigate("/team-assessment");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation activeTab={activeTab} onTabChange={handleNavigate} />
      <main className="p-8">
        <Routes>
          <Route path="/" element={renderDashboard()} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/team-overview" element={<TeamOverviewPage />} />
          <Route path="/skill-criteria" element={<SkillCriteriaPage />} />
          <Route path="/skill-matrix" element={<SkillMatrixPage />} />
          <Route path="/skill-upgrade" element={<SkillUpgradePage />} />
          <Route path="/skill-assessment" element={<SkillAssessmentPage />} />
          <Route path="/team-assessment" element={<TeamAssessment onNavigate={(tab)=>{console.log(`Navigated to ${tab}`)}}/>}/>
          <Route path="/pending-assessments" element={<PendingAssessmentsPage />}/>
          <Route path="/login" element={<OAuthLoginForm />} />
          <Route path="/legacy-login" element={<LoginForm />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route
            path="*"
            element={
              <div className="p-8 text-center text-gray-500">
                Page not found
              </div>
            }
          />
        </Routes>
      </main>
      
    </div>
  );
};

export default Index;
