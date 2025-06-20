// src/components/TempVerifyEmail.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { EnvelopeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import 'react-toastify/dist/ReactToastify.css';
import { useLocation } from 'react-router-dom';

const TempVerifyEmail = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
  const location = useLocation();
  const userEmail = new URLSearchParams(location.search).get('email');
  const isVerified = new URLSearchParams(location.search).get('is-verified') === 'false';
  const isExpired = new URLSearchParams(location.search).get('expired') === 'true';
  if (!userEmail) {
    toast.error('No email provided. Please register or log in first.');
    return null;
  }
 
  const [cooldown, setCooldown] = useState(0);          // seconds remaining
  const [loading, setLoading] = useState(false);        // API request state

  // countdown side‑effect
  useEffect(() => {
    if (!cooldown) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleResendVerification = async () => {
    if (!userEmail) return toast.error('No email found in local storage.');

    setLoading(true);
    try {
      await axios.post(`${backendUrl}/api/users/resend-verification-email/`, {
        email: userEmail,
      });
      toast.success('Verification email resent – please check your inbox.');
      setCooldown(30);          // start 30‑second cooldown
    } catch (err) {
      toast.error('Failed to resend verification email. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white px-4">
      <div className="bg-white w-full max-w-md shadow-lg rounded-xl p-8 text-center space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <EnvelopeIcon className="w-12 h-12 text-primary" />
          <h2 className="text-2xl font-bold text-green-700">Verify Your Email</h2>
        </div>

        {isVerified && (
          <p className="text-gray-700">
            It seems that <span className="font-medium text-gray-900">{userEmail}</span> is already registered, but
            <span className="font-medium text-red-500"> not verified</span>. Please check your inbox for the verification email.
            If you can't find it, you can resend the verification email.
          </p>
          
        )}

        {isExpired && (
          // Oops message
          <p className="text-red-600">
            Oops! It seems that the verification link for
            <span className="font-medium text-gray-900"> {userEmail}</span> has expired.
            Please click the button below to resend the verification email.
          </p>
        )}
        {(!isVerified && !isExpired) && (
          // Message
          <p className="text-gray-700">
            A verification link has been sent to
            <span className="font-medium text-gray-900"> {userEmail}</span>. Please
            click the link in that email to activate your account.
          </p>
        )}

        {/* Resend button */}
        <button
          onClick={handleResendVerification}
          disabled={cooldown > 0 || loading}
          className={`w-full cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 px-5 py-2.5 rounded-md
            ${cooldown > 0 || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary/90 transition'}
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

export default TempVerifyEmail;
