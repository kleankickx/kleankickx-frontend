import { useState, useContext } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from '../context/AuthContext';


const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { api } = useContext(AuthContext)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/users/password/reset/', { email });
      toast.success('Password reset email sent. Check your inbox.');
      setEmail('');
    } catch (err) {
      const errMsg = err.response?.data?.email?.[0] || 'Failed to send reset email.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white px-4">
      <div className="bg-white shadow-xl rounded-xl w-full max-w-md p-8 space-y-6 border border-gray-100">
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
              className={`peer w-full px-3 pt-5 pb-2 border ${
                error ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none transition`}
              placeholder=" "
            />
            <label
              htmlFor="email"
              className="absolute text-gray-500 left-3 top-2 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-1 peer-focus:text-sm peer-focus:text-gray-500"
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
          <Link to="/login" className="text-primary hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
