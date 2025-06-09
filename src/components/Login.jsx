// src/components/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { cartExpired } = useContext(CartContext);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

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
      navigate('/dashboard');
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
        { access_token: credentialResponse.credential },
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
      navigate('/dashboard');
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
        <h2 className="text-2xl font-bold text-green-700 mb-6 text-center border-b-4 border-green-600 inline-block">
          Login to KleanKickx
        </h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleEmailLogin} className="space-y-4">
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
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium transition duration-200 disabled:opacity-50"
            disabled={loading}
            aria-label="Login with email and password"
          >
            {loading ? 'Logging in...' : 'Login'}
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
          <Link href="/register" className="text-green-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
