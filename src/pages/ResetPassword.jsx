// src/pages/ResetPassword.jsx
import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import logo from "../assets/logo2.png";
import { motion } from 'framer-motion';

const ResetPassword = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if UID or token are missing on load
  useEffect(() => {
    if (!uid || !token) {
      setFormError('The reset link is invalid or incomplete.');
      toast.error('Invalid link provided.');
    }
  }, [uid, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!uid || !token) {
      return setFormError('Cannot submit: Invalid or incomplete reset link.');
    }

    if (newPassword !== confirmPassword) {
      return setFormError('Passwords do not match.');
    }

    if (newPassword.length < 8) {
      return setFormError('Password must be at least 8 characters long.');
    }

    setLoading(true);
    try {
      await api.post('/api/users/password/reset/confirm/', {
        uid,
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success('Password reset successfully. Please log in.');
      navigate('/auth/login');
    } catch (err) {
      const errMsg =
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to reset password.';
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#edf1f4] px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white shadow-xl rounded-xl w-full max-w-md p-8 space-y-6 border border-gray-100"
      >
        {/* Logo */}
        <div className="text-center">
          <Link to="/">
            <img src={logo} className="w-[8rem] mx-auto mb-4" alt="KleanKickx Logo" />
          </Link>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full mb-2">
            <LockClosedIcon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-2">
            Reset Password
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter and confirm your new password
          </p>
        </div>

        {formError && formError.includes('link is invalid or incomplete') ? (
          <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <ExclamationCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-medium">{formError}</p>
            <Link 
              to="/auth/forgot-password" 
              className="text-primary hover:underline mt-3 inline-block"
            >
              Request a new reset link →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password Field */}
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className={`peer w-full px-4 pt-6 pb-2 border ${
                  formError && !formError.includes('link') ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition`}
                placeholder=" "
                disabled={!uid || !token || loading}
              />
              <label
                htmlFor="newPassword"
                className="absolute left-4 top-1 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary"
              >
                New Password
              </label>
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                tabIndex={-1}
                disabled={!uid || !token || loading}
              >
                {showNewPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Confirm Password Field */}
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={`peer w-full px-4 pt-6 pb-2 border ${
                  formError && !formError.includes('link') ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition`}
                placeholder=" "
                disabled={!uid || !token || loading}
              />
              <label
                htmlFor="confirmPassword"
                className="absolute left-4 top-1 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary"
              >
                Confirm Password
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                tabIndex={-1}
                disabled={!uid || !token || loading}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password requirements */}
            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-medium">Password requirements:</p>
              <ul className="list-disc list-inside ml-2 space-y-0.5">
                <li className={newPassword.length >= 8 ? "text-green-600" : ""}>
                  At least 8 characters
                </li>
                <li className={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>
                  At least one uppercase letter
                </li>
                <li className={/[a-z]/.test(newPassword) ? "text-green-600" : ""}>
                  At least one lowercase letter
                </li>
                <li className={/[0-9]/.test(newPassword) ? "text-green-600" : ""}>
                  At least one number
                </li>
              </ul>
            </div>

            {/* Error message */}
            {formError && !formError.includes('link is invalid or incomplete') && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{formError}</p>
                {formError.toLowerCase().includes('invalid') && (
                  <Link 
                    to="/auth/forgot-password" 
                    className="text-primary underline text-sm mt-2 inline-block"
                  >
                    Request a new reset link
                  </Link>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !uid || !token}
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
          <Link to="/auth/login" className="text-primary hover:underline font-medium">
            ← Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;