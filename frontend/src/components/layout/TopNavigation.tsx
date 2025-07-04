import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  Users,
  Target,
  Grid3X3,
  TrendingUp,
  User,
  ClipboardCheck,
  Menu,
  X,
} from "lucide-react";
import { userService } from "@/services/api";
import { UserInfo } from "os";

interface TopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TopNavigation = ({ activeTab, onTabChange }: TopNavigationProps) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const profileData = await userService.getProfile();
      setUserProfile(profileData);
    };
    fetchData();
  }, []);

  const getMenuItems = () => {
    const baseItems = [
      { id: "dashboard", label: "Dashboard", icon: BarChart3 },
      { id: "skill-criteria", label: "Skill Criteria", icon: Target },
      { id: "skill-upgrade", label: "Upgrade Guide", icon: TrendingUp }
    ];

    if (user?.role?.name === "hr" || user?.role?.name === "lead") {
      baseItems.splice(
        2,
        0,
        { id: "team-overview", label: "Team Overview", icon: Users },
        { id: "skill-matrix", label: "Skill Matrix", icon: Grid3X3 },
        {id:"team-assessment", label:"Team Assessment",icon:Grid3X3},
        //To display the Pending reviews
        // {
        //   id: "pending-assessments",
        //   label: "Pending Reviews",
        //   icon: ClipboardCheck,
        // }
      );
    }
    //To display the Assessment 
    // if(user?.role?.name==="lead"){
    //   baseItems.splice(
    //     2,0,
    //     {id:"skill-assessment",label:"Assessment",icon:Grid3X3}
    //   );
    // }

    return baseItems;
  };


  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Skill Matrix
            </h1>

            {/* Desktop Navigation */}
            <div className="hidden md:block ml-8">
              <nav className="flex space-x-1">
                {getMenuItems().map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "default" : "ghost"}
                      className={cn(
                        "flex items-center whitespace-nowrap",
                        activeTab === item.id &&
                          "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      )}
                      onClick={() => onTabChange(item.id)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Right side - User menu and mobile hamburger */}
          <div className="flex items-center space-x-4">
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {userProfile?.profilePhoto ? (
                        <img src={userProfile.profilePhoto} alt="Profile" />
                      ) : (
                        user?.name?.charAt(0) || "U"
                      )}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || "User"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onTabChange("profile")}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Hamburger Menu */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
                        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {getMenuItems().map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start flex items-center",
                      activeTab === item.id &&
                        "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    )}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default TopNavigation;
