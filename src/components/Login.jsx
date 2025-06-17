// src/components/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'; // Ensure you have heroicons installed
import 'react-toastify/dist/ReactToastify.css'; // Ensure toast styles are imported



const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { cartExpired } = useContext(CartContext);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // get the continue path from the query string
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const continuePath = searchParams.get('continue') || null;
  console.log('Continue Path:', continuePath);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/users/login/',
        { email, password },
        { withCredentials: true }
      );
      const { access, refresh } = response.data;
      login(access, refresh);
    //   await fetchCartFromBackend(access);
      if (cartExpired) {
        toast.warn('Your cart was cleared due to expiration and synced with the server.', {
          position: 'top-right',
        });
      }
    //   await syncCartWithBackend(access);
      toast.success('Logged in successfully!', { position: 'top-right' });
      {/* navigate to the previous page */}
      navigate(continuePath || -1); // Navigate to the previous page or default to -1
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
      toast.error('Login failed. Please check your credentials.', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/users/google-login/',
        { token: credentialResponse.credential },
        { withCredentials: true }
      );
      const { access, refresh } = response.data;
      login(access, refresh);
    //   await fetchCartFromBackend(access);
      if (cartExpired) {
        toast.warn('Your cart was cleared due to expiration and synced with the server.', {
          position: 'top-right',
        });
      }
    //   await syncCartWithBackend(access);
      toast.success('Logged in with Google!', { position: 'top-right' });
      {/* navigate to the previous page */}
      navigate(continuePath || -1); // Navigate to the previous page or default to -1

    } catch (err) {
      setError(err.response?.data?.error || 'Google login failed.');
      toast.error('Google login failed. Please try again.', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#edf1f4] py-16 px-4 min-h-screen  ">
     

      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 mt-[4rem]">
        <h2 className="text-2xl font-bold text-black mb-6 inline-block">
          Login
        </h2>
        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder='Enter your email address'
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-0 text-gray-700"
              aria-label="Email address"
              disabled={loading}
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full pr-10 p-2 text-gray-700 border border-gray-300 rounded-md focus:ring-0 focus:outline-none"
              aria-label="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[2.7rem] transform -translate-y-1/2 text-gray-500 cursor-pointer hover:text-primary focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeSlashIcon className="w-[1.5rem]" />
              ) : (
                <EyeIcon className="w-[1.5rem]" />
              )}
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/80 text-white py-2 rounded font-medium transition duration-200 disabled:opacity-50 cursor-pointer"
            disabled={loading}
            aria-label="Login with email and password"
          >
            {/* Loading state with spinner */}
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2.93 6.243A8.001 8.001 0 014 12H0c0 5.523 4.477 10 10 10v-4a6.002 6.002 0 01-3.07-1.757z"
                  ></path>
                </svg>
                Logging in...
              </span>
            ) : (
              'Login'
            )}

          </button>
        </form>
        <div className="my-6 flex items-center">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-4 text-gray-500">or</span>
          <hr className="flex-grow border-gray-300" />
        </div>
        <div className="">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={() => {
              setError('Google login failed.');
              toast.error('Google login failed. Please try again.', { position: 'top-right' });
            }}
            text="signin_with"
            shape="rectangular"
            theme="filled_black"
            disabled={loading}
          />
        </div>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>

      {/* terms and conditions */}
      <div className="max-w-md mx-auto mt-8 text-center text-xs text-gray-500">
        By logging in, you agree to our{' '}
        <Link  className="text-primary hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link  className="text-primary hover:underline">
          Privacy Policy
        </Link>.
      </div>
    </div>
  );
};

export default Login;





