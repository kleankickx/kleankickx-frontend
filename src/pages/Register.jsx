// src/components/Register.jsx
import { useState, useContext, useEffect  } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { CartContext } from '../context/CartContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'; 
import { AuthContext } from '../context/AuthContext';
import 'react-toastify/dist/ReactToastify.css'; // Ensure toast styles are imported
import { motion } from 'framer-motion';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { googleLogin } = useContext(AuthContext); // Assuming you have a login function in context
  const [referralCode, setReferralCode] = useState('');
  const [showReferralField, setShowReferralField] = useState(false);
  const [usingReferral, setUsingReferral] = useState(false);

  // Detect referral code from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      setUsingReferral(true);
    }
  }, []);

  // backend URL from environment variable
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

  const navigate = useNavigate();

  const refreshCartTimestamp = () => {
    try {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        if (parsedCart.items && parsedCart.timestamp) {
          parsedCart.timestamp = Date.now();
          localStorage.setItem('cart', JSON.stringify(parsedCart));
          console.log('refreshCartTimestamp: Updated cart timestamp');
        }
      }
    } catch (err) {
      console.error('refreshCartTimestamp: Failed to update timestamp', err);
    }
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailRegister = async (e) => {
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
   
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      console.log("Ref", referralCode)
      await axios.post(
        `${backendUrl}/api/users/register/`,
        { 
          email: email, 
          password: password, 
          first_name: firstName, 
          last_name: lastName, 
          referral_code: referralCode ? referralCode : null 
        },
        { withCredentials: true }
      );
      toast.success('Registration successful! Please check your email to verify.', {
        position: 'top-right',
      });
      navigate('/temp-verify-email/?email=' + encodeURIComponent(email) );
    } catch (err) {
      console.error('Registration error:', err.response?.data.email);
      setError(err.response?.data.email || 'Registration failed. Please try again.');
      toast.error('Registration failed. Please try again.', { position: 'top-right' });
      setLoading(false);
    }
  };

  const handleGoogleRegisterSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      await googleLogin(credentialResponse);
      toast.success('Registered with Google!', { position: 'top-right' });
      navigate('/');
    } catch (err) {
      console.error('Google registration error:', err.response?.data);
      setError(err.response?.data?.detail || 'Google registration failed.');
      toast.error('Google registration failed. Please try again.', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#edf1f4] py-16 px-4 min-h-screen">
      <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }} className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 mt-[4rem]">

        {/* Referral Code Banner (only shows if code detected from URL) */}
        {usingReferral && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4 flex items-center">
            <svg 
              className="h-5 w-5 text-green-500 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
            <span className="text-green-700">
              Referral code applied! You'll get a special discount after verification.
            </span>
          </div>
        )}

        <h2 className="text-2xl font-bold text-black mb-6">
          Register
        </h2>
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
        )}
        <form onSubmit={handleEmailRegister} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-0 focus:outline-none "
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
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-0 focus:outline-none"
              aria-label="First Name"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 ">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="Enter your last name"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-0 focus:outline-none"
              aria-label="Last Name"
              disabled={loading}
            />
          </div>

           {/* Referral Code Field (only shown if manually toggled or has code) */}
          {(showReferralField || usingReferral) && (
            <div>
              <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700">
                Referral Code
              </label>
              <input
                id="referralCode"
                type="text"
                placeholder="Enter referral code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-0 focus:outline-none"
                disabled={usingReferral} // Disable if code came from URL
              />
            </div>
          )}

          {/* Toggle button for referral field (hidden if code exists) */}
          {!usingReferral && (
            <button
              type="button"
              onClick={() => setShowReferralField(!showReferralField)}
              className="text-sm text-primary hover:underline focus:outline-none mb-4"
            >
              {showReferralField ? 'Hide referral code' : 'Have a referral code?'}
            </button>
          )}
          
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/80 text-white py-2 rounded font-medium transition duration-200 disabled:opacity-50 cursor-pointer"
            disabled={loading}
            aria-label="Register with email and password"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="flex items-center justify-center">
                  <svg 
                    className="animate-spin h-5 w-5 text-current" 
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g fill="none" fillRule="evenodd">
                      {/* Outer ring - subtle background */}
                      <circle 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeOpacity="0.2" 
                        strokeWidth="4"
                      />
                      
                      {/* Animated arc - more visible */}
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
                </span>
                <span>Registering...</span>
              </span>
            ) : (
              'Register'
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
            onSuccess={handleGoogleRegisterSuccess}
            onError={() => {
              setError('Google registration failed.');
              toast.error('Google registration failed. Please try again.', {
                position: 'top-right',
              });
            }}
            text="signup_with"
            shape="rectangular"
            theme="filled_black"
          />
        </div>
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </motion.div>

      {/* terms and conditions */}
      <div className="text-center mt-8 text-sm text-gray-500">
        By registering, you agree to our{' '}
        <Link className="text-primary  hover:underline">
          Terms and Conditions
        </Link>{' '}
        and{' '}
        <Link className="text-primary hover:underline">
          Privacy Policy
        </Link>.
      </div>
    </div>
  );
};



export default Register;
