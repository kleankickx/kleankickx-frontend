// src/components/VerifyEmail.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { cartExpired, } = useContext(CartContext);
  const { login } = useContext(AuthContext);
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;

    const verifyEmail = async () => {
      hasVerified.current = true;
      try {
        // Verify email
        await axios.post(
          `http://127.0.0.1:8000/api/users/verify-email/`,
          { key },
          { withCredentials: true }
        );
        // Retrieve pending credentials
        const pending = localStorage.getItem('pending_verification');
        if (!pending) {
          throw new Error('No pending verification credentials found.');
        }
        const { email, password } = JSON.parse(pending);
        // Login
        const loginResponse = await axios.post(
          'http://127.0.0.1:8000/api/users/login/',
          { email, password },
          { withCredentials: true }
        );
        const { access, refresh } = loginResponse.data;
        login(access, refresh);
        localStorage.removeItem('pending_verification');
        // // Sync cart
        // console.log('verifyEmail: Starting cart sync');
        // await fetchCartFromBackend(access);
        if (cartExpired) {
          toast.warn('Your cart was cleared due to expiration and synced with the server.', {
            position: 'top-right',
          });
        }
        // await syncCartWithBackend(access);
        setMessage('Email verified successfully!');
        toast.success('Email verified and logged in successfully!', { position: 'top-right' });
        setTimeout(() => navigate('/services'), 1000);
      } catch (error) {
        const errorMsg = error.response?.data?.detail || error.message || 'Verification failed. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg, { position: 'top-right' });
        hasVerified.current = false;
      }
    };

    verifyEmail();
  }, [navigate, cartExpired, login]);

  return (
    <div className="p-4 max-w-md mx-auto bg-[#edf1f4] min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-green-700 mb-6 text-center border-b-4 border-green-600 inline-block">
          Email Verification
        </h2>
        {message && <p className="text-green-500 text-center">{message}</p>}
        {error && (
          <p className="text-red-500 text-center">
            {error}
            {error.includes('expired') && (
              <span>
                {' '}
                <a href="/register" className="underline text-green-600 hover:text-green-700">
                  Request a new link
                </a>.
              </span>
            )}
          </p>
        )}
        {!message && !error && <p className="text-gray-600 text-center">Verifying your email...</p>}
        <p className="mt-4 text-center text-sm text-gray-600">
          Return to{' '}
          <a href="/login" className="text-green-600 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
