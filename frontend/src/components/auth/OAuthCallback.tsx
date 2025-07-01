import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import { setAuthData } from "@/store/authSlice";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get("token");
        const error = searchParams.get("error");

        if (error) {
          setError(decodeURIComponent(error));
          setStatus("error");
          return;
        }

        if (!token) {
          setError("No authentication token received");
          setStatus("error");
          return;
        }

        // Decode the JWT token to get user info (basic decoding, not verification)
        const tokenParts = token.split(".");
        if (tokenParts.length !== 3) {
          setError("Invalid token format");
          setStatus("error");
          return;
        }

        const payload = JSON.parse(atob(tokenParts[1]));
        console.log(payload);
        // Create user object matching the User interface from authSlice
        const user = payload;

        // const user = await userService.getProfile(userDetails.id);

        // Store auth data in Redux and localStorage
        dispatch(setAuthData({ token, user }));

        setStatus("success");

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1500);
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError("Failed to process authentication");
        setStatus("error");
      }
    };

    handleCallback();
  }, [searchParams, navigate, dispatch]);

  if (status === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Processing Authentication
          </h2>
          <p className="text-gray-600">
            Please wait while we complete your login...
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Login Successful!
          </h2>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Authentication Failed
        </h2>
        <p className="text-gray-600 mb-4">
          {error || "An error occurred during authentication"}
        </p>
        <button
          onClick={() => navigate("/login", { replace: true })}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default OAuthCallback;
