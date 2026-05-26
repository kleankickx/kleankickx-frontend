// src/context/AuthProvider.jsx - Updated with partner support + fix for logout-on-reload

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import axios from 'axios';
import api, { onAuthExpiration } from '../api';

export const AuthContext = createContext();

const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000';

const isTokenExpired = (token) => {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]));
    return exp * 1000 < Date.now() + 30_000; // 30s buffer
  } catch {
    return true;
  }
};

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token'));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [discounts, setDiscounts] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPartner, setIsPartner] = useState(false);
  const [partnerData, setPartnerData] = useState(null);

  // Listen for auth expiration from API interceptor
  useEffect(() => {
    const unsubscribe = onAuthExpiration(() => {
      if (isAuthenticated) {
        console.log('[AUTH] Token expired - logging out');
        clearAuth();
        toast.info('Your session has expired. Please log in again.', {
          position: 'top-right',
          autoClose: 5000,
        });
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
        is_partner: decoded.is_partner || false,
        company_name: decoded.company_name || null,
        partner_id: decoded.partner_id || null,
        free_signup_service_used: decoded.free_signup_service_used_id
          ? {
              id: decoded.free_signup_service_used_id,
              claimed_at: decoded.free_service_used_at || null,
            }
          : null,
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

  // Fetch partner profile data
  const fetchPartnerProfile = async () => {
    try {
      const response = await api.get('/api/partner/profile/');
      setPartnerData(response.data);
    } catch (error) {
      console.error('Failed to fetch partner profile:', error);
    }
  };

  // Restore session on page load — proactively refresh if access token is expired
  useEffect(() => {
    const restoreSession = async () => {
      setAuthLoading(true);

      const storedAccess = localStorage.getItem('access_token');
      const storedRefresh = localStorage.getItem('refresh_token');

      if (!storedAccess || !storedRefresh) {
        setAuthLoading(false);
        return;
      }

      let activeAccess = storedAccess;

      // Proactively refresh if the access token is expired or about to expire
      if (isTokenExpired(storedAccess)) {
        console.log('[AUTH] Access token expired on load — refreshing…');
        try {
          const { data } = await axios.post(
            `${baseURL}/api/users/token/refresh/`,
            { refresh: storedRefresh },
            { withCredentials: true }
          );
          activeAccess = data.access;
          localStorage.setItem('access_token', activeAccess);
          setAccessToken(activeAccess);
          console.log('[AUTH] Token refreshed on load ✅');
        } catch (err) {
          console.warn('[AUTH] Refresh failed on load — clearing session', err);
          clearAuth();
          setAuthLoading(false);
          return;
        }
      }

      const decoded = decodeToken(activeAccess);
      if (!decoded) {
        clearAuth();
        setAuthLoading(false);
        return;
      }

      setUser(decoded);
      setIsAuthenticated(true);
      setIsPartner(decoded.is_partner || false);

      if (decoded.is_partner) {
        fetchPartnerProfile();
      }

      setAuthLoading(false);
    };

    restoreSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isPartner) {
      fetchDiscounts();
    }
  }, [isAuthenticated, isPartner]);

  const persistToken = (key, value) => {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  };

  const clearAuth = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setIsPartner(false);
    setPartnerData(null);
    persistToken('access_token', null);
    persistToken('refresh_token', null);
  };

  // Login function
  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const response = await api.post('/api/users/login/', { email, password });
      const { access, refresh } = response.data;

      setAccessToken(access);
      setRefreshToken(refresh);
      persistToken('access_token', access);
      persistToken('refresh_token', refresh);

      const decoded = decodeToken(access);
      console.log(decoded);
      setUser(decoded);
      setIsAuthenticated(true);
      setIsPartner(decoded.is_partner || false);

      if (decoded.is_partner) {
        await fetchPartnerProfile();
      }

      return decoded;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  // Partner Registration
  const partnerRegister = async (formData) => {
    setAuthLoading(true);
    try {
      const response = await api.post('/api/partner/register/', formData);
      toast.success(response.data.message || 'Registration successful! Please verify your email.');
      return response.data;
    } catch (err) {
      console.error('Partner registration error:', err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.email?.[0] ||
        'Registration failed. Please try again.';
      throw new Error(errorMessage);
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
      const { access, refresh } = response.data;

      setAccessToken(access);
      setRefreshToken(refresh);
      persistToken('access_token', access);
      persistToken('refresh_token', refresh);

      const decoded = decodeToken(access);
      setUser(decoded);
      setIsAuthenticated(true);
      setIsPartner(decoded.is_partner || false);

      if (decoded.is_partner) {
        await fetchPartnerProfile();
      }

      return decoded;
    } catch (err) {
      console.error('Google login error:', err);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const logout = () => {
    clearAuth();
    navigate('/auth/login', { replace: true });
  };

  const refreshUserData = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await api.get('/api/users/profile/');
      setUser((prev) => ({
        ...prev,
        ...response.data,
        free_signup_service_used: response.data.free_signup_service_used || null,
      }));

      if (isPartner) {
        await fetchPartnerProfile();
      }

      return response.data;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, [accessToken, isPartner]);

  const value = {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    isPartner,
    partnerData,
    discounts,
    authLoading,
    login,
    partnerRegister,
    googleLogin,
    logout,
    refreshUserData,
    fetchPartnerProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;