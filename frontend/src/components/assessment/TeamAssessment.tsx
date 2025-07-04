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
} from "lucide-react";
import { userService, assessmentService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
//import UserManagementModal from "./UserManagementModal";
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
import{TeamMember,SkillScore,SkillModalData} from "../../types/teamTypes";
import { getAverageSkillLevel } from "@/utils/helper";
import { subMilliseconds } from "date-fns";
import { SkillAssessment } from "@/types/assessmentTypes";
import SkillAssessmentPage from "./SkillAssessmentPage";
import { Button } from "../ui/button";

const TeamAssessment=({onNavigate,}:{onNavigate:(tab:string,user:TeamMember)=>void;})=>{
    const {user}=useAuth();
    const [searchTerm,setSearchTerm]=useState("");
    const [teamMembers,setTeamMembers]=useState<TeamMember[]>([]);
    const [isLoading,setIsLoading]=useState(true);
    const [openDropdowns,setOpenDropdowns]=useState<{
        [key:string]:boolean;
    }>({});
    const [userModalMode,setUserModalMode]=useState<"add"|"edit">("add");
    const [usertoDelete,setUserToDelete]=useState<TeamMember | null>(null);
    const [showUserModal,setShowUserModal]=useState(false);
    const [editingUser,setEditingUser]=useState<TeamMember | null>(null);
    const [showSkillModal,setShowSkillModal]=useState(false);
    const [showDeleteModal,setShowDeleteModal]=useState(false);
    const [skillModalData,setSkillModalData]=useState<SkillModalData | null>(null);

    useEffect(()=>{
        fetchTeamData();
    },[user]);

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




    return(
        <div className=" ">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-1 py-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600"/>
                    <div>
                        <p className="text-sm text-gray-600">Total Members</p>
                        <p className="text-2xl font bold">{teamMembers.length}</p>
                    </div>
                    </div>
                </div>

                <div className='bg-whte rounded-lg border border-gray-200 shadow-sm'>
                    <div className="p-4 flex items-center gap-2">
                        <BarChart3 className="h-4 w-5 text-gree-600"/>
                        <div>
                            <p className="text-sm text-gray-600">With Assessment</p>
                            <p className="text-2xl font-bold text-green-600">{teamMembers.filter((m)=>m.hasRecentAssessment).length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600"/>
                        <div>
                            <p className="text-sm text-gray-600">Avg Sill level</p>
                            <p className="text-exl font-bold text-blue-600">
                                {teamMembers.length ? (
                                        teamMembers.reduce(
                                            (acc,m)=>acc+getAverageSkillLevel(m),0
                                        )/teamMembers.length
                                    ).toFixed(1):"0.0"
                                }
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-orange-600"/>
                        <div>
                            <p className="text-sm text-gray-600">No Assessment</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {teamMembers.filter((m)=>!m.hasRecentAssessment).length}
                            </p>
                        </div>
                    </div>
                </div>
                </div>
                {/* Searcch Bar*/}
                <div className="bg-white rounded-lg border border-gray-200 chadow-sm">
                    <div className="px-6 py-4">
                        <div className="flex flex-ccol sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Users className="h-5 w-5"/>
                                Team Members
                            </h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                <input
                                placeholder="Search members..."
                                className="pl-10 w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e)=>setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Members Cards */}
                {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                          <p className="text-lg text-gray-600">Loading team members...</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-6 py-6">
                          {filteredMembers.map((member) => (
                            <div
                              key={member.id}
                              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-shadow"
                            >
                              <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                      <User className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-lg">{member.name}</h3>
                                      <p className="text-sm text-gray-500">
                                        ID: {member.userId}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSkillLevelColor(
                                        getAverageSkillLevel(member)
                                      )}`}
                                    >
                                      {getAverageSkillLevel(member).toFixed(1)}/4
                                    </span>
                                    {user?.role?.name === "hr" && (
                                      <div className="relative">
                                        <button
                                          className="h-8 w-8 p-0 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleDropdown(member.id);
                                          }}
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </button>
                                        {openDropdowns[member.id] && (
                                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                            <div className="py-1">
                                              <button
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => {
                                                  handleEditUser(member);
                                                  setOpenDropdowns({});
                                                }}
                                              >
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                              </button>
                                              <button
                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                                onClick={() => {
                                                  handleDeleteUser(member);
                                                  setOpenDropdowns({});
                                                }}
                                              >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
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
                                  <div className="">
                                  <Button
                                    onClick={() => onNavigate("skill-assessment", member)}
                                    className="w-full"
                                    variant="outline"
                                  >
                                  Take Assessment
                                  </Button>
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
                          ))}
                        </div>
                      )}
            </div>
        
    )

}

export default TeamAssessment;
