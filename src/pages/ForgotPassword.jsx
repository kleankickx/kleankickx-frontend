import { useState, useContext } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from '../context/AuthContext';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { api } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/users/password/reset/', { email });
      toast.success('Password reset email sent. Check your inbox.');
      setSuccess(true);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to send reset email.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/api/users/password/reset/', { email });
      toast.success('New password reset link sent. Check your inbox.');
    } catch (err) {
      const status = err.response?.status;
      let errorMessage = 'Failed to process request. Please try again.';

      if (status === 429) {
            // DRF's default throttle message is often in err.response.data.detail
            errorMessage = err.response.data?.detail || "You are requesting too quickly. Please wait a moment.";
            toast.warn(errorMessage);
      }
      else if (status === 404 || status === 400) {
            // Handle specific messages from your views (like "No user exists" or "Already verified")
            errorMessage = err.response.data?.error || err.response.data?.message;
            toast.error(errorMessage);
        } 
      else {
            // Handle other general errors
            toast.error(errorMessage);
      }
      setError(errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setSuccess(false);
    setEmail('');
    setError('');
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex items-center justify-center bg-gradient-to-br from-green-50 to-white px-4">
      <div className="bg-white shadow-xl rounded-xl w-full max-w-md p-8 space-y-6 border border-gray-100">
        
        {!success ? (
          <>
            <div className="text-center">
              <h2 className="text-3xl font-extrabold mb-2">Forgot Password</h2>
              <p className="text-sm text-gray-600">Enter your email to receive a password reset link.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`peer w-full px-4 py-3 border ${
                    error ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 bg-transparent`}
                  placeholder=" "
                />
                <label
                  htmlFor="email"
                  className="absolute left-4 top-3 text-gray-500 text-base transition-all duration-200 transform origin-left bg-white p-0.5 pointer-events-none
                    peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0
                    peer-focus:scale-75 peer-focus:-translate-y-6 peer-focus:text-primary
                    peer-not-placeholder-shown:scale-75 peer-not-placeholder-shown:-translate-y-6"
                >
                  Email address
                </label>
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer bg-primary hover:bg-primary/80 text-white py-2.5 rounded-md font-medium transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="text-center text-sm text-gray-500">
              <Link to="/auth/login" className="text-primary hover:underline">
                Back to Login
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircleIcon className="w-16 h-16 text-green-500" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
              <p className="text-gray-600">
                We've sent a password reset link to:
              </p>
              <p className="text-primary font-medium">{email}</p>
            </div>

            <div className="space-y-4 pt-4">
              <button
                onClick={handleResendLink}
                disabled={loading}
                className="w-full cursor-pointer bg-primary hover:bg-primary/80 text-white py-2.5 rounded-md font-medium transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : "Didn't receive link? Request new one"}
              </button>
              
              <button
                onClick={handleResetForm}
                className="w-full cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-md font-medium transition"
              >
                Use different email
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Link 
                to="/auth/login" 
                className="text-primary hover:underline text-sm"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;