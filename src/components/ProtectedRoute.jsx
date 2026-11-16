// src/components/ProtectedRoute.jsx
import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import AppLoader from './AppLoader';

// Loading component for protected routes
const RouteLoadingSpinner = () => <AppLoader label="Checking your account" />;
const ProtectedRoute = ({
  children,
  requireVerification = false,
}) => {
  const { isAuthenticated, user, authLoading } = useContext(AuthContext);
  const location = useLocation();

  const fullPath = location.pathname + location.search;

  // Show loading state while checking authentication
  if (authLoading) {
    return <RouteLoadingSpinner />;
  }

  // 🚀 Not authenticated
  if (!isAuthenticated) {
    // Don't show toast on every redirect, only once
    const toastId = "login-required-protected";
    if (!toast.isActive(toastId)) {
      toast.info("Please login to continue.", {
        toastId: toastId,
      });
    }

    return (
      <Navigate
        to={`/auth/login?continue=${encodeURIComponent(fullPath)}`}
        replace
      />
    );
  }

  // 🚀 Email verification required
  if (
    requireVerification &&
    user?.email &&
    user?.is_verified === false
  ) {
    const toastId = "verify-required";
    if (!toast.isActive(toastId)) {
      toast.warn("Please verify your email before proceeding.", {
        toastId: toastId,
      });
    }

    return (
      <Navigate
        to={`/auth/confirm-email/?email=${user.email}&isVerified=false&next=${encodeURIComponent(fullPath)}`}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;