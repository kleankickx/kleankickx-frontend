// src/components/Register.jsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import 'react-toastify/dist/ReactToastify.css'; // Ensure toast styles are imported

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { cartExpired } = useContext(CartContext);
  const { login } = useContext(AuthContext); // Assuming you have a login function in context
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
        'http://127.0.0.1:8000/api/users/register/',
        { email, password, first_name: firstName, last_name: lastName },
        { withCredentials: true }
      );
      refreshCartTimestamp(); // Prevent cart expiration during verification
      // Store credentials securely for VerifyEmail
      localStorage.setItem('pending_verification', JSON.stringify({ email, password }));
      toast.success('Registration successful! Please check your email to verify.', {
        position: 'top-right',
      });
      navigate('/temp-verify-email');
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
      const response = await axios.post(
        'http://127.0.0.1:8000/api/users/google-login/',
        { token: credentialResponse.credential },
        { withCredentials: true }
      );
      const { access, refresh } = response.data;
      login(access, refresh); // Assuming you have a login function in context
      toast.success('Registered with Google!', { position: 'top-right' });
      navigate('/dashboard');
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
        <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">
          Register
        </h2>
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
        )}
        <form onSubmit={handleEmailRegister} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-green-600 focus:border-green-600"
              aria-label="Email address"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-green-600 focus:border-green-600"
              aria-label="Password"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-green-600 focus:border-green-600"
              aria-label="First Name"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:ring-green-600 focus:border-green-600"
              aria-label="Last Name"
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium transition duration-200 disabled:opacity-50"
            disabled={loading}
            aria-label="Register with email and password"
          >
            {loading ? 'Registering...' : 'Register'}
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
          <Link to="/login" className="text-green-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};



export default Register;
