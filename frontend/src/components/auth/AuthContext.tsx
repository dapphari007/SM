import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, userService } from '@/services/api';
import {jwtDecode} from "jwt-decode";
import {Card,CardContent,} from "@/components/custom";
import {BarChart3,Users,TrendingUp,User,} from "lucide-react";
import { getAverageSkillLevel } from '@/utils/helper';

interface User {
  iat: number;
  id: string;
  role: 'employee' | 'lead' | 'hr';
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{success:boolean;error?:string}>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const {token,user} = await authService.login(email, password);
      const userDetails = jwtDecode(token);
      const userData = JSON.stringify(userDetails);
      setToken(token);
      setUser(JSON.parse(userData));
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string):Promise<{success:boolean;error?:string}> => {
    try {
      await authService.signup(email, password);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  };

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


{/* Statistics Cards */}
      // <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      //   <Card>
      //     <CardContent className="p-4 flex items-center gap-2">
      //       <Users className="h-5 w-5 text-blue-600" />
      //       <div>
      //         <p className="text-sm text-gray-600">Total Members</p>
      //         <p className="text-2xl font-bold">{teamMembers.length}</p>
      //       </div>
      //     </CardContent>
      //   </Card>

      //   <Card>
      //     <CardContent className="p-4 flex items-center gap-2">
      //       <BarChart3 className="h-5 w-5 text-green-600" />
      //       <div>
      //         <p className="text-sm text-gray-600">With Assessments</p>
      //         <p className="text-2xl font-bold text-green-600">
      //           {teamMembers.filter((m) => m.hasRecentAssessment).length}
      //         </p>
      //       </div>
      //     </CardContent>
      //   </Card>

      //   <Card>
      //     <CardContent className="p-4 flex items-center gap-2">
      //       <TrendingUp className="h-5 w-5 text-blue-600" />
      //       <div>
      //         <p className="text-sm text-gray-600">Avg Skill Level</p>
      //         <p className="text-2xl font-bold text-blue-600">
      //           {teamMembers.length
      //             ? (
      //                 teamMembers.reduce(
      //                   (acc, m) => acc + getAverageSkillLevel(m),
      //                   0
      //                 ) / teamMembers.length
      //               ).toFixed(1)
      //             : "0.0"}
      //         </p>
      //       </div>
      //     </CardContent>
      //   </Card>

      //   <Card>
      //     <CardContent className="p-4 flex items-center gap-2">
      //       <Users className="h-5 w-5 text-orange-600" />
      //       <div>
      //         <p className="text-sm text-gray-600">No Assessment</p>
      //         <p className="text-2xl font-bold text-orange-600">
      //           {teamMembers.filter((m) => !m.hasRecentAssessment).length}
      //         </p>
      //       </div>
      //     </CardContent>
      //   </Card>
      // </div>