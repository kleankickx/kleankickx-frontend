// src/components/Register.jsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { CartContext } from '../context/CartContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'; 
import { AuthContext } from '../context/AuthContext';
import 'react-toastify/dist/ReactToastify.css'; // Ensure toast styles are imported

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { googleLogin } = useContext(AuthContext); // Assuming you have a login function in context

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
      await axios.post(
        `${backendUrl}/api/users/register/`,
        { email, password, first_name: firstName, last_name: lastName },
        { withCredentials: true }
      );
      refreshCartTimestamp(); // Prevent cart expiration during verification
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
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 mt-[4rem]">
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
          
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/80 text-white py-2 rounded font-medium transition duration-200 disabled:opacity-50 cursor-pointer"
            disabled={loading}
            aria-label="Register with email and password"
          >
            {loading ? (
              <span className="flex items-center justify-center">
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
      </div>

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
