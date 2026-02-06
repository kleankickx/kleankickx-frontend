// src/context/AuthProvider.jsx
import React, { createContext, useState, useEffect,useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { createApiClient } from '../api';
import axios from 'axios';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:10000';

  const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token'));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!accessToken);
  const [discounts, setDiscounts] = useState([]);

  // In your AuthProvider.jsx, update the decodeToken function:
  const decodeToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      console.log("Decoded token:", decoded);
      return {
        email: decoded.email || '',
        first_name: decoded.first_name || '',
        last_name: decoded.last_name || '',
        is_verified: decoded.is_verified || false,
        signup_discount_used: decoded.signup_discount_used || false,
        phone_number: decoded.phone_number || '',
        free_signup_service_used: decoded.free_signup_service_used_id ? {
          id: decoded.free_signup_service_used_id,
          claimed_at: decoded.free_service_used_at || null
        } : null,
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
      console.log("Initial decoded user:", decodedUser);
      if (decodedUser) {
        setAccessToken(storedAccess);
        setRefreshToken(storedRefresh);
        setUser(decodedUser);
        setIsAuthenticated(true);
        
        // Also refresh user data from backend to get latest free_signup_service_used
        // We'll do this after the API is set up
      } else {
        clearAuth();
      }
    } else {
      clearAuth();
    }
  }, []);

  // fetch discounts on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchDiscounts();
    }
  }, [isAuthenticated]);

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

  // 🚀 NEW METHOD: Directly set tokens from the verification success call
  const updateTokens = (access, refresh) => {
    authMethods.setAccessToken(access);
    authMethods.setRefreshToken(refresh);

    const decoded = decodeToken(access);
    if (!decoded) throw new Error('Invalid access token');

    setUser(decoded);
    setIsAuthenticated(true);
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
      navigate('/auth/login');
    },
  };

  const api = createApiClient(authMethods);

  // Function to refresh user data from backend
  const refreshUserData = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      const response = await api.get('/api/users/profile/');
      console.log("Refreshed user data:", response.data);
      
      // Update user state with backend data
      setUser(prev => ({
        ...prev,
        ...response.data,
        free_signup_service_used: response.data.free_signup_service_used || null
      }));
      
      return response.data;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, [accessToken, api]); 

  // Updated login function to return user data
  const login = async (email, password) => {
    try {
      const response = await api.post('/api/users/login/', { email, password });
      const { access, refresh, user: userData } = response.data;

      authMethods.setAccessToken(access);
      authMethods.setRefreshToken(refresh);

      // Decode token first
      const decoded = decodeToken(access);
      if (!decoded) throw new Error('Invalid access token');

      // Combine decoded data with backend user data if available
      const fullUserData = {
        ...decoded,
        ...userData, // This should include free_signup_service_used from backend
      };

      setUser(fullUserData);
      setIsAuthenticated(true);
      
      // Return the full user data so Login component can use it
      return fullUserData;
    } catch (err) {
      toast.error('Login failed. Please check your credentials.');
      throw err;
    }
  };

  // Updated googleLogin function to return user data
  const googleLogin = async (credentialResponse, referralCode = null) => {
    try {
      const payload = { token: credentialResponse.credential };
      if (referralCode) payload.referral_code = referralCode;
      
      const response = await api.post('/api/users/google-login/', payload, { withCredentials: true });

      const { access, refresh, user: userData } = response.data;
      authMethods.setAccessToken(access);
      authMethods.setRefreshToken(refresh);

      // Decode token first
      const decoded = decodeToken(access);
      console.log("Decoded Google user:", decoded);
      if (!decoded) throw new Error('Invalid access token');

      // Combine decoded data with backend user data if available
      const fullUserData = {
        ...decoded,
        ...userData, // This should include free_signup_service_used from backend
      };

      setUser(fullUserData);
      setIsAuthenticated(true);
      
      // Return the full user data so Login component can use it
      return fullUserData;
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
        updateTokens,
        discounts,
        refreshUserData, // Export this function so Services can use it
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;