import { useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const ProtectedRoute = ({ children, requireVerification = false }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const location = useLocation();
  const [redirectPath, setRedirectPath] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.info("Please login to continue.");
      setRedirectPath(
        `/login?continue=${encodeURIComponent(location.pathname + location.search)}`
      );
    } else if (requireVerification && !user?.is_verified) {
      toast.warn("Please verify your email before proceeding.");
      setRedirectPath(`/temp-verify-email/?email=${user?.email}`);
    }
  }, [isAuthenticated, user, location, requireVerification]);

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
