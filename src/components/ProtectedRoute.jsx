import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const location = useLocation();
  const continuePath = encodeURIComponent(location.pathname + location.search);
  console.log(user)
  if (!isAuthenticated) {
    toast.info('Please login to continue.');
    return <Navigate to={`/login?continue=${continuePath}`} replace />;
  }

  // if (!user?.is_verified) {
  //   toast.warn('Please verify your email before proceeding.');
  //   return <Navigate to={`/temp-verify-email/?email=${user?.email}`} replace />;
  // }

  return children;
};

export default ProtectedRoute;
