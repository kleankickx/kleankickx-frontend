// src/components/VerifyEmail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.post(`http://localhost:8000/accounts/confirm-email/${key}/`, {
          withCredentials: true,
        });
        setMessage(response.data.message);
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        setTimeout(() => navigate('/dashboard'), 2000); // Redirect to dashboard after 2 seconds
      } catch (error) {
        setError(error.response?.data?.error || 'Verification failed. Please try again.');
      }
    };
    verifyEmail();
  }, [key, navigate]);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl mb-4">Email Verification</h2>
      {message && <p className="text-green-500">{message}</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default VerifyEmail;