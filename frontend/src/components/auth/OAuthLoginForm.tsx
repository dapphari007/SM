import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { loadStoredAuth } from "@/store/authSlice";
import { authService } from "@/services/api";

const OAuthLoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Load stored auth data on component mount
  useEffect(() => {
    dispatch(loadStoredAuth());
  }, [dispatch]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleMicrosoftLogin = () => {
    setIsRedirecting(true);
    // Redirect to backend OAuth endpoint
    authService.microsoftLogin();

  };

  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isRedirecting ? "Redirecting to Microsoft..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Custom Card Component */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          {/* Card Header */}
          <div className="text-center p-6 pb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Skill Matrix
            </h1>
            <p className="text-gray-600 text-sm">
              Access your professional development platform
            </p>
          </div>

          {/* Card Content */}
          <div className="p-6 pt-2">
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-600 text-sm">
                  Sign in with your Microsoft account to continue
                </p>
              </div>

              {/* Microsoft Login Button */}
              <button
                onClick={handleMicrosoftLogin}
                disabled={isRedirecting}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Microsoft Logo SVG */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 23 23"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                  <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
                  <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
                  <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
                </svg>
                {isRedirecting ? "Redirecting..." : "Continue with Microsoft"}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Secure authentication powered by Microsoft
                  </span>
                </div>
              </div>

              {/* Legacy Login Link */}
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-500">
                  Need to use legacy login?{" "}
                  <a
                    href="/legacy-login"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Click here
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthLoginForm;
