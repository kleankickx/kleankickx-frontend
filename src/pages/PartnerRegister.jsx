// src/pages/PartnerRegister.jsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Building, Mail, Phone, User, Lock, Briefcase } from 'lucide-react';
import logo from "../assets/logo2.png";

const PartnerRegister = () => {
  const navigate = useNavigate();
  const { partnerRegister, authLoading } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    company_name: '',
    corporate_email: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'email':
        if (!value) error = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Email is invalid';
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (value.length < 8) error = 'Password must be at least 8 characters';
        break;
      case 'confirmPassword':
        if (!value) error = 'Please confirm your password';
        else if (value !== formData.password) error = 'Passwords do not match';
        break;
      case 'first_name':
        if (!value) error = 'First name is required';
        break;
      case 'last_name':
        if (!value) error = 'Last name is required';
        break;
      case 'phone_number':
        if (!value) error = 'Phone number is required';
        else if (!/^[0-9+\-\s]{10,}$/.test(value)) error = 'Invalid phone number';
        break;
      case 'company_name':
        if (!value) error = 'Company name is required';
        break;
      case 'corporate_email':
        if (!value) error = 'Corporate email is required';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Email is invalid';
        break;
      default:
        break;
    }
    
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    } else {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = [
      'email', 'password', 'confirmPassword', 'first_name', 'last_name',
      'phone_number', 'company_name', 'corporate_email'
    ];
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    try {
      const registrationData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        company_name: formData.company_name,
        corporate_email: formData.corporate_email,
      };
      
      await partnerRegister(registrationData);
      
      // Redirect to login with verification notice
      navigate('/auth/login', { 
        state: { 
          message: 'Registration successful! Please check your email to verify your account before logging in.',
          email: formData.email 
        }
      });
      
    } catch (error) {
      toast.error(error.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logo */}
        <div className="mb-8 flex items-center justify-center space-x-3">
            <img src={logo} className="w-[10rem]" alt="KleanKickx Logo" />
            <span className="text-2xl font-light text-gray-400">|</span>
            <h1 className="text-3xl font-bold text-gray-900">Partners</h1>
        </div>


        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Register as a Partner</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Two-column layout for larger screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Personal Information
                </h3>
                
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                        touched.first_name && errors.first_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{ '--tw-ring-color': '#007F03' }}
                      placeholder="John"
                    />
                  </div>
                  {touched.first_name && errors.first_name && (
                    <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                        touched.last_name && errors.last_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{ '--tw-ring-color': '#007F03' }}
                      placeholder="Doe"
                    />
                  </div>
                  {touched.last_name && errors.last_name && (
                    <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>
                  )}
                </div>

                {/* Email (Login) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Login Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                        touched.email && errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{ '--tw-ring-color': '#007F03' }}
                      placeholder="john@example.com"
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                        touched.phone_number && errors.phone_number ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{ '--tw-ring-color': '#007F03' }}
                      placeholder="+233 XX XXX XXXX"
                    />
                  </div>
                  {touched.phone_number && errors.phone_number && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone_number}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                        touched.password && errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{ '--tw-ring-color': '#007F03' }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {touched.password && errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                        touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{ '--tw-ring-color': '#007F03' }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Business Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Business Information
                </h3>
                
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                        touched.company_name && errors.company_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{ '--tw-ring-color': '#007F03' }}
                      placeholder="Your Business Name"
                    />
                  </div>
                  {touched.company_name && errors.company_name && (
                    <p className="mt-1 text-xs text-red-500">{errors.company_name}</p>
                  )}
                </div>

                {/* Corporate Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corporate Email *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      name="corporate_email"
                      value={formData.corporate_email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                        touched.corporate_email && errors.corporate_email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{ '--tw-ring-color': '#007F03' }}
                      placeholder="business@company.com"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    This will be used for all business communications
                  </p>
                  {touched.corporate_email && errors.corporate_email && (
                    <p className="mt-1 text-xs text-red-500">{errors.corporate_email}</p>
                  )}
                </div>

                {/* Info Box - Using KleanKickx brand colors */}
                <div className="rounded-lg p-4 mt-4" style={{ backgroundColor: '#E8F5E9', border: '1px solid #007F03' }}>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Building size={20} style={{ color: '#007F03' }} />
                    </div>
                    <div className="text-sm" style={{ color: '#1B5E20' }}>
                      <p className="font-medium mb-1">Why become a partner?</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Wholesale pricing on bulk orders</li>
                        <li>Priority processing and delivery</li>
                        <li>Dedicated account manager</li>
                        <li>Access to exclusive services</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="rounded-lg p-4" style={{ backgroundColor: '#FFF8E1', border: '1px solid #FFC107' }}>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Mail size={20} style={{ color: '#FFC107' }} />
                    </div>
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">Need help?</p>
                      <p>Contact our partnership team at <span style={{ color: '#007F03' }}>partners@kleankickx.com</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={authLoading}
                className="w-full text-white py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{ backgroundColor: '#007F03', '--tw-ring-color': '#007F03' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#006602'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#007F03'}
              >
                {authLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Registering...</span>
                  </div>
                ) : (
                  'Register as a Partner'
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Already have a partner account?{' '}
                <Link to="/auth/login" className="font-medium hover:underline" style={{ color: '#007F03' }}>
                  Sign in here
                </Link>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                By registering, you agree to our{' '}
                <Link to="/terms" className="hover:underline" style={{ color: '#007F03' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="hover:underline" style={{ color: '#007F03' }}>Privacy Policy</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PartnerRegister;