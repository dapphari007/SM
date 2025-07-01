import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {SkillMatrixData,Skill} from "../types/matrixTypes";
  const getRoleColor = (role: string) => {
    switch (role) {
      case "hr":
        return "bg-purple-100 text-purple-800";
      case "lead":
        return "bg-blue-100 text-blue-800";
      case "employee":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "hr":
        return "HR";
      case "lead":
        return "Team Lead";
      case "employee":
        return "Employee";
      default:
        return role;
    }
  };
  
  const getSkillScore = (
    employee: SkillMatrixData,
    skillId: number
  ): number => {
    const skillScore = employee.mostRecentAssessmentScores.find(
      (score) => score.skillId === skillId
    );
    return skillScore ? skillScore.Score : 0;
  };

  // Helper function to calculate average skill level for an employee
  const getAverageSkillLevel = (employee: SkillMatrixData): number => {
    if (!employee || !employee.mostRecentAssessmentScores || employee.mostRecentAssessmentScores.length === 0) return 0;
    const total = employee.mostRecentAssessmentScores.reduce(
      (sum, score) => sum + score.Score,
      0
    );
    return total / employee.mostRecentAssessmentScores.length;
  };

  const exportPDF = ( filteredData: SkillMatrixData[], relevantSkills:Skill[], searchTerm:string, isHR:boolean, isLead:boolean, selectedTeam:string, selectedPosition:string ) => {
      const doc = new jsPDF("l", "mm", "a4"); 
  
      // Add title
      doc.setFontSize(20);
      doc.text("Skill Matrix Report", 14, 22);
  
      // Add filters info
      doc.setFontSize(12);
      let yPosition = 35;
  
      if (isHR) {
        doc.text(
          `Team: ${selectedTeam === "all" ? "All Teams" : selectedTeam}`,
          14,
          yPosition
        );
        yPosition += 7;
        doc.text(
          `Position: ${
            selectedPosition
          }`,
          14,
          yPosition
        );
        yPosition += 7;
      } else if (isLead) {
        doc.text(
          `Position: ${
            selectedPosition === selectedPosition
          }`,
          14,
          yPosition
        );
        yPosition += 7;
      }
  
      if (searchTerm) {
        doc.text(`Search: ${searchTerm}`, 14, yPosition);
        yPosition += 7;
      }
  
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, yPosition);
      yPosition += 10;
  
      // Prepare table data
      const tableColumns = [
        "Employee",
        "Team",
        "Position",
        "Role",
        ...relevantSkills.map((skill) => skill.name),
        "Average",
      ];
  
      const tableRows = filteredData.map((employee) => {
        const avgSkill = getAverageSkillLevel(employee);
        return [
          employee.name,
          employee.Team?.name || "N/A",
          employee.position?.name || "N/A",
          employee.role?.name || "N/A",
          ...relevantSkills.map((skill) => {
            const score = getSkillScore(employee, skill.id);
            return score === 0 ? "N/A" : score;
          }),
          avgSkill.toFixed(1),
        ];
      });
  
      // Add table
      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: yPosition,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: "bold",
        },
        didParseCell: function (data) {
          // Color code skill levels
          if (
            data.section === "body" &&
            data.column.index >= 4 &&
            data.column.index < tableColumns.length - 1
          ) {
            const cellValue = data.cell.text[0];
            if (cellValue !== "N/A") {
              const level = parseInt(cellValue);
              switch (level) {
                case 1:
                  data.cell.styles.fillColor = [254, 226, 226]; // red-100
                  break;
                case 2:
                  data.cell.styles.fillColor = [254, 215, 170]; // orange-100
                  break;
                case 3:
                  data.cell.styles.fillColor = [254, 243, 199]; // yellow-100
                  break;
                case 4:
                  data.cell.styles.fillColor = [220, 252, 231]; // green-100
                  break;
              }
            }
          }
        },
        margin: { top: 10, right: 14, bottom: 10, left: 14 },
      });
  
      // Save the PDF
      const fileName = `skill-matrix-${
        selectedTeam !== "all" ? selectedTeam + "-" : ""
      }${selectedPosition !== "all" ? selectedPosition + "-" : ""}${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);
    };

    const getSkillLevelColor = (level: number) => {
    if (level === 0) return "bg-gray-100 text-gray-500 border border-gray-300";
    if (level === 1) return "bg-red-400 text-red-700 border border-red-500";
    if (level === 2) return "bg-orange-300 text-orange-700 border border-orange-500";
    if (level === 3) return "bg-yellow-300 text-yellow-700 border border-yellow-500";
    if (level === 4) return "bg-green-300 text-green-700 border border-green-500";
    return "bg-gray-100 text-gray-600";
  };

    export { getRoleColor, getRoleDisplayName, exportPDF, getSkillScore, getAverageSkillLevel, getSkillLevelColor };