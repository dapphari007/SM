import React from "react";
import { Card, CardContent } from "../custom";
import RatingControl from "./RatingControl";
import  {AssessmentFormProps}  from "@/types/assessmentTypes";


const AssessmentForm = ({
  skillCategories,
  assessments,
  isSubmitting,
  handleSkillLevelChange,
}: AssessmentFormProps) => {
  return (
    <Card>
      <CardContent>
        <div className="w-full">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-1/3">
                    Skill Category
                  </th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-center">
                    Proficiency Level
                  </th>
                </tr>
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  {/* <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"></th> */}
                  {/* <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                      <div className="flex justify-center gap-8">
                        {proficiencyLevels.map((level) => (
                          <div key={level.value} className="text-center">
                            <div className="font-medium">{level.value}</div>
                            <div className="text-xs text-gray-500">
                              {level.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </th> */}
                </tr>
              </thead>
              {/* <tbody className="[&_tr:last-child]:border-0">
                  {skillCategories.map((skill) => (
                    <tr key={skill.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-medium">{skill.name}</td>
                      <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                        <div className="flex justify-center gap-8">
                          {proficiencyLevels.map((level) => (
                            <button
                              key={level.value}
                              onClick={() =>
                                handleSkillLevelChange(skill.id, level.value)
                              }
                              className={`
                                  w-8 h-8 rounded border-2 transition-all duration-200
                                  ${
                                    assessments[skill.id] === level.value
                                      ? `${level.color} border-current`
                                      : "bg-gray-50 hover:bg-gray-100 border-gray-300"
                                  }
                                  flex items-center justify-center font-medium
                                `}
                            >
                              {assessments[skill.id] === level.value
                                ? level.value
                                : ""}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody> */}
              <tbody className="[&_tr:last-child]:border-0">
                {skillCategories.map((skill) => (
                  <tr
                    key={skill.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-medium">
                      {skill.name}
                    </td>
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                      <div className="flex justify-center">
                        <RatingControl
                          value={assessments[skill.id] || 0}
                          onChange={(level) =>
                            handleSkillLevelChange(Number(skill.id), level)
                          }
                          disabled={isSubmitting}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Legend />
      </CardContent>
    </Card>
  );
};

const Legend = () => {
  return (
    <div className="flex flex-wrap gap-4 p-4 rounded-sm bg-gray-100 mt-4">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <div className="h-4 w-4 rounded-[50%] border bg-gray-200"></div>
        <span>- Not Rated</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <div className="h-4 w-4 rounded-[50%] border bg-red-200"></div>
        <span> ★ Low </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <div className="h-4 w-4 rounded-[50%] border bg-orange-200"></div>
        <span> ★★ Medium </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <div className="h-4 w-4 rounded-[50%] border bg-yellow-200"></div>
        <span> ★★★ Average </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <div className="h-4 w-4 rounded-[50%] border bg-green-200"></div>
        <span> ★★★★ High</span>
      </div>
    </div>
  );
};

export default AssessmentForm;
