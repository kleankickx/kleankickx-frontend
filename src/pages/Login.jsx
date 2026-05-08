// src/pages/Login.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import logo from "../assets/logo2.png";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { mergeGuestCart, refreshCart } = useContext(CartContext);
  const { login, googleLogin, user } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const continueUrl = searchParams.get('continue');
  const from = location.state?.from || '/';
  const message = location.state?.message;
  const highlightServiceId = location.state?.highlightServiceId;
  const pendingRecovery = location.state?.pendingRecovery;

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Check for pending cart recovery after login
  useEffect(() => {
    if (user) {
      // Check sessionStorage for pending recovery
      const pendingRecoveryId = sessionStorage.getItem('pending_recovery_cart_id');
      
      if (pendingRecoveryId) {
        // Clear it immediately to avoid loops
        sessionStorage.removeItem('pending_recovery_cart_id');
        
        // Show success message
        toast.success('Welcome back! Restoring your cart...');
        
        // Navigate to cart with recovery parameter
        navigate(`/cart?recover=${pendingRecoveryId}`, { replace: true });
      } else if (pendingRecovery) {
        // Navigate to cart with recovery parameter from state
        navigate(`/cart?recover=${pendingRecovery}`, { replace: true });
      }
    }
  }, [user, navigate, pendingRecovery]);

  const handlePostLogin = async () => {
    console.log('[Login] Starting post-login actions...');
    setIsMerging(true);
    
    try {
      // Wait a moment for the session to be properly established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh cart to get authenticated state
      console.log('[Login] Refreshing cart after login...');
      await refreshCart();
      
      // Merge guest cart
      console.log('[Login] Merging guest cart...');
      const mergedCart = await mergeGuestCart();
      console.log('[Login] Merge result:', mergedCart);
      
      if (mergedCart) {
        toast.success('Cart synced with your account!', { autoClose: 3000 });
      }
    } catch (err) {
      console.error('[Login] Post-login error:', err);
      toast.warning('Login successful, but cart sync encountered an issue.', {
        autoClose: 4000,
      });
    } finally {
      setIsMerging(false);
    }

    toast.success('Logged in successfully!', { autoClose: 2000 });
    
    // Check for pending recovery from sessionStorage again
    const pendingRecoveryId = sessionStorage.getItem('pending_recovery_cart_id');
    if (pendingRecoveryId) {
      sessionStorage.removeItem('pending_recovery_cart_id');
      navigate(`/cart?recover=${pendingRecoveryId}`, { replace: true });
      return;
    }
    
    if (pendingRecovery) {
      navigate(`/cart?recover=${pendingRecovery}`, { replace: true });
      return;
    }
    
    // Navigation priority
    if (continueUrl) {
      navigate(continueUrl, { replace: true });
    } else if (highlightServiceId) {
      navigate('/services', {
        state: { highlightServiceId, showSuccessMessage: 'Welcome back!' },
        replace: true,
      });
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      console.log('[Login] Email login...');
      await login(email, password);
      console.log('[Login] Email login successful');
      await handlePostLogin();
    } catch (err) {
      console.error('[Login] Email login error:', err);
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('[Login] Google login initiated...');
      await googleLogin(credentialResponse);
      console.log('[Login] Google login successful');
      await handlePostLogin();
    } catch (err) {
      console.error('[Login] Google login error:', err);
      setError('Google login failed. Please try again.');
      toast.error('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#edf1f4] gap-2 px-4 min-h-screen flex justify-center items-center flex-col">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link to="/">
          <img src={logo} className="w-[10rem]" alt="KleanKickx Logo" />
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-lg shadow-md p-6 lg:w-[30rem] w-full"
      >
        <h2 className="text-2xl font-bold text-black mb-2">Login</h2>

        {message && (
          <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm font-medium">{message}</p>
          </div>
        )}

        {continueUrl?.includes('/vouchers') && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm font-medium">
              After login, you'll be redirected to complete your voucher purchase.
            </p>
          </div>
        )}


        {(isMerging || loading) && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-green-700 text-sm font-medium">
                {loading ? 'Logging in...' : 'Syncing your cart...'}
              </p>
            </div>
          </div>
        )}

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
              disabled={loading || isMerging}
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
              disabled={loading || isMerging}
              className="w-full pr-10 p-2 text-gray-700 border border-gray-300 rounded-md focus:ring-0 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[2.7rem] text-gray-500 hover:text-primary"
            >
              {showPassword ? <EyeSlashIcon className="w-6 h-6" /> : <EyeIcon className="w-6 h-6" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || isMerging}
            className="w-full bg-primary hover:bg-primary/80 text-white py-2 rounded font-medium transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : isMerging ? 'Syncing cart...' : 'Login'}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-4 text-gray-500">or</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <GoogleLogin
          onSuccess={handleGoogleLoginSuccess}
          onError={() => toast.error('Google login failed.')}
          width="100%"
          text="signin_with"
          shape="rectangular"
          theme="filled_black"
          disabled={loading || isMerging}
        />

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/auth/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;