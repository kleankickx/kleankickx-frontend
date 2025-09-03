// src/components/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'; // Ensure you have heroicons installed
import 'react-toastify/dist/ReactToastify.css'; // Ensure toast styles are imported
import { motion } from 'framer-motion';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { cartExpired } = useContext(CartContext);
  const { login, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // backend URL from environment variable
  const backendUrl = import.meta.env.VITE_BACKEND_URL  || 'http://127.0.0.1:10000';

  // get the continue path from the query string
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const continuePath = searchParams.get('continue') || null;

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
      await login(email, password);
      if (cartExpired) {
        toast.warn('Your cart was cleared due to expiration and synced with the server.', {
          position: 'top-right',
        });
      }
      
      toast.success('Logged in successfully!', { position: 'top-right' });
      // navigate to the previous page or default to home
      navigate(continuePath || '/'); // Navigate to the previous page or default to home
      
      

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
      await googleLogin(credentialResponse);
      if (cartExpired) {
        toast.warn('Your cart was cleared due to expiration and synced with the server.', {
          position: 'top-right',
        });
      }
    //   await syncCartWithBackend(access);
      toast.success('Logged in with Google!', { position: 'top-right' });
      {/* navigate to the previous page */}
      navigate(continuePath || '/'); // Navigate to the previous page or default to -1

    } catch (err) {
      setError(err.response?.data?.error || 'Google login failed.');
      toast.error('Google login failed. Please try again.', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#edf1f4] py-16 px-4 min-h-screen  ">

      {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-2xl font-bold text-black mb-6 inline-block">Login</h2>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
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

            <div className="text-right -mt-2 mb-2">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/80 text-white py-2 rounded font-medium transition duration-200 disabled:opacity-50 cursor-pointer"
              disabled={loading}
              aria-label="Login with email and password"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-current"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g fill="none" fillRule="evenodd">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeOpacity="0.2"
                        strokeWidth="4"
                      />
                      <path
                        d="M12 2a10 10 0 0 1 10 10"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0 12 12"
                          to="360 12 12"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      </path>
                    </g>
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

          <div>
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
        </motion.div>

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





