// src/context/AuthProvider.jsx - Add auth expiration listener

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import api, { onAuthExpiration } from '../api';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  
  const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token'));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!accessToken);
  const [discounts, setDiscounts] = useState([]);
  const [authLoading, setAuthLoading] = useState(false);

  // Listen for auth expiration from API
useEffect(() => {
  const unsubscribe = onAuthExpiration(() => {
    // Only trigger if we're actually authenticated
    if (isAuthenticated) {
      console.log('[AUTH] Token expired - logging out');
      
      // Clear state
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      // Show toast message
      toast.info('Your session has expired. Please log in again.', {
        position: 'top-right',
        autoClose: 5000,
      });
      
      // Redirect to login page (no page reload)
      navigate('/auth/login', { replace: true });
    }
  });
  
  return unsubscribe;
}, [navigate, isAuthenticated]);

  const decodeToken = (token) => {
    try {
      const decoded = jwtDecode(token);
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

  // Load auth state from storage
  useEffect(() => {
    const storedAccess = localStorage.getItem('access_token');
    const storedRefresh = localStorage.getItem('refresh_token');

    if (storedAccess && storedRefresh) {
      const decodedUser = decodeToken(storedAccess);
      if (decodedUser) {
        setAccessToken(storedAccess);
        setRefreshToken(storedRefresh);
        setUser(decodedUser);
        setIsAuthenticated(true);
      } else {
        clearAuth();
      }
    }
  }, []);

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

  // Login function
  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const response = await api.post('/api/users/login/', { email, password });
      const { access, refresh, user: userData } = response.data;

      setAccessToken(access);
      setRefreshToken(refresh);
      persistToken('access_token', access);
      persistToken('refresh_token', refresh);

      const decoded = decodeToken(access);
      const fullUserData = {
        ...decoded,
        ...userData,
      };

      setUser(fullUserData);
      setIsAuthenticated(true);
      
      return fullUserData;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  // Google Login
  const googleLogin = async (credentialResponse, referralCode = null) => {
    setAuthLoading(true);
    try {
      const payload = { token: credentialResponse.credential };
      if (referralCode) payload.referral_code = referralCode;
      
      const response = await api.post('/api/users/google-login/', payload);
      const { access, refresh, user: userData } = response.data;

      setAccessToken(access);
      setRefreshToken(refresh);
      persistToken('access_token', access);
      persistToken('refresh_token', refresh);

      const decoded = decodeToken(access);
      const fullUserData = {
        ...decoded,
        ...userData,
      };

      setUser(fullUserData);
      setIsAuthenticated(true);
      
      return fullUserData;
    } catch (err) {
      console.error('Google login error:', err);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout - NO PAGE RELOAD
  const logout = () => {
    clearAuth();
    navigate('/auth/login', { replace: true });
  };

  const refreshUserData = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      const response = await api.get('/api/users/profile/');
      setUser(prev => ({
        ...prev,
        ...response.data,
        free_signup_service_used: response.data.free_signup_service_used || null
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, [accessToken]);

  const value = {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    discounts,
    authLoading,
    login,
    googleLogin,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;