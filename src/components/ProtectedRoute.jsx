import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const ProtectedRoute = ({
  children,
  requireVerification = false,
}) => {
  const { isAuthenticated, user } =
    useContext(AuthContext);

  const location = useLocation();

  const fullPath =
    location.pathname + location.search;

  // 🚀 Not authenticated
  if (!isAuthenticated) {
    toast.info("Please login to continue.", {
      toastId: "login-required",
    });

    return (
      <Navigate
        to={`/auth/login?continue=${encodeURIComponent(
          fullPath
        )}`}
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
    toast.warn(
      "Please verify your email before proceeding.",
      {
        toastId: "verify-required",
      }
    );

    return (
      <Navigate
        to={`/auth/confirm-email/?email=${user.email}&isVerified=false&next=${encodeURIComponent(
          fullPath
        )}`}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;