// src/pages/AccountVouchers.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaGift, FaCopy, FaCheckCircle, FaClock, 
  FaUser, FaSpinner,
  FaArrowRight, FaShoppingBag, FaTag
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

const AccountVouchers = () => {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { api } = useContext(AuthContext);
  
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    // Check for payment success message in URL
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment_status');
    const orderNumber = params.get('order');
    
    if (paymentStatus === 'success' && orderNumber) {
      toast.success(
        <div className="flex items-center">
          <FaCheckCircle className="mr-2 text-green-500" />
          Payment successful! Your vouchers have been created.
        </div>
      );
      
      // Clear the URL parameters
      const newUrl = '/account/vouchers';
      window.history.replaceState({}, document.title, newUrl);
    }
    
    fetchUserVouchers();
  }, [location]);

  const fetchUserVouchers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get(`/api/vouchers/user-vouchers/`);
      
      setVouchers(response.data);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      
      if (error.response?.status === 401) {
        toast.error('Please login to view your vouchers');
        navigate('/login');
      } else {
        toast.error('Failed to load vouchers');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied: ${code}`);
    
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (validUntil) => {
    const now = new Date();
    const validDate = new Date(validUntil);
    const diffTime = validDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getStatusBadge = (status, validUntil) => {
    const daysRemaining = getDaysRemaining(validUntil);
    
    if (status === 'REDEEMED') {
      return { 
        color: 'bg-blue-100 text-blue-800', 
        text: 'Redeemed',
        icon: FaCheckCircle 
      };
    } else if (status === 'EXPIRED' || daysRemaining <= 0) {
      return { 
        color: 'bg-gray-100 text-gray-800', 
        text: 'Expired',
        icon: FaClock 
      };
    } else if (daysRemaining <= 7) {
      return { 
        color: 'bg-amber-100 text-amber-800', 
        text: `Expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
        icon: FaClock 
      };
    } else {
      return { 
        color: 'bg-green-100 text-green-800', 
        text: 'Active',
        icon: FaCheckCircle 
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-green-600 mx-auto mb-4" /> {/* Changed to green */}
          <p className="text-gray-600">Loading your vouchers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Vouchers</h1>
              <p className="text-gray-600 mt-2">
                {vouchers.length === 0 
                  ? "You don't have any vouchers yet"
                  : `You have ${vouchers.length} voucher${vouchers.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
            <Link
              to="/vouchers"
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-2" // Changed to green gradient
            >
              <FaGift />
              Buy More Vouchers
            </Link>
          </div>
        </div>

        {/* Success Banner */}
        {location.search.includes('payment_status=success') && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg"> {/* Changed to green */}
            <div className="flex items-center">
              <FaCheckCircle className="text-green-500 mr-3" size={24} />
              <div>
                <h3 className="font-bold text-green-800">Payment Successful!</h3>
                <p className="text-green-700">Your vouchers have been created. Check your email for the codes.</p>
              </div>
            </div>
          </div>
        )}

        {vouchers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"> {/* Changed to green */}
                <FaGift className="text-4xl text-green-600" /> {/* Changed to green */}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Vouchers Yet</h3>
              <p className="text-gray-600 mb-8">
                Purchase vouchers to gift cleaning services to friends and family, or redeem them for your own sneakers!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/vouchers"
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2" // Changed to green
                >
                  <FaGift />
                  Browse Vouchers
                </Link>
                <Link
                  to="/services"
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <FaShoppingBag />
                  Book Cleaning
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Active Vouchers */}
            <div className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Active Vouchers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vouchers
                  .filter(v => v.status === 'ACTIVE' && getDaysRemaining(v.valid_until) > 0)
                  .map((voucher) => {
                    const statusBadge = getStatusBadge(voucher.status, voucher.valid_until);
                    const StatusIcon = statusBadge.icon;
                    
                    return (
                      <div key={voucher.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white"> {/* Changed to green */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FaTag />
                              <span className="font-bold">{voucher.voucher_type}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                              <StatusIcon className="inline mr-1" size={12} />
                              {statusBadge.text}
                            </span>
                          </div>
                        </div>

                        <div className="p-6">
                          {/* Voucher Code */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Voucher Code
                            </label>
                            <div className="flex items-center">
                              <code className="flex-1 bg-gray-50 px-4 py-3 rounded-lg font-mono text-lg font-bold text-gray-900 border border-gray-200">
                                {voucher.code}
                              </code>
                              <button
                                onClick={() => copyToClipboard(voucher.code)}
                                className="ml-3 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Copy to clipboard"
                              >
                                <FaCopy className={copiedCode === voucher.code ? 'text-green-600' : 'text-gray-600'} /> {/* Changed to green */}
                              </button>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center text-sm text-gray-600">
                              <FaClock className="mr-2 flex-shrink-0" />
                              <span>Valid until: {formatDate(voucher.valid_until)}</span>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600">
                              <FaUser className="mr-2 flex-shrink-0" />
                              <span>Value: ₵{voucher.purchase_price}</span>
                            </div>
                            
                            {voucher.service_name && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Service:</span> {voucher.service_name}
                              </div>
                            )}
                          </div>

                          {/* Action Button - Removed share button */}
                          <button
                            onClick={() => navigate(`/redeem?apply_voucher=${voucher.code}`)}
                            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2" // Changed to green
                          >
                            Redeem This Voucher
                            <FaArrowRight />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Redeemed/Expired Vouchers */}
            {vouchers.some(v => v.status !== 'ACTIVE' || getDaysRemaining(v.valid_until) <= 0) && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Redeemed & Expired Vouchers</h2>
                <div className="bg-white rounded-xl shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Voucher Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Valid Until
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Redeemed On
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {vouchers
                          .filter(v => v.status !== 'ACTIVE' || getDaysRemaining(v.valid_until) <= 0)
                          .map((voucher) => {
                            const statusBadge = getStatusBadge(voucher.status, voucher.valid_until);
                            
                            return (
                              <tr key={voucher.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <code className="font-mono text-sm text-gray-900">
                                    {voucher.code}
                                  </code>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {voucher.voucher_type}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                                    {statusBadge.text}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(voucher.valid_until)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {voucher.redeemed_at ? formatDate(voucher.redeemed_at) : '—'}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AccountVouchers;