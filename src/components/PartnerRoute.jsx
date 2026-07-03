// src/components/PartnerRoute.jsx
import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const PartnerRoute = ({ children }) => {
  const { user, partnerData, isPartner, authLoading, refreshUserData } = useContext(AuthContext);
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  // Attempt to refresh partner data if it's missing but user is a partner
  useEffect(() => {
    const loadPartnerData = async () => {
      // If user is a partner but partnerData is missing, try to refresh
      if (user && isPartner && !partnerData && !authLoading) {
        try {
          await refreshUserData();
        } catch (error) {
          console.error('Failed to refresh partner data:', error);
        }
      }
      setIsLoading(false);
    };

    loadPartnerData();
  }, [user, isPartner, partnerData, authLoading, refreshUserData]);

  // Show loading state while checking authentication or loading partner data
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking partner access...</p>
        </div>
      </div>
    );
  }

  // Check if user is logged in
  if (!user) {
    const toastId = "partner-login-required";
    if (!toast.isActive(toastId)) {
      toast.info("Please login to access partner features.", {
        toastId: toastId,
      });
    }
    return (
      <Navigate
        to={`/auth/login?continue=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  // Check if user has partner role
  if (!isPartner) {
    const toastId = "partner-access-denied";
    if (!toast.isActive(toastId)) {
      toast.error("Access denied. Partner account required.", {
        toastId: toastId,
      });
    }
    return <Navigate to="/" replace />;
  }

  // Check if partner profile exists
  if (!partnerData) {
    const toastId = "partner-profile-missing";
    if (!toast.isActive(toastId)) {
      toast.error("Partner profile not found. Please contact support.", {
        toastId: toastId,
      });
    }
    return <Navigate to="/" replace />;
  }

  // Get partner status (default to PENDING_REVIEW if not set)
  const partnerStatus = partnerData?.status || 'PENDING_REVIEW';
  const canPlaceOrders = partnerStatus === 'ACTIVE';

  // Get status display info for the message
  const getStatusInfo = () => {
    const statusMap = {
      'PENDING_REVIEW': {
        message: 'Your account is under review. You cannot access this page until your account is activated.',
        redirect: '/partner/dashboard',
        toastId: 'partner-pending-review',
        toastType: 'warning'
      },
      'ACTIVE': {
        message: '',
        redirect: null,
        toastId: null,
        toastType: null
      },
      'SUSPENDED': {
        message: 'Your account has been suspended. Please contact support.',
        redirect: '/partner/dashboard',
        toastId: 'partner-suspended',
        toastType: 'error'
      },
      'REJECTED': {
        message: 'Your partnership application has been rejected. Please contact support.',
        redirect: '/partner/dashboard',
        toastId: 'partner-rejected',
        toastType: 'error'
      },
      'INACTIVE': {
        message: 'Your account is inactive. Please contact support.',
        redirect: '/partner/dashboard',
        toastId: 'partner-inactive',
        toastType: 'warning'
      }
    };
    return statusMap[partnerStatus] || statusMap['PENDING_REVIEW'];
  };

  // If not active, redirect with warning
  if (!canPlaceOrders) {
    const statusInfo = getStatusInfo();
    
    // Show toast only if not already shown
    if (statusInfo.toastId && !toast.isActive(statusInfo.toastId)) {
      toast[statusInfo.toastType](statusInfo.message, {
        toastId: statusInfo.toastId,
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
    
    // If trying to access partner services specifically, redirect to dashboard with state
    if (location.pathname === '/partner/services' || location.pathname.includes('/partner/order')) {
      return (
        <Navigate
          to={`${statusInfo.redirect}?status=${partnerStatus}`}
          state={{ 
            from: location.pathname,
            status: partnerStatus,
            message: statusInfo.message 
          }}
          replace
        />
      );
    }
    
    return <Navigate to={statusInfo.redirect} replace />;
  }

  // If active, render the children
  return children;
};

export default PartnerRoute;