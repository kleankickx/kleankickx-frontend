// src/components/VerifyEmail.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import api from '../api'; // Assuming you have an API utility set up

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { cartExpired } = useContext(CartContext);
  const { login } = useContext(AuthContext);

  const hasVerified = useRef(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [error, setError] = useState('');

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const key = searchParams.get('key');
  const userEmail = searchParams.get('email');


  useEffect(() => {
    if (hasVerified.current) return;

    const verifyEmail = async () => {
      hasVerified.current = true;
      try {
        const response = await api.post(`/api/users/verify-email/${key}/`, {
          withCredentials: true,
        });


        if (cartExpired) {
          toast.warn('Your cart was cleared due to expiration and synced with the server.', {
            position: 'top-right',
          });
        }
        console.log('Email verification response:', response.data.status);
        setStatus(response.data.status);

        if (response.data.status === 'already_verified') {
          toast.info('This email is already verified. You can now log in.', {
            position: 'top-right',
          });
         
        }
        if (response.data.status === 'success') {
          toast.success('Email verified successfully! Redirecting to login...', {
            position: 'top-right',
          });
        }
        

        // navigate user to login page
        setTimeout(() => {
          navigate('/login?continue=/cart');
        }, 1200);
        
      } catch (err) {
        console.error('Email verification error:', err);
        const errorMsg =
          err.response?.data?.error ||
          err.message ||
          'Verification failed. Please try again.';
        setError(errorMsg);
        setStatus('error');
        hasVerified.current = false;
      }
    };

    verifyEmail();
  }, [navigate, cartExpired, login, key, backendUrl]);

  return (
    <div className="bg-[#edf1f4] min-h-screen flex items-center justify-center px-4 py-10">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-green-700 mb-6">Email Verification</h2>

        {/* LOADING STATE */}
        {status === 'verifying' && (
          <div className="flex flex-col items-center space-y-4">
            <svg className="animate-spin h-10 w-10 text-green-600" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              ></path>
            </svg>
            <p className="text-gray-600">Verifying your email, please wait...</p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === 'success' && (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircleIcon className="w-12 h-12 text-green-500" />
            <p className="text-green-600 font-medium">
              Email verified successfully! Redirecting to login...
            </p>
          </div>
        )}

        {/* ALREADY VERIFIED STATE */ }
        {status === 'already_verified' && (
          <div className="flex flex-col items-center space-y-4">
            <ExclamationCircleIcon className="w-12 h-12 text-yellow-500" />
            <p className="text-yellow-600 font-medium">
              This email is already verified. You can now log in.
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {status === 'error' && (
          <div className="text-left space-y-4">
            <div className="bg-red-100 border border-red-300 text-red-700 rounded p-4 flex items-start gap-3">
              <XCircleIcon className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold mb-1">Verification Failed</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>

            {(error.includes('expired') || error.includes('Invalid')) && (
              <p className="text-sm text-gray-700 text-center">
                Your link may have expired.{' '}
                <button
                  onClick={() => navigate('/temp-verify-email/?email=' + encodeURIComponent(userEmail) + '&expired=true')}
                  className="text-primary hover:underline"
                >
                  Request a new verification link
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
