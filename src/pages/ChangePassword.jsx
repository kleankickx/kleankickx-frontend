import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';


const ChangePassword = () => {
  const { accessToken, api } = useContext(AuthContext);
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);


  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:10000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormErrors({});

    try {
      await api.post(
        `${backendUrl}/api/users/password/change/`,
        {
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      toast.success('Password changed successfully.');
      navigate('/services');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        setFormErrors(data);
        toast.error('Please fix the errors below.');
      } else {
        toast.error('Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-blue-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center  mb-6">
          Change Password
        </h2>

        {formErrors.non_field_errors && (
          <div className="text-red-600 text-sm mb-4 text-center">
            {formErrors.non_field_errors[0]}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* OLD PASSWORD */}
          <div>
            <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700">
              Old Password
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                id="oldPassword"
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  setFormErrors((prev) => ({ ...prev, old_password: null }));
                }}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowOld((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                tabIndex={-1}
              >
                {showOld ? <FaEyeSlash className='cursor-pointer' /> : <FaEye className='cursor-pointer' />}
              </button>
            </div>
            {formErrors.old_password && (
              <p className="text-red-500 text-sm mt-1">{formErrors.old_password[0]}</p>
            )}
          </div>

          {/* NEW PASSWORD */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setFormErrors((prev) => ({ ...prev, new_password: null }));
                }}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md outline-none"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                tabIndex={-1}
              >
                {showNew ? <FaEyeSlash className='cursor-pointer' /> : <FaEye className='cursor-pointer' />}
              </button>
            </div>
            {formErrors.new_password && (
              <p className="text-red-500 text-sm mt-1">{formErrors.new_password[0]}</p>
            )}
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFormErrors((prev) => ({ ...prev, confirm_password: null }));
                }}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md outline-none"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                tabIndex={-1}
              >
                {showConfirm ? <FaEyeSlash className='cursor-pointer ' /> : <FaEye className='cursor-pointer ' />}
              </button>
            </div>
            {formErrors.confirm_password && (
              <p className="text-red-500 text-sm mt-1">{formErrors.confirm_password[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/80 text-white font-semibold py-2 rounded-md transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link to="/services" className="text-primary cursor-pointer hover:underline">
            Back to Services
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ChangePassword;
