// src/components/TempVerifyEmail.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { EnvelopeIcon, ArrowPathIcon, CheckCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import 'react-toastify/dist/ReactToastify.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import logo from "../assets/logo2.png"
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const UserVerifyEmail = () => {
    const location = useLocation();
    const { api, refreshToken, updateTokens, isAuthenticated } = useContext(AuthContext);
   

    // Get parameters from URL
    const urlParams = new URLSearchParams(location.search);
    const userEmail = urlParams.get('email');
    const nextPath = urlParams.get('next');
    const navigate = useNavigate()

     // Define a unique key for storage
    const INITIAL_SENT_KEY = `verify_email_sent_${userEmail}`; // Use email for uniqueness

    // Check if the user is coming from a registration/login where they need verification
    const needsVerification = urlParams.get('isVerified') === 'false'; 
    const isExpired = urlParams.get('expired') === 'true';
    const fromLogin = urlParams.get('from') === 'login';

    // State for managing UI logic
    const [cooldown, setCooldown] = useState(0);        // seconds remaining for resend
    const [loading, setLoading] = useState(false);      // API request state
    const [checkingStatus, setCheckingStatus] = useState(false); // Checking verification status
    const [isVerified, setIsVerified] = useState(false); // Track if email is verified
    const [initialSent, setInitialSent] = useState(() => {
        // Check if a success flag exists in localStorage for this specific email
        const storedValue = localStorage.getItem(INITIAL_SENT_KEY);
        // Return true if the flag exists, otherwise false
        return storedValue === 'true'; 
    });
    
    // Check for email validity early
    if (!userEmail) {
        toast.error('No email provided. Please register or log in first.');
        return null;
    }

    // Function to check verification status
    const checkVerificationStatus = async () => {
        setCheckingStatus(true);
        try {
            // You'll need to create this endpoint or use an existing one
            // For now, we'll try to login or use a status check endpoint
            const response = await api.post('/api/users/check-verification-status/', {
                email: userEmail
            });
            
            if (response.data?.is_verified) {
                setIsVerified(true);
                
                // If user is already authenticated, refresh token to get updated claims
                if (isAuthenticated && refreshToken && updateTokens) {
                    try {
                        const refreshResponse = await api.post(
                            '/api/users/token/refresh/', 
                            { refresh: refreshToken }
                        );
                        updateTokens(refreshResponse.data.access, refreshResponse.data.refresh);
                    } catch (refreshErr) {
                        console.error("Failed to refresh token:", refreshErr);
                    }
                }
                
                toast.success('Your email is already verified!');
            }
        } catch (err) {
            console.error("Error checking verification status:", err);
        } finally {
            setCheckingStatus(false);
        }
    };

    // Check status on mount if needed
    useEffect(() => {
        // If we suspect it might be verified (e.g., fromLogin flag), check
        if (fromLogin) {
            checkVerificationStatus();
        }
    }, [fromLogin]);
    
    // Helper function to send the verification email (used by both auto-send and resend)
    const sendVerificationEmail = async () => {
        setLoading(true);
        try {
            const response = await api.post('/api/users/resend-verification-email/', {
                email: userEmail,
                next: nextPath || '/',
            });
            const backendStatus = response.data?.status_flag;
            
            if (backendStatus === 'SENT') {
                // Scenario 1: Email was successfully queued for sending
                setCooldown(30); // Start frontend cooldown timer
                localStorage.setItem(INITIAL_SENT_KEY, 'true');
                setInitialSent(true); 
                setIsVerified(false); // Ensure not showing verified state
                toast.success(response.data?.message || 'Verification email sent!');
                
            } else if (backendStatus === 'VERIFIED') {
                // Scenario 2: Email was already verified
                setIsVerified(true);
                
                if (refreshToken && updateTokens) {
                    try {
                        const refreshResponse = await api.post(
                            '/api/users/token/refresh/', 
                            { refresh: refreshToken }
                        );
                        
                        console.log("Tokens updated after verification.");
                        // Update context with the new token (containing is_verified: true)
                        updateTokens(refreshResponse.data.access, refreshResponse.data.refresh);

                    } catch (refreshErr) {
                        console.error("Failed to refresh token after verification:", refreshErr);
                    }
                }
                
                toast.success(response.data?.message || 'Your email is already verified!');
                
                // Option: Auto-redirect after a short delay
                // setTimeout(() => navigate(nextPath || '/dashboard'), 2000);
            }
            
        } catch (err) {
            // --- Error Handling ---
            console.log(err)
            
            // 1. Extract the error message from the response data
            const errorMessage = 
                err.response?.data?.message || 
                err.response?.data?.error || 
                'Failed to send verification email. Try again later.';
            
            const status = err.response?.status;

            // 2. Handle specific HTTP 429 (Too Many Requests / Cooldown)
            if (status === 429) {
                toast.warn(errorMessage);
                setCooldown(30); 

            // 3. Handle other errors (404 User not found, 400 Bad Request, etc.)
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // 1. 🚀 INITIAL SEND EFFECT: Send email automatically on component mount
    useEffect(() => {
        // Define an async function internally
        const initiateSend = async () => {
            if (!initialSent && (needsVerification || isExpired)) {
                await sendVerificationEmail(); 
            }
        };
    
        // Call the async function immediately
        initiateSend();
    }, [initialSent, needsVerification, isExpired]);

    // 2. COOLDOWN EFFECT: Countdown timer
    useEffect(() => {
        if (!cooldown) return;
        const id = setInterval(() => setCooldown((c) => c - 1), 1000);
        return () => clearInterval(id);
    }, [cooldown]);

    // Handle resend verification email (used by the manual button click)
    const handleResendVerification = async () => {
        if (cooldown > 0) return; // Prevent resend if still cooling down
        await sendVerificationEmail();
    };

    // Handle login redirect
    const handleLoginRedirect = () => {
        navigate('/auth/login', { 
            state: { 
                email: userEmail,
                message: 'Your email is verified! Please log in.',
                redirectTo: nextPath 
            } 
        });
    };

    // Determine the message to display
    let mainMessage = null;
    
    if (isVerified) {
        mainMessage = (
            <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircleIcon className="w-8 h-8" />
                    <span className="text-lg font-semibold">Email Verified!</span>
                </div>
                <p className="text-gray-700">
                    Your email <span className="font-medium text-gray-900">{userEmail}</span> has been successfully verified.
                    You can now log in to your account.
                </p>
            </div>
        );
    } else if (isExpired) {
        mainMessage = (
            <div className="space-y-2">
                <p className="text-amber-600 font-medium">
                    Link Expired
                </p>
                <p className="text-gray-700">
                    The verification link for <span className="font-medium text-gray-900">{userEmail}</span> has expired.
                    A new link has been sent. Please check your inbox.
                </p>
            </div>
        );
    } else if (needsVerification) {
        mainMessage = (
            <div className="space-y-2">
                <p className="text-gray-700">
                    It seems that <span className="font-medium text-gray-900">{userEmail}</span> is registered but not verified.
                    We've sent a verification link to your inbox.
                </p>
            </div>
        );
    } else {
        mainMessage = (
            <div className="space-y-2">
                <p className="text-gray-700">
                    A verification link has been sent to
                    <span className="font-medium text-gray-900"> {userEmail}</span>. Please
                    click the link in that email to activate your account.
                </p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-7rem)] flex flex-col gap-4 items-center justify-center bg-gradient-to-br from-green-50 to-white px-4">
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className=""
            >
                <Link to="/">
                    <img src={logo} className="w-[10rem]" alt="Kleankickx Logo" />
                </Link>                  
            </motion.div>
            
            <div className="bg-white w-full max-w-md shadow-lg rounded-xl p-8 text-center space-y-6">
                {/* Header - changes based on verification status */}
                <div className="flex flex-col items-center gap-2">
                    {isVerified ? (
                        <CheckCircleIcon className="w-12 h-12 text-green-600" />
                    ) : (
                        <EnvelopeIcon className="w-12 h-12 text-green-700" />
                    )}
                    <h2 className={`text-2xl font-bold ${isVerified ? 'text-green-600' : 'text-green-700'}`}>
                        {isVerified ? 'Email Verified!' : 'Verify Your Email'}
                    </h2>
                </div>

                {/* Main message */}
                <div className="text-sm">
                    {mainMessage}
                </div>

                {/* Status checking indicator */}
                {checkingStatus && (
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Checking verification status...</span>
                    </div>
                )}

                {/* Action Buttons - Conditional based on verification status */}
                <div className="space-y-3">
                    {isVerified ? (
                        // Show Login button when verified
                        <button
                            onClick={handleLoginRedirect}
                            className="w-full cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-green-600 text-white hover:bg-green-700 transition"
                        >
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                            Proceed to Login
                        </button>
                    ) : (
                        // Show Resend button when not verified
                        <button
                            onClick={handleResendVerification}
                            disabled={cooldown > 0 || loading}
                            className={`w-full cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 px-5 py-2.5 rounded-md
                                ${cooldown > 0 || loading
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700 transition'}
                            `}
                        >
                            {loading ? (
                                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            ) : (
                                <ArrowPathIcon className="w-5 h-5" />
                            )}
                            {loading 
                                ? 'Sending...' 
                                : (cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email')}
                        </button>
                    )}

                    {/* Already verified link - always visible when not verified */}
                    {!isVerified && (
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">or</span>
                            </div>
                        </div>
                    )}

                    {!isVerified && (
                        <button
                            onClick={handleLoginRedirect}
                            className="w-full cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 rounded-md border-2 border-green-600 text-green-600 hover:bg-green-50 transition"
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                            Already Verified? Log In
                        </button>
                    )}
                </div>

                {/* Additional help text */}
                {!isVerified && (
                    <div className="space-y-2 text-xs text-gray-500">
                        <p>
                            Didn't get the email? Check your spam folder or{' '}
                            <button 
                                onClick={handleResendVerification}
                                disabled={cooldown > 0}
                                className="text-green-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                            >
                                click here to resend
                            </button>
                        </p>
                        <p>
                            Wrong email?{' '}
                            <Link to="/auth/register" className="text-green-600 hover:underline">
                                Go back to registration
                            </Link>
                        </p>
                    </div>
                )}

                {/* Login help for verified users */}
                {isVerified && (
                    <p className="text-xs text-gray-500">
                        Having trouble logging in?{' '}
                        <Link to="/auth/forgot-password" className="text-green-600 hover:underline">
                            Reset your password
                        </Link>
                    </p>
                )}
            </div>

            {/* Optional: Redirect countdown for verified users */}
            {isVerified && (
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-gray-500 mt-2"
                >
                    You'll be redirected to login in a moment...
                </motion.p>
            )}
        </div>
    );
};

export default UserVerifyEmail;