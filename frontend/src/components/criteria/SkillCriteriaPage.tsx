import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Target,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import { positionService, skillService } from "@/services/api";
import SkillCreationModal from "./SkillCreationModal";
import DeleteModal from "../../lib/DeleteModal";

interface SkillCriterion {
  id: number;
  name: string;
  low: string;
  medium: string;
  average: string;
  high: string;
  createdAt: string;
  createdBy: string;
  position: number[];
}

const SkillCriteriaPage = () => {
  const { user } = useAuth();
  const [criteria, setCriteria] = useState<SkillCriterion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillCriterion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<SkillCriterion | null>(
    null
  );
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [newCriterion, setNewCriterion] = useState({
    name: "",
    low: "",
    medium: "",
    average: "",
    high: "",
  });
  const [positions, setPositions] = useState<{ id: number; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const canEdit = user?.role?.name === "hr";

  const toggleAccordion = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  useEffect(() => {
    const fetchSkillCriteria = async () => {
      try {
        setLoading(true);
        setError(null);
        let skillsData;
        if (!(user?.role?.name === "hr")) {
          skillsData = await skillService.getSkillsByPosition();
        } else {
          skillsData = await skillService.getAllSkills();
        }

        const positionsData = await positionService.getAllPositions();
        setPositions(positionsData);
        setCriteria(skillsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch skill criteria"
        );
        console.error("Error fetching skill criteria:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSkillCriteria();
  }, [user]);

  const refreshData = () => {
    const fetchSkillCriteria = async () => {
      try {
        setLoading(true);
        setError(null);
        let skillsData;
        if (!(user?.role?.name === "hr")) {
          skillsData = await skillService.getSkillsByPosition();
        } else {
          skillsData = await skillService.getAllSkills();
        }
        setCriteria(skillsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch skill criteria"
        );
        console.error("Error fetching skill criteria:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSkillCriteria();
  };

  const handleModalSuccess = async () => {
    try {
      let skillsData;
      if (!(user?.role?.name === "hr")) {
        skillsData = await skillService.getSkillsByPosition();
      } else {
        skillsData = await skillService.getAllSkills();
      }
      setCriteria(skillsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh skill criteria"
      );
      console.error("Error refreshing skill criteria:", err);
    }
  };

  const handleEdit = (criterion: SkillCriterion) => {
    setEditingSkill(criterion);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (criterion: SkillCriterion) => {
    setSkillToDelete(criterion);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!skillToDelete) return;

    try {
      await skillService.deleteSkill(skillToDelete.id);

      // Remove from local state
      setCriteria(criteria.filter((c) => c.id !== skillToDelete.id));

      // Close modal and reset state
      setIsDeleteModalOpen(false);
      setSkillToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete skill");
      console.error("Error deleting skill:", err);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setSkillToDelete(null);
  };

  const getPositionNames = (positionIds: number[]) => {
    const positionName = positions.filter((p) => positionIds.includes(p.id)).map((p) => p.name.toUpperCase()).join(", ");
    return positionName || "Not specified";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading skill criteria...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  const filteredCriteria = criteria.filter((criterion) => {
    const matchesSearch = criterion.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
  return matchesSearch;
  });

  return (
    <div className="">
      <div className="flex justify-between mb-4 items-center">
        <h1 className="text-3xl font-bold">Skill Criteria</h1>
      </div>


      <SkillCreationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSkill(null);
        }}
        onSuccess={handleModalSuccess}
        editSkill={editingSkill}
        mode={editingSkill ? "edit" : "create"}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      <div className="space-y-4">
         {/* Need to implement a filter section here */}
         <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-4 sm:flex-row flex-col sm:items-center">
        <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder="Search members..."
                className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none"
            onChange={(e) => {
              const positionId = parseInt(e.target.value);
              if (positionId) {
                setCriteria(criteria.filter(c => c.position.includes(positionId)));
              } else {
                refreshData();
              }
            }}
          >
            <option value="">All Positions</option>
            {positions.map((position) => (
              <option key={position.id} value={position.id}>
                {position.name}
              </option>
            ))}
          </select> 
        </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-background border text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-150"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          {canEdit && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors duration-150"
            >
              <Plus className="h-4 w-4" />
              Add Criterion
            </button>
          )}
        </div>
            </div>
        </div>
        </div>


        {filteredCriteria.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No skill criteria found
            </h3>
            <p className="text-gray-500 mb-6">
              No skill criteria found for your position. Get started by adding
              your first criterion.
            </p>
            {canEdit && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                <Plus className="h-5 w-5" />
                Add First Criterion
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCriteria.map((criterion) => (
              <div
                key={criterion.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                {/* Accordion Header */}
                <div
                  className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                  onClick={() => toggleAccordion(criterion.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {expandedItems.has(criterion.id) ? (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-800">
                        {criterion.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getPositionNames(criterion.position || [])}
                      </span>
                      {criterion.createdBy && (<span className="text-sm text-gray-500">
                        Created by {criterion.createdBy}
                      </span>)}
                    </div>
                  </div>

                  {canEdit && (
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleEdit(criterion)}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors duration-150"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(criterion)}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors duration-150"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Accordion Content */}
                {expandedItems.has(criterion.id) && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Low Level */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <h4 className="font-semibold text-gray-700">
                              Low Level
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-200 min-h-[80px]">
                            {criterion.low || "Not defined"}
                          </p>
                        </div>

                        {/* Medium Level */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <h4 className="font-semibold text-gray-700">
                              Medium Level
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-200 min-h-[80px]">
                            {criterion.medium || "Not defined"}
                          </p>
                        </div>

                        {/* Average Level */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                            <h4 className="font-semibold text-gray-700">
                              Average Level
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-200 min-h-[80px]">
                            {criterion.average || "Not defined"}
                          </p>
                        </div>

                        {/* High Level */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            <h4 className="font-semibold text-gray-700">
                              High Level
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-200 min-h-[80px]">
                            {criterion.high || "Not defined"}
                          </p>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            Created on{" "}
                            {new Date(criterion.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillCriteriaPage;
