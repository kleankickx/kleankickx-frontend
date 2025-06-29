import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  const continuePath = encodeURIComponent(location.pathname + location.search);

  return isAuthenticated
    ? children
    : <Navigate to={`/login?continue=${continuePath}`} replace />;
};

export default ProtectedRoute;
