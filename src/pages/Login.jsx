import React, { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import logo from "../assets/logo2.png"

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { cartExpired } = useContext(CartContext);
  const { login, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();

  // Get redirect URL from URL parameters (for voucher purchase)
  const searchParams = new URLSearchParams(location.search);
  const continueUrl = searchParams.get('continue');

  // Get the redirect path and service info from location state
  const from = location.state?.from || '/';
  const message = location.state?.message;
  const highlightServiceId = location.state?.highlightServiceId;

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLoginSuccess = () => {
    toast.success('Logged in successfully!', { 
      position: 'top-right',
      autoClose: 3000,
    });
    
    // PRIORITY 1: If there's a continue URL from voucher purchase
    if (continueUrl) {
      // Navigate directly to the voucher purchase URL
      navigate(continueUrl, { replace: true });
      return;
    }
    
    // PRIORITY 2: If there's a service to highlight
    if (highlightServiceId) {
      navigate('/services', { 
        state: { 
          highlightServiceId,
          showSuccessMessage: `Welcome back! You can now claim your free service.`
        } 
      });
      return;
    }
    
    // DEFAULT: Redirect to the page they came from or home
    navigate(from, { replace: true });
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
      // Call login and get user data
      const userData = await login(email, password);
      console.log('Login successful, user data:', userData);
      
      if (cartExpired) {
        toast.warn('Your cart was cleared due to expiration and synced with the server.', {
          position: 'top-right',
        });
      }
      
      // Call the success handler
      handleLoginSuccess();
      
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
      // Call googleLogin and get user data
      const userData = await googleLogin(credentialResponse);
      console.log('Google login successful, user data:', userData);
      
      if (cartExpired) {
        toast.warn('Your cart was cleared due to expiration and synced with the server.', {
          position: 'top-right',
        });
      }
      
      // Call the success handler
      handleLoginSuccess();
      
    } catch (err) {
      setError(err.response?.data?.error || 'Google login failed.');
      toast.error('Google login failed. Please try again.', { position: 'top-right' });
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
        className=""
      >
        <Link to="/">
          <img src={logo} className="w-[10rem]" alt="Kleankickx Logo" />
        </Link>                  
      </motion.div>
      
      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-lg shadow-md p-6 lg:w-[30rem] w-full"
      >
        <h2 className="text-2xl font-bold text-black mb-2">Login</h2>
        
        {/* Display message from Services page if exists */}
        {message && (
          <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V7z" clipRule="evenodd" />
              </svg>
              <p className="text-yellow-800 text-sm font-medium">
                {message}
              </p>
            </div>
          </div>
        )}
        
        {/* Show special message for voucher purchase redirect */}
        {continueUrl && continueUrl.includes('/vouchers?voucher=') && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-800 text-sm font-medium">
                After login, you'll be redirected to complete your voucher purchase.
              </p>
            </div>
          </div>
        )}
        
        {highlightServiceId && !message && !continueUrl && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-blue-800 text-sm font-medium">
                <span className="font-bold">Pro Tip:</span> After login, you'll be taken back to the free service you wanted to claim!
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

        <div className="">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={() => {
              setError('Google login failed.');
              toast.error('Google login failed. Please try again.', { position: 'top-right' });
            }}
            width="100%"
            text="signin_with"
            shape="rectangular"
            theme="filled_black"
            disabled={loading}
            auto_select={false}
          />
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link 
            to="/auth/register" 
            className="text-primary hover:underline"
            state={{
              from: from,
              message: message || 'Sign up to claim your free service!',
              highlightServiceId: highlightServiceId,
              // Preserve continue URL for registration too
              ...(continueUrl && { continue: continueUrl })
            }}
          >
            Register
          </Link>
        </p>
      </motion.div>

      {/* terms and conditions */}
      <div className="max-w-md mx-auto mt-8 text-center text-xs text-gray-500">
        By logging in, you agree to our{' '}
        <Link to="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>.
      </div>
    </div>
  );
};

export default Login;