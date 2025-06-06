// src/components/Register.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // useEffect(() => {
  //   axios.get('http://localhost:8000/api/users/get-csrf-token/', { withCredentials: true })
  //     .then(response => {
  //       setCsrfToken(response.data.csrf_token);
  //     })
  //     .catch(error => {
  //       console.error('Error fetching CSRF token:', error);
  //       setError('Failed to initialize form. Please refresh.');
  //     });
  // }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/users/register',
        { email, password, first_name: firstName, last_name: lastName },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      setMessage(response.data.message);
     
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const idToken = 'test-token-123'; // Replace with Google Sign-In logic
      const response = await axios.post(
        'http://127.0.0.1:8000/api/users/google/login',
        { access_token: idToken },
        {
          headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      setMessage('Google signup successful. Redirecting...');
      setTimeout(() => window.location.href = '/dashboard', 1000);
    } catch (error) {
      setError(error.response?.data?.error || 'Google signup failed.');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl mb-4">Register</h2>
      {message && <p className="text-green-500 mb-4">{message}</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full rounded"
          required
        />
        <input
          type="text"
          placeholder="First Name (optional)"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="border p-2 w-full rounded"
        />
        <input
          type="text"
          placeholder="Last Name (optional)"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="border p-2 w-full rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Register
        </button>
      </form>
      <button
        onClick={handleGoogleLogin}
        className="bg-blue-500 text-white p-2 rounded w-full mt-4"
      >
        Sign Up with Google
      </button>
    </div>
  );
};

export default Register;
