// src/components/TempVerifyEmail.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { EnvelopeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import 'react-toastify/dist/ReactToastify.css';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';


const UserVerifyEmail = () => {
    const location = useLocation();
    const { api } = useContext(AuthContext);

    // Get parameters from URL
    const urlParams = new URLSearchParams(location.search);
    const userEmail = urlParams.get('email');
    const nextPath = urlParams.get('next');

    // Check if the user is coming from a registration/login where they need verification
    const needsVerification = urlParams.get('is-verified') === 'false'; 
    const isExpired = urlParams.get('expired') === 'true';

    // State for managing UI logic
    const [cooldown, setCooldown] = useState(0);        // seconds remaining for resend
    const [loading, setLoading] = useState(false);      // API request state
    const [initialSent, setInitialSent] = useState(false); // Tracks if the auto-send happened
    
    // Check for email validity early
    if (!userEmail) {
        toast.error('No email provided. Please register or log in first.');
        return null;
    }
    
    // Helper function to send the verification email (used by both auto-send and resend)
    const sendVerificationEmail = async () => {
    setLoading(true);
    try {
        await api.post('/api/users/resend-verification-email/', {
            email: userEmail,
            next: nextPath || '/',
        });
        
        // Success (Backend returned 200 OK)
        toast.success('Verification email sent – please check your inbox.');
        // The backend's 200 OK means the cooldown check passed, so we can start the frontend cooldown.
        setCooldown(30); 
    } catch (err) {
        // --- Error Handling ---
        
        // 1. Extract the error message from the response data
        const errorMessage = 
            err.response?.data?.message || 
            err.response?.data?.error || 
            'Failed to send verification email. Try again later.';
        
        const status = err.response?.status;

        // 2. Handle specific HTTP 429 (Too Many Requests / Cooldown)
        if (status === 429) {
            // The backend sends a message like: "Verification email was already sent recently. Please wait X seconds."
            toast.warn(errorMessage);
            
            // 🎯 Action: If the backend explicitly told us to wait, update the frontend cooldown.
            // We need to parse the wait time from the message, which is error-prone.
            // A safer, alternative approach (recommended): If 429, start a default cooldown 
            // to prevent the user from clicking for a short period.
            // For now, let's use the default 30s.
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
        // Only run if the user needs verification or has an expired link 
        // AND the initial send hasn't happened yet.
        if (!initialSent && (needsVerification || isExpired)) {
            sendVerificationEmail();
            setInitialSent(true); // Mark as sent so it doesn't run again
        }
    }, [initialSent, needsVerification, isExpired]); // Dependencies ensure logic is sound

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


    // Determine the message to display
    let mainMessage = (
        <p className="text-gray-700">
            A verification link has been sent to
            <span className="font-medium text-gray-900"> {userEmail}</span>. Please
            click the link in that email to activate your account.
        </p>
    );

    if (isExpired) {
        mainMessage = (
            <p className="text-red-600">
                Oops! It seems that the verification link for
                <span className="font-medium text-gray-900"> {userEmail}</span> has expired.
                A new link has been sent. Please check your inbox.
            </p>
        );
    } 

    if (needsVerification && !isExpired) {
        // This handles the first-time case where they are registered but not verified
        // We use a different message to imply we just sent it now.
        mainMessage = (
            <p className="text-gray-700">
                It seems that <span className="font-medium text-gray-900">{userEmail}</span> is registered but not verified.
                We have **automatically resent** the verification link to your inbox.
            </p>
        );
    }


    return (
        <div className="h-[calc(100vh-7rem)] flex items-center justify-center bg-gradient-to-br from-green-50 to-white px-4">
            <div className="bg-white w-full max-w-md shadow-lg rounded-xl p-8 text-center space-y-6">
                {/* Header */}
                <div className="flex flex-col items-center gap-2">
                    <EnvelopeIcon className="w-12 h-12 text-green-700" />
                    <h2 className="text-2xl font-bold text-green-700">Verify Your Email</h2>
                </div>

                {mainMessage}

                {/* Resend button */}
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
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
                </button>

                {/* Footnote */}
                <p className="text-xs text-gray-500">
                    Didn’t get the email? Check your spam folder or resend it above.
                </p>
            </div>
        </div>
    );
};

export default UserVerifyEmail;