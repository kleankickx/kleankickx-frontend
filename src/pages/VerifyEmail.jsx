// src/components/VerifyEmail.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationCircleIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { FaSpinner } from 'react-icons/fa';
import logo from "../assets/logo2.png"

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { cartExpired } = useContext(CartContext);
  const { login } = useContext(AuthContext);

  const hasVerified = useRef(false);

  const [status, setStatus] = useState('verifying'); // verifying | success | already_verified | error
  const [error, setError] = useState('');

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const key = searchParams.get('key');
  const userEmail = searchParams.get('email');
  const nextRedirectPath = searchParams.get('next') || '/';
  const { api, refreshToken, updateTokens,  } = useContext(AuthContext);

  useEffect(() => {
		// If verification already ran or key is missing, stop.
		// Also ensure API context is available before attempting the fetch
		if (hasVerified.current || !key || !api) return;

		const verifyEmail = async () => {
			hasVerified.current = true;
			try {
				// 1. Call the verification endpoint, sending the key in the body
				const response = await api.post(`/api/users/verify-email/${key}/`, {
          withCredentials: true,
        });

				if (cartExpired) {
					toast.warn('Your cart was cleared due to expiration and synced with the server.', {
						position: 'top-right',
					});
				}

				const responseStatus = response.data.status;
				setStatus(responseStatus);

				if (responseStatus === 'success' || responseStatus === 'already_verified') {
					// Determine the final redirect path
          const finalRedirect = nextRedirectPath.startsWith('/') ? nextRedirectPath : '/';

					// 2. 🚀 Handle success by refreshing the token and updating context
					if (refreshToken) {
						// User is logged in (or has a persistent refresh token).
						// Get new tokens with the updated 'is_verified: true' claim.
						try {
							const refreshResponse = await api.post(
                '/api/users/token/refresh/', 
                { 
                  refresh: refreshToken 
                }
              );
							
							// Ensure updateTokens exists before calling
							if (updateTokens) {
								updateTokens(refreshResponse.data.access, refreshResponse.data.refresh);
							}
							
							const successMessage = responseStatus === 'success' 
                                ? 'Email verified successfully!'
                                : 'Your email was already verified. Session updated.';

							toast.success(successMessage, { position: 'top-right' });

							// Redirect to the home page or a desired post-login page
							setTimeout(() => {
								navigate(finalRedirect); 
							}, 1500);

						} catch (refreshErr) {
							// If refresh fails (e.g., refresh token is also expired/invalid)
							console.error('Token refresh failed post-verification, redirecting to login.', refreshErr);
							
							// Fallback to login redirect
							const redirectPath = userEmail ? `/auth/login?email=${encodeURIComponent(userEmail)}&verified=true` : '/auth/login?verified=true';
							toast.success('Email verified! Please log in to complete the process.', { position: 'top-right' });
							setTimeout(() => navigate(redirectPath), 1500);
						}
						
					} else {
						// User is not logged in, redirect them to login with a success prompt
						const redirectPath = userEmail ? `/auth/login?email=${encodeURIComponent(userEmail)}&verified=true` : '/auth/login?verified=true';
						const successMessage = responseStatus === 'success' 
                            ? 'Email verified successfully! Please log in to continue.'
                            : 'This email is already verified. Please log in.';

						toast.success(successMessage, { position: 'top-right' });
						setTimeout(() => navigate(redirectPath), 1500);
					}
				}
				
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
	}, [navigate, cartExpired, key, api, refreshToken, updateTokens, userEmail]);

  // Handle missing key
  if (!key) {
    return (
      <div className='bg-green-50'>
      <div className="flex flex-col items-center h-full justify-center px-4">
        <div className="">
          <img src={logo} className="w-[10rem]" />
        
        </div>
        <div className="bg-white rounded-lg shadow-2xl border norder-gray-300 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <XCircleIcon className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Verification Link</h2>
          <p className="text-gray-600 mb-6">
            The verification link appears to be incomplete or invalid. Please check your email and try again.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            Return to Login
          </button>
        </div>
      </div>
      </div>
    );
  }

  return (

    <div className='bg-green-50 h-screen'>
      <div className="flex flex-col gap-4 items-center h-full justify-center px-4">
        <div className="">
            <img src={logo} className="w-[10rem]" />
          
        </div>
        <div className="bg-white rounded-lg border border-gray-300 p-8 max-w-md w-full shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <EnvelopeIcon className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verification</h1>
          </div>

          {/* Status Content */}
          <div className="space-y-6">
            {/* Verifying State */}
            {status === 'verifying' && (
              <div className="text-center py-4">
                <FaSpinner className="animate-spin h-8 w-8 text-primary mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Verifying your email address...</p>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-green-700 mb-2">Verification Successful!</h3>
                <p className="text-gray-600">
                  Your email has been verified successfully. Redirecting to login...
                </p>
              </div>
            )}

            {/* Already Verified State */}
            {status === 'already_verified' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <ExclamationCircleIcon className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-blue-700 mb-2">Already Verified</h3>
                <p className="text-gray-600">
                  This email address has already been verified. Redirecting...
                </p>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircleIcon className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-red-700 mb-2">Verification Failed</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>

                {(error.includes('expired') || error.includes('Invalid')) && (
                  <div className="space-y-4">
                    <p className="text-gray-600 text-sm">
                      Your verification link may have expired or is invalid.
                    </p>
                    <button
                      onClick={() => navigate(`/auth/confirm-email/?email=${encodeURIComponent(userEmail)}&expired=true`)}
                      className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                    >
                      Request New Verification Link
                    </button>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => navigate('/auth/login')}
                    className="text-primary hover:text-primary-dark font-medium transition duration-200"
                  >
                    ← Return to Login Page
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;