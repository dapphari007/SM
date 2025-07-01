import React, { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import {
  userService,
  positionService,
  roleService,
  teamService,
} from "@/services/api";
import { Loader2, ChevronDown, X } from "lucide-react";

interface UserFormData {
  id?: number;
  userId: string;
  name: string;
  email: string;
  roleId: number;
  positionId: number;
  teamId: number;
  leadId?: number | undefined;
  hrId?: number | undefined;
}

interface User {
  createdAt: string;
  email: string;
  id?: number;
  name: string;
  Team?: { id: number; name: string };
  position?: { id: number; name: string };
  role?: { id: number; name: string };
  leadId?: number | undefined;
  hrId?: number | undefined;
  positionId: number;
  roleId: number;
  teamId: number;
  userId: string;
}

interface InnerDetails { id: number; name: string }

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editUser?: any;
  mode: "add" | "edit";
}

const UserManagementModal = ({
  isOpen,
  onClose,
  onSuccess,
  editUser,
  mode,
}:UserManagementModalProps) => {
  const [formData, setFormData] = useState<UserFormData>({
    userId: "",
    name: "",
    email: "",
    roleId: 1,
    positionId: 1,
    teamId: 1,
  });
  const [positions, setPositions] = useState<InnerDetails[]>([]);
  const [ROLES, setRoles] = useState<InnerDetails[]>([]);
  const [TEAMS, setTeams] = useState<InnerDetails[]>([]);
  const [leads, setLeads] = useState<User[]>([]);
  const [hrs, setHrs] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown visibility states
  const [dropdownStates, setDropdownStates] = useState({
    role: false,
    position: false,
    team: false,
    lead: false,
    hr: false,
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (mode === "edit" && editUser) {
        setFormData({
          id: editUser.id,
          userId: editUser.userId,
          name: editUser.name,
          email: editUser.email || "",
          roleId: editUser.role?.id || 1,
          positionId: editUser.position?.id || 1,
          teamId: editUser.Team?.id || 1,
          leadId: editUser.leadId || undefined,
          hrId: editUser.hrId || undefined,
        });
      } else {
        setFormData({
          userId: "",
          name: "",
          email: "",
          roleId: 1,
          positionId: 1,
          teamId: 1,
          leadId: undefined,
          hrId: undefined,
        });
      }
    }
  }, [isOpen, mode, editUser]);

  // Close dropdowns when modal closes
  useEffect(() => {
    if (!isOpen) {
      closeAllDropdowns();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [positionsRes, rolesRes, teamsRes, usersRes] = await Promise.all([
        positionService.getAllPositions(),
        roleService.getAllRoles(),
        teamService.getAllTeams(),
        userService.getAllUsers({}), // Get all users to filter leads and HRs
      ]);

      setPositions(positionsRes);
      setRoles(rolesRes);
      setTeams(teamsRes);

      // Filter users by role for lead and HR dropdowns
      const allUsers = usersRes || [];
      setLeads(allUsers.filter((user: User) => user.role?.name === "lead"));
      setHrs(allUsers.filter((user: User) => user.role?.name === "hr"));
    } catch (error) {
      toast({
        title: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof UserFormData,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleDropdown = (dropdown: keyof typeof dropdownStates) => {
    setDropdownStates((prev) => ({
      ...prev,
      [dropdown]: !prev[dropdown],
    }));
  };

  const closeAllDropdowns = () => {
    setDropdownStates({
      role: false,
      position: false,
      team: false,
      lead: false,
      hr: false,
    });
  };

  const handleSelectChange = (
    field: keyof UserFormData,
    value: string | number | undefined,
    dropdown: keyof typeof dropdownStates
  ) => {
    handleInputChange(field, value);
    setDropdownStates((prev) => ({
      ...prev,
      [dropdown]: false,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId.trim() || !formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "User ID and Name are required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === "add") {
        await userService.createUser(formData);
        toast({
          title: "Success",
          description: "User created successfully",
        });
      } else {
        await userService.updateUser(formData as typeof formData & { id: number });
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${mode} user`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={closeAllDropdowns}
      >
        {/* Modal Content */}
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === "add" ? "Add New Team Member" : "Edit Team Member"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="userId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    User ID *
                  </label>
                  <input
                    id="userId"
                    type="text"
                    value={formData.userId}
                    onChange={(e) =>
                      handleInputChange("userId", e.target.value)
                    }
                    placeholder="e.g., LMT20001"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Full Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter full name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="user@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Role Select */}
                <div className="space-y-2">
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Role
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown("role")}
                      className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                    >
                      <span className="text-gray-900">
                        {ROLES.find((role) => role.id === formData.roleId)
                          ?.name?.charAt(0)
                          .toUpperCase() +
                          ROLES.find(
                            (role) => role.id === formData.roleId
                          )?.name?.slice(1) || "Select role"}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          dropdownStates.role ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {dropdownStates.role && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {ROLES.map((role) => (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() =>
                              handleSelectChange("roleId", role.id, "role")
                            }
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            {role.name.charAt(0).toUpperCase() +
                              role.name.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Position Select */}
                <div className="space-y-2">
                  <label
                    htmlFor="position"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Position
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown("position")}
                      className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                    >
                      <span className="text-gray-900">
                        {positions.find(
                          (position) => position.id === formData.positionId
                        )?.name || "Select position"}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          dropdownStates.position ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {dropdownStates.position && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {isLoading ? (
                          <div className="px-3 py-2 text-gray-500">
                            Loading positions...
                          </div>
                        ) : (
                          positions.map((position) => (
                            <button
                              key={position.id}
                              type="button"
                              onClick={() =>
                                handleSelectChange(
                                  "positionId",
                                  position.id,
                                  "position"
                                )
                              }
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                              {position.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Select */}
              <div className="space-y-2">
                <label
                  htmlFor="team"
                  className="block text-sm font-medium text-gray-700"
                >
                  Team
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown("team")}
                    className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                  >
                    <span className="text-gray-900">
                      {TEAMS.find((team) => team.id === formData.teamId)
                        ?.name || "Select team"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform ${
                        dropdownStates.team ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {dropdownStates.team && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {TEAMS.map((team) => (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() =>
                            handleSelectChange("teamId", team.id, "team")
                          }
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          {team.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Team Lead Select */}
                <div className="space-y-2">
                  <label
                    htmlFor="lead"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Team Lead (Optional)
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown("lead")}
                      className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                    >
                      <span className="text-gray-900">
                        {formData.leadId
                          ? `${
                              leads.find((lead) => lead.id === formData.leadId)
                                ?.name
                            } (${
                              leads.find((lead) => lead.id === formData.leadId)
                                ?.userId
                            })`
                          : "Select team lead"}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          dropdownStates.lead ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {dropdownStates.lead && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectChange("leadId", undefined, "lead")
                          }
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          No Lead
                        </button>
                        {leads.map((lead) => (
                          <button
                            key={lead.id}
                            type="button"
                            onClick={() =>
                              handleSelectChange("leadId", lead.id, "lead")
                            }
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            {lead.name} ({lead.userId})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* HR Contact Select */}
                <div className="space-y-2">
                  <label
                    htmlFor="hr"
                    className="block text-sm font-medium text-gray-700"
                  >
                    HR Contact (Optional)
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown("hr")}
                      className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                    >
                      <span className="text-gray-900">
                        {formData.hrId
                          ? `${
                              hrs.find((hr) => hr.id === formData.hrId)?.name
                            } (${
                              hrs.find((hr) => hr.id === formData.hrId)?.userId
                            })`
                          : "Select HR contact"}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          dropdownStates.hr ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {dropdownStates.hr && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectChange("hrId", undefined, "hr")
                          }
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          No HR Contact
                        </button>
                        {hrs.map((hr) => (
                          <button
                            key={hr.id}
                            type="button"
                            onClick={() =>
                              handleSelectChange("hrId", hr.id, "hr")
                            }
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            {hr.name} ({hr.userId})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {mode === "add" ? "Add User" : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserManagementModal;
