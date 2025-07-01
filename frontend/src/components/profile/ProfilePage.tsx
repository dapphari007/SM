import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  Mail,
  Building,
  Save,
  X,
  Award,
  Briefcase,
  UserCircle,
  Calendar,
} from "lucide-react";
import { assessmentService, userService } from "@/services/api";
import { toast } from "sonner";

interface Skill {
  skill_id: number;
  skill_name: string;
  lead_score: number;
  targetLevel?: 4;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: string;
  };
  Team?: {
    id: string;
    name: string;
  };
  position?: {
    id: string;
    name: string;
  };
  leadId?: {
    name: string;
  };
  hrId?: {
    name: string;
  };
  userId?: string;
  createdAt?: string;
  skills?: Skill[];
  data?: Skill[];
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile>(
    {} as UserProfile
  );
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const scores = await assessmentService.getUserLatestApprovedScores();
        const userProfile = await userService.getProfile();

        setProfileData(userProfile);

        if (scores && scores.data) {
          setSkills(scores.data);
        }
      } catch (error) {
        toast.error(error.message);
        console.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);



  console.log("profileData", profileData);


  console.log(skills);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 ">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Profile</h1>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Personal Information Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Personal Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Full Name
                  </label>
                    <p className="text-sm font-medium">
                      {profileData.name || user?.name}
                    </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <p className="text-sm">
                      {profileData.email || user?.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="userId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Employee ID
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300 font-mono">
                      {profileData.userId || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="joinDate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Join Date
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <p className="text-sm">
                      {profileData.createdAt
                        ? new Date(profileData.createdAt).toLocaleDateString()
                        : "Not available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Work Information Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Work Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="department"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Department/Team
                  </label>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <p className="text-sm font-medium">
                      {(profileData.Team?.name ||
                        user?.Team?.name ||
                        "Not assigned").toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="position"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Position
                  </label>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <p className="text-sm font-medium">
                      {(profileData.position?.name ||
                        user?.position?.name ||
                        "Not assigned").toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Role
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {profileData.role?.name ||
                        user?.role?.name ||
                        "Not assigned"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="position"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Lead
                  </label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <p className="text-sm font-medium">
                      {profileData.leadId?.name || "Not assigned"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="position"
                    className="block text-sm font-medium text-gray-700"
                  >
                    HR
                  </label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <p className="text-sm font-medium">
                      {profileData.hrId?.name || "Not assigned"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Skills Overview Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Award className="h-5 w-5" />
                Skills Overview
              </h2>
            </div>

            {skills && skills.length > 0 ? (
              <div className="p-6">
                <div className=" grid grid-cols-2 md:grid-cols-3 gap-6 h-[70dvh] overflow-y-auto">
                  {skills.map((skill, index) => (
                    <div
                      key={index}
                      className="group bg-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {skill.skill_name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Current Proficiency
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            Level {skill.lead_score}/4
                          </span>
                          {skill.targetLevel &&
                            skill.targetLevel > skill.lead_score && (
                              <span className="text-xs text-gray-500 mt-1">
                                Target: Level {skill.targetLevel}
                              </span>
                            )}
                        </div>
                      </div>

                      {/* Progress Indicator */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Beginner</span>
                          <span>Expert</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                            style={{
                              width: `${(skill.lead_score / 4) * 100}%`,
                            }}
                          ></div>
                        </div>

                        {/* Level Markers */}
                        <div className="flex justify-between px-0.5 mt-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`w-4 h-4 rounded-full border-2 ${
                                level <= skill.lead_score
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 bg-gray-50"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <Award className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-medium">
                  No Skills Assessed Yet
                </h3>
                <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                  Your skills assessment will appear here once completed
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
