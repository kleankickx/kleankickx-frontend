// src/pages/ResetPassword.jsx
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import api from '../api.js'

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // client-side match check
    if (newPassword !== confirmPassword) {
      return setFormError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await api.post('/api/users/password/reset/confirm/', {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success('Password reset successfully. Please log in.');
      navigate('/login');
    } catch (err) {
      const errMsg =
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        'Failed to reset password.';
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white px-4">
      <div className="bg-white shadow-xl rounded-xl w-full max-w-md p-8 space-y-6 border border-gray-100">
        <div className="text-center space-y-1">
          <LockClosedIcon className="w-12 h-12 mx-auto" />
          <h2 className="text-3xl font-extrabold">
            Reset Password
          </h2>
          <p className="text-sm text-gray-600">
            Enter and confirm your new password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* new password */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className={`peer w-full px-3 pt-5 pb-2 border ${
                formError ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none transition`}
              placeholder=" "
            />
            <label
              htmlFor="newPassword"
              className="absolute left-3 top-2 text-sm text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-500"
            >
              New password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
            >
              {showPassword ? <EyeSlashIcon className="w-5" /> : <EyeIcon className="w-5" />}
            </button>
          </div>

          {/* confirm password */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className={`peer w-full px-3 pt-5 pb-2 border ${
                formError ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none transition`}
              placeholder=" "
            />
            <label
              htmlFor="confirmPassword"
              className="absolute left-3 top-2 text-sm text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-1 peer-focus:text-sm peer-focus:text-gray-500"
            >
              Confirm password
            </label>
          </div>

          {/* inline error */}
            {formError && (
            <>
                <p className="text-red-500 text-sm -mt-2">{formError}</p>
                {formError.toLowerCase().includes('invalid') && (
                <Link to="/forgot-password" className="text-primary underline text-sm block mt-1">
                    Request a new reset link
                </Link>
                )}
            </>
            )}


          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/80 text-white py-2.5 rounded-md font-medium transition cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          Remembered?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
