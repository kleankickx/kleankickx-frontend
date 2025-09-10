// // src/context/AuthProvider.jsx
// import React, { createContext, useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { jwtDecode } from 'jwt-decode';
// import { toast } from 'react-toastify';
// import { createApiClient } from '../api';
// import axios from 'axios';

// export const AuthContext = createContext();

// const AuthProvider = ({ children }) => {
//   const navigate = useNavigate();
//   // Base URL for backend API
//   const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

//   const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token'));
//   const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token'));
//   const [user, setUser] = useState({});
//   const [isAuthenticated, setIsAuthenticated] = useState(!!accessToken);

//   // Decode access token
//   const decodeToken = (token) => {
//     try {
//       const decoded = jwtDecode(token);

//       return {
//         email: decoded.email || '',
//         first_name: decoded.first_name || '',
//         last_name: decoded.last_name || '',
//         is_verified: decoded.is_verified || false,
//       };
//     } catch (err) {
//       console.error('Failed to decode token:', err);
//       return null;
//     }
//   };

//   // Restore auth state on page load
//   useEffect(() => {
//     const storedAccess = localStorage.getItem('access_token');
//     const storedRefresh = localStorage.getItem('refresh_token');
//     if (storedAccess && storedRefresh) {
//       const decodedUser = decodeToken(storedAccess);
      
//       if (decodedUser) {
//         console.log("Decoded:", decodedUser)
//         setAccessToken(storedAccess);
//         setRefreshToken(storedRefresh);
//         setUser(decodedUser);
//         setIsAuthenticated(true);
//       } else {
//         {/* check if user is on checkout page logout*/}
        

//       }
//     } else {
//       {/* do something */}
//     }
//   }, []);

//   // Helpers to sync state and storage
//   const persistToken = (key, value) => {
//     if (value) localStorage.setItem(key, value);
//     else localStorage.removeItem(key);
//   };

//   const authMethods = {
//     accessToken,
//     refreshToken,
//     setAccessToken: (token) => {
//       setAccessToken(token);
//       persistToken('access_token', token);
//     },
//     setRefreshToken: (token) => {
//       setRefreshToken(token);
//       persistToken('refresh_token', token);
//     },
//     logout: () => {
//       setAccessToken(null);
//       setRefreshToken(null);
//       setUser(null);
//       setIsAuthenticated(false);
//       persistToken('access_token', null);
//       persistToken('refresh_token', null);
//       navigate('/login');
//     },
//   };

//   // Create authenticated Axios instance
//   const api = createApiClient(authMethods);

//   // Login
//   const login = async (email, password) => {
//     try {
//       const response = await axios.post(`${baseURL}/api/users/login/`, { email, password });
//       const { access, refresh } = response.data;

//       authMethods.setAccessToken(access);
//       authMethods.setRefreshToken(refresh);

//       const decoded = decodeToken(access);
//       if (!decoded) throw new Error('Invalid access token');
//       setUser(decoded);
//       setIsAuthenticated(true);
//     } catch (err) {
//       toast.error('Login failed. Please check your credentials.');
//       throw err;
//     }
//   };

//   // Google Login
//   const googleLogin = async (credentialResponse) => {
//     try {
//       const response = await api.post(
//         '/api/users/google-login/',
//         { token: credentialResponse.credential },
//         { withCredentials: true }
//       );

//       const { access, refresh } = response.data;
//       authMethods.setAccessToken(access);
//       authMethods.setRefreshToken(refresh);

//       const decoded = decodeToken(access);
//       if (!decoded) throw new Error('Invalid access token');
//       setUser(decoded);
//       setIsAuthenticated(true);
//     } catch (err) {
//       toast.error('Google login failed. Please try again.');
//       throw err;
//     }
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         isAuthenticated,
//         user,
//         accessToken,
//         refreshToken,
//         login,
//         logout: authMethods.logout,
//         googleLogin,
//         setAccessToken: authMethods.setAccessToken,
//         setRefreshToken: authMethods.setRefreshToken,
//         api,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export default AuthProvider;


// src/context/AuthProvider.jsx
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { createApiClient } from '../api';
import axios from 'axios';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

  const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token'));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!accessToken);
  const [discounts, setDiscounts] = useState([]);

  const decodeToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      return {
        email: decoded.email || '',
        first_name: decoded.first_name || '',
        last_name: decoded.last_name || '',
        is_verified: decoded.is_verified || false,
        signup_discount_used: decoded.signup_discount_used || false,
      };
    } catch (err) {
      console.error('Failed to decode token:', err);
      return null;
    }
  };


  const fetchDiscounts = async () => {
    try {
      const discountData = await api.get('/api/discounts/');
      setDiscounts(discountData.data);
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
    }
  };

  // FIXED: Load auth state from storage but don't force navigation
  useEffect(() => {
    const storedAccess = localStorage.getItem('access_token');
    const storedRefresh = localStorage.getItem('refresh_token');

    if (storedAccess && storedRefresh) {
      const decodedUser = decodeToken(storedAccess);
      console.log(decodedUser)
      if (decodedUser) {
        setAccessToken(storedAccess);
        setRefreshToken(storedRefresh);
        setUser(decodedUser);
        setIsAuthenticated(true);
       
        
      } else {
        clearAuth();
      }
    } else {
      clearAuth();
    }
  }, []);

  // fetch discounts on component mount
  useEffect(() => {
    fetchDiscounts();
  }, []);


  const persistToken = (key, value) => {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  };

  const clearAuth = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
    persistToken('access_token', null);
    persistToken('refresh_token', null);
  };

  const authMethods = {
    accessToken,
    refreshToken,
    setAccessToken: (token) => {
      setAccessToken(token);
      persistToken('access_token', token);
    },
    setRefreshToken: (token) => {
      setRefreshToken(token);
      persistToken('refresh_token', token);
    },
    logout: () => {
      clearAuth();
      navigate('/login');
    },
  };

  const api = createApiClient(authMethods);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${baseURL}/api/users/login/`, { email, password });
      const { access, refresh } = response.data;

      authMethods.setAccessToken(access);
      authMethods.setRefreshToken(refresh);

      const decoded = decodeToken(access);
      if (!decoded) throw new Error('Invalid access token');

      setUser(decoded);
      setIsAuthenticated(true);
    } catch (err) {
      toast.error('Login failed. Please check your credentials.');
      throw err;
    }
  };

  const googleLogin = async (credentialResponse,  referralCode = null) => {
    try {
      const payload = { token: credentialResponse.credential };
      if (referralCode) payload.referral_code = referralCode; // ✅ send referral
      
      const response = await api.post('/api/users/google-login/', payload, { withCredentials: true });

      const { access, refresh } = response.data;
      authMethods.setAccessToken(access);
      authMethods.setRefreshToken(refresh);

      const decoded = decodeToken(access);
      console.log("Decoded", decoded)
      if (!decoded) throw new Error('Invalid access token');

      setUser(decoded);
      setIsAuthenticated(true);
    } catch (err) {
      toast.error('Google login failed. Please try again.');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        accessToken,
        refreshToken,
        login,
        logout: authMethods.logout,
        googleLogin,
        setAccessToken: authMethods.setAccessToken,
        setRefreshToken: authMethods.setRefreshToken,
        api,
        discounts,
        
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
