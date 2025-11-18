import { useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const ProtectedRoute = ({ children, requireVerification = false }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const location = useLocation();
  const [redirectPath, setRedirectPath] = useState(null);
  
  // 🚀 Calculate the full path the user was trying to access
  const fullPath = location.pathname + location.search;
  console.log(fullPath)
  useEffect(() => {
    if (!isAuthenticated) {
    toast.info("Please login to continue.");
    // If not authenticated, redirect to login, passing the full path as 'continue'
    setRedirectPath(
    `/auth/login?continue=${encodeURIComponent(fullPath)}`
    );
    } 
    else if (requireVerification && requireVerification && user && user.email && user?.is_verified === false) {
      console.log(requireVerification, user.is_verified)
      toast.warn("Please verify your email before proceeding.");
      
      // 🚀 CRITICAL FIX: Redirect unverified user to temp-verify-email,
      // and pass the intended destination path as the 'next' parameter.
      setRedirectPath(
              `/auth/confirm-email/?email=${user?.email}&isVerified=false&next=${encodeURIComponent(fullPath)}`
            );
    }
  }, [isAuthenticated, user, location, requireVerification, fullPath]); // fullPath dependency added for completeness

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

 return children;
};

export default ProtectedRoute;