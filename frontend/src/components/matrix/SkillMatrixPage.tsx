import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { userService, skillService } from "@/services/api";
import {
  Download,
  LayoutGridIcon,
  Search,
  Users,
} from "lucide-react";
import { exportPDF, getAverageSkillLevel, getSkillLevelColor, getSkillScore } from "@/utils/helper";
import {SkillScore,SkillMatrixData,Skill} from "../../types/matrixTypes";

const SkillMatrixPage = () => {
  const { user } = useAuth();
  const [matrixData, setMatrixData] = useState<SkillMatrixData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [skillCategories, setSkillCategories] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canViewAll = user?.role.name === "hr" || user?.role.name === "lead";
  const isHR = user?.role.name === "hr";
  const isLead = user?.role.name === "lead";

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const skillsResponse = await skillService.getAllSkills();
        setSkillCategories(skillsResponse);

        let matrixResponse;
        if (user.role.name === "hr") {
          // HR can see full matrix
          matrixResponse = await userService.getFullMatrix();
        } else if (user.role.name === "lead" && user.Team?.name) {
          // Lead can see their team matrix
          matrixResponse = await userService.getTeamMatrix(user.Team.name);
        } else {
          matrixResponse = [];
        }

        setMatrixData(matrixResponse);
      } catch (err) {
        console.error("Error fetching matrix data:", err);
        setError("Failed to load skill matrix data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Filter data
  const getFilteredData = () => {
    // First filter by search term
    const searchFiltered = matrixData.filter((employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Then apply team and position filters
    const filtered = searchFiltered.filter((employee) => {
      const teamMatch =
        selectedTeam === "all" || employee.Team?.name === selectedTeam;
      const positionMatch =
        selectedPosition === employee.position?.name;

      if (isHR) {
        // HR must select both team and position (not "all") to see data
        return teamMatch && positionMatch;
      } else if (isLead) {
        // Lead can filter by position only
        return positionMatch;
      }

      return teamMatch && positionMatch;
    });

    return filtered;
  };

  // Check if HR has selected required filters
  const hasRequiredFilters = () => {
    if (isHR) {
      return selectedPosition !== "all"; 
    }
    return true;
  };

  // Get relevant skills for the filtered employees to show in the columns
  const getRelevantSkills = (employees: SkillMatrixData[]) => {
    const skillIds = new Set<number>();
    employees.forEach((employee) => {
      employee.mostRecentAssessmentScores.forEach((score) => {
        skillIds.add(score.skillId);
      });
    });

    return skillCategories.filter((skill) => skillIds.has(skill.id));
  };

  // Get filter options based on user role and data
  const getFilterOptions = () => {
    const teams = Array.from(
      new Set(matrixData.map((emp) => emp.Team?.name).filter(Boolean))
    );
    const positions = Array.from(
      new Set(matrixData.map((emp) => emp.position?.name).filter(Boolean))
    );

    return { teams, positions };
  };

  const { teams, positions } = getFilterOptions();
  const filteredData = getFilteredData();
  const relevantSkills = getRelevantSkills(filteredData);
  console.log("relevant Skills", relevantSkills);
  console.log("filtered Data", filteredData);

  // Export to PDF function using jsPDF
  const exportToPDF = () => {
    exportPDF(filteredData, relevantSkills, searchTerm, isHR, isLead, selectedTeam, selectedPosition);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading skill matrix...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Skill Matrix</h1>
        <div className="flex gap-2">
          {/* Download Button */}
          <button
            onClick={exportToPDF}
            disabled={!hasRequiredFilters() || filteredData.length === 0}
            title={!hasRequiredFilters() ? "Please select a position to generate the report." : ""}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> Export Matrix
          </button>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold">{matrixData.length}</p>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          <div>
            <p className="text-sm text-gray-600">Skills Tracked</p>
            <p className="text-2xl font-bold text-blue-600">
              {relevantSkills.length}
            </p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          <div>
            <p className="text-sm text-gray-600">Avg Skill Level</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredData.length > 0
                ? (
                    filteredData.reduce(
                      (acc, emp) => acc + getAverageSkillLevel(emp),
                      0
                    ) / filteredData.length
                  ).toFixed(1)
                : "0.0"}
            </p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          <div>
            <p className="text-sm text-gray-600">Filtered Employees</p>
            <p className="text-2xl font-bold text-purple-600">
              {filteredData.length}
            </p>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <LayoutGridIcon className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Skills Matrix</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search employees..."
                  className="pl-8 pr-3 py-2 border border-gray-300 rounded w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <Search className="w-5 h-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              {canViewAll && (
                <>
                  {isHR && (
                    <>
                      <select
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                      >
                        <option value="all">All Teams</option>
                        {teams.map((team) => (
                          <option key={team} value={team}>
                            {team}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                    <select
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                    >
                      <option value="all">Select Positions *</option>
                      {positions.map((position) => (
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-5">
          {!hasRequiredFilters() ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">
                Select Position to View Matrix
              </h3>
              <p>Please select a position to view the skill matrix.</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ||
              selectedTeam !== "all" ||
              selectedPosition !== "all"
                ? "No employees match your search criteria."
                : "No skill matrix data available."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" id="skill-matrix-table">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 min-w-40 sticky left-0 bg-white">
                      Employee
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Role
                    </th>
                    {relevantSkills.map((skill) => (
                      <th
                        key={skill.id}
                        className="text-center py-3 px-2 font-semibold text-gray-700 min-w-20"
                      >
                        {skill.name}
                      </th>
                    ))}
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      Avg
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((employee) => {
                    const avgSkill = getAverageSkillLevel(employee);

                    return (
                      <tr
                        key={employee.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 sticky left-0 bg-white">
                          {employee.name}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {employee.role?.name || "N/A"}
                        </td>
                        {relevantSkills.map((skill) => {
                          const skillScore = getSkillScore(employee, skill.id);
                          return (
                            <td
                              key={skill.id}
                              className={`text-center py-3 px-2 text-xs font-medium min-w-8 ${getSkillLevelColor(
                                  skillScore
                                )}`}
                            >
                              <span
                                
                              >
                                {skillScore || "N/A"}
                              </span>
                            </td>
                          );
                        })}
                        <td className={`text-center py-3 px-4 text-xs font-medium ${getSkillLevelColor(
                              Math.round(avgSkill)
                            )}`}>
                          <span
                          >
                            {avgSkill.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillMatrixPage;
