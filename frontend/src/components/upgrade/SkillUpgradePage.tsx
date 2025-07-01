import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/custom/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  TrendingUp,
  BookOpen,
  ExternalLink,
  Star,
  PlusCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import {
  userService,
  skillUpgradeService,
  skillService,
  assessmentService,
} from "@/services/api";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Resource,LearningPath,Skill,UpgradeGuide} from "../../types/upgradeTypes";

const SKILL_LEVELS = [
  { value: 1, label: "Low", color: "bg-red-100 text-red-800" },
  { value: 2, label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: 3, label: "Average", color: "bg-blue-100 text-blue-800" },
  { value: 4, label: "High", color: "bg-green-100 text-green-800" },
];

const SkillUpgradePage = () => {
  const { user } = useAuth();
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add Learning Path state
  const [showAddPath, setShowAddPath] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");
  const [targetLevel, setTargetLevel] = useState<string>("");
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [upgradeGuide, setUpgradeGuide] = useState<UpgradeGuide | null>(null);
  const [addPathLoading, setAddPathLoading] = useState(false);
  const [addPathError, setAddPathError] = useState<string | null>(null);

  useEffect(() => {
    fetchSkills();
  }, [user]);

  // Fetch skills for both initial load and add path section
  const fetchSkills = async (isAddPath = false) => {
    try {
      if (isAddPath) {
        setAddPathLoading(true);
      } else {
        setIsLoading(true);
      }

      // Get all skills
      const skillsData = await skillService.getSkillsByPosition();

      // Get user profile to get current skill levels
      const profileData = await assessmentService.getUserLatestApprovedScores();
      if(!profileData.data.length) {
        toast.warning("No skills found for the user. Please ensure you have completed an assessment.");
      }
      const userSkills = profileData.data || [];

      // Map skills with current levels
      const mappedSkills = skillsData.map((skill: any) => {
        const userSkill = userSkills.find(
          (us: any) => us.skill_id === skill.id
        );
        return {
          id: skill.id,
          name: skill.name,
          level: userSkill ? userSkill.lead_score : 0,
        };
      });

      setSkills(mappedSkills);
    } catch (err) {
      console.error("Failed to fetch skills:", err);
      if (isAddPath) {
        setAddPathError("Failed to load skills. Please try again.");
      } else {
        toast.error("Failed to load skills. Please try again.")
      }
    } finally {
      if (isAddPath) {
        setAddPathLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  // Update current level when skill selection changes
  useEffect(() => {
    if (selectedSkillId) {
      const selectedSkill = skills.find(
        (skill) => skill.id === selectedSkillId
      );
      if (selectedSkill) {
        setCurrentLevel(selectedSkill.level || 0);
      }
    }
  }, [selectedSkillId, skills]);

  // Fetch upgrade guide when skill and target level are selected
  useEffect(() => {
    const fetchUpgradeGuide = async () => {
      if (!selectedSkillId || !targetLevel || currentLevel === 0) return;

      const targetLevelNum = parseInt(targetLevel);
      if (targetLevelNum <= currentLevel) {
        setAddPathError("Target level must be higher than your current level");
        setUpgradeGuide(null);
        return;
      }

      try {
        setAddPathLoading(true);
        setAddPathError(null);

        const guideData = await skillUpgradeService.getGuide({
          skillId: selectedSkillId,
          currentLevel: currentLevel,
          targetLevel: targetLevelNum,
        });

        setUpgradeGuide(guideData);
      } catch (err) {
        console.error("Failed to fetch upgrade guide:", err);
        setAddPathError(
          "No upgrade guide found for this skill and level combination"
        );
        setUpgradeGuide(null);
      } finally {
        setAddPathLoading(false);
      }
    };

    fetchUpgradeGuide();
  }, [selectedSkillId, targetLevel, currentLevel]);

  const handleAddPath = () => {
    if (!selectedSkillId || !targetLevel || !upgradeGuide) {
      setAddPathError("Please select a skill and target level");
      return;
    }

    const targetLevelNum = parseInt(targetLevel);
    const selectedSkill = skills.find((skill) => skill.id === selectedSkillId);

    if (!selectedSkill) {
      setAddPathError("Invalid skill selection");
      return;
    }

    // Determine priority based on level gap
    let priority: "High" | "Medium" | "Low" = "Low";
    const gap = targetLevelNum - currentLevel;
    if (gap >= 3) priority = "High";
    else if (gap >= 2) priority = "Medium";

    // Create learning path object
    const newPath: LearningPath = {
      id:
        upgradeGuide.id ||
        `${selectedSkillId}-${currentLevel}-${targetLevelNum}`,
      skillId: selectedSkillId,
      skillName: selectedSkill.name,
      currentLevel: currentLevel,
      targetLevel: targetLevelNum,
      priority: priority,
      resources: upgradeGuide.resourceLink
        ? [
            {
              id: `resource-${Date.now()}`,
              title: "Recommended Resource",
              type: "Documentation" as const,
              url: upgradeGuide.resourceLink,
            },
          ]
        : [],
      guidance: upgradeGuide.guidance,
    };

    // Add the new path to the existing paths
    setLearningPaths((prevPaths) => {
      // Check if path already exists
      const existingPathIndex = prevPaths.findIndex(
        (path) =>
          path.skillId === newPath.skillId &&
          path.currentLevel === newPath.currentLevel &&
          path.targetLevel === newPath.targetLevel
      );

      if (existingPathIndex >= 0) {
        // Replace existing path
        const updatedPaths = [...prevPaths];
        updatedPaths[existingPathIndex] = newPath;
        return updatedPaths;
      } else {
        // Add new path
        return [...prevPaths, newPath];
      }
    });

    // Select the new path
    setSelectedPath(newPath.id);

    toast.success("Learning path for ${newPath.skillName} has been added successfully.");

    // Reset the form
    resetAddPathForm();
  };

  const resetAddPathForm = () => {
    setSelectedSkillId("");
    setTargetLevel("");
    setCurrentLevel(0);
    setUpgradeGuide(null);
    setAddPathError(null);
    setShowAddPath(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getResourceTypeIcon = (type: Resource["type"]) => {
    switch (type) {
      case "Course":
        return <TrendingUp />;
      case "Documentation":
        return <BookOpen />;
      case "Tutorial":
        return <ExternalLink />;
      case "Book":
        return <Star />;
      default:
        return null;
    }
  };

  const getLevelLabel = (level: number) => {
    return (
      SKILL_LEVELS.find((l) => l.value === level)?.label || `Level ${level}`
    );
  };

  const getLevelColor = (level: number) => {
    return (
      SKILL_LEVELS.find((l) => l.value === level)?.color ||
      "bg-gray-100 text-gray-800"
    );
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Skill Upgrade Guide</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              setShowAddPath(!showAddPath);
              if (!showAddPath) {
                fetchSkills(true);
              }
            }}
          >
            {showAddPath ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <PlusCircle className="h-4 w-4" />
            )}
            {showAddPath ? "Hide Form" : "Add Learning Path"}
          </Button>
        </div>
      </div>

      {/* Add Learning Path Form */}
      {showAddPath && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex justify-between items-center">
              <span>Add New Learning Path</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={resetAddPathForm}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {addPathError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm mb-4">
                {addPathError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="skill">Skill</Label>
                <Select
                  value={selectedSkillId}
                  onValueChange={setSelectedSkillId}
                  disabled={addPathLoading}
                >
                  <SelectTrigger id="skill">
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {skills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name}{" "}
                        {skill.level ? `(Current: Level ${skill.level})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSkillId && (
                <div className="space-y-2">
                  <Label htmlFor="targetLevel">Target Level</Label>
                  <Select
                    value={targetLevel}
                    onValueChange={setTargetLevel}
                    disabled={addPathLoading || currentLevel === 0}
                  >
                    <SelectTrigger id="targetLevel">
                      <SelectValue placeholder="Select target level" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVELS.filter(
                        (level) => level.value > currentLevel
                      ).map((level) => (
                        <SelectItem
                          key={level.value}
                          value={level.value.toString()}
                        >
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentLevel > 0 && (
                    <p className="text-sm text-gray-500">
                      Your current level: {getLevelLabel(currentLevel)}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <Button
                onClick={handleAddPath}
                disabled={
                  addPathLoading ||
                  !selectedSkillId ||
                  !targetLevel ||
                  !upgradeGuide
                }
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Add Learning Path
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Learning Paths</h2>
          {learningPaths.length > 0 ? (
            learningPaths.map((path) => (
              <Card
                key={path.id}
                className={`cursor-pointer transition-all ${
                  selectedPath === path.id
                    ? "ring-2 ring-blue-500"
                    : "hover:shadow-md"
                }`}
              >
                <div onClick={() =>
                    setSelectedPath(selectedPath === path.id ? null : path.id)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {path.skillName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Level {path.currentLevel} → {path.targetLevel}
                      </p>
                    </div>
                    <Badge className={getPriorityColor(path.priority)}>
                      {path.priority}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>
                        {Math.round(
                          (path.currentLevel / path.targetLevel) * 100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={(path.currentLevel / path.targetLevel) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="flex justify-between items-center mt-3 text-sm text-gray-600">
                    <div>{path.resources.length} resources</div>
                  </div>
                </CardContent>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 mb-4">
                  No learning paths available. Add a learning path to get
                  started.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddPath(true);
                    fetchSkills(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Learning Path
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Learning Path Details</h2>
          {selectedPath ? (
            (() => {
              const path = learningPaths.find((p) => p.id === selectedPath);
              if (!path) {
                return (
                  <p className="text-gray-600">
                    No details available for this path.
                  </p>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Guidance Card */}
                  {path.guidance && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Upgrade Guidance
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-gray-700">{path.guidance}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Resources Section */}
                  <div className="space-y-3">
                    <h3 className="text-base font-medium">Resources</h3>
                    {path.resources && path.resources.length > 0 ? (
                      path.resources.map((resource) => (
                        <Card
                          key={resource.id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-start gap-2">
                                <span className="text-lg">
                                  {getResourceTypeIcon(resource.type)}
                                </span>
                                <div>
                                  <h4 className="font-medium">
                                    {resource.title}
                                  </h4>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                              <strong> Resource link: </strong><a href={resource.url} className="underline" > {resource.url} level</a>
                              <Button
                                variant="link"
                                onClick={() =>
                                  window.open(resource.url, "_blank")
                                }
                              >
                                Open
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-gray-600">
                        No resources available for this path.
                      </p>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <p className="text-gray-600">
              Select a learning path to view details.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillUpgradePage;
