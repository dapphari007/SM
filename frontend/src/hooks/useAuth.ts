/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  loginUser,
  logout as logoutAction,
  signupUser,
} from "@/store/authSlice";

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, isLoading } = useAppSelector(
    (state) => state.auth
  );

  const login = async (email: string, password: string) => {
    // eslint-disable-next-line no-useless-catch
    try {
      await dispatch(loginUser({ email, password })).unwrap();
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      await dispatch(signupUser({ email, password })).unwrap();
      return { success: true };
    } catch (error: any) {
      throw error || { success: false, error: error.message };
    }
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  return {
    user,
    token,
    login,
    signup,
    logout,
    isAuthenticated,
    isLoading,
  };
};
