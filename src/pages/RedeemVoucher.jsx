import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { 
  FaGift, FaCheckCircle, FaArrowRight, 
  FaSpinner, FaQrcode, FaCopy, FaTimes,
  FaShoppingBag, FaExclamationTriangle,
  FaCalendarAlt, FaUserFriends, FaSearch,
  FaKey, FaTag, FaClock
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const RedeemVoucher = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [voucherDetails, setVoucherDetails] = useState(null);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { api, isAuthenticated } = useContext(AuthContext);
  const { addToCart, cart } = useContext(CartContext);

  // Check for code in URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlCode = params.get('apply_voucher');
    const token = params.get('token');
    
    if (urlCode) {
      setCode(urlCode);
      if (urlCode.trim().length >= 8) {
        handleVerifyVoucher(urlCode, null);
      }
    }
    
    if (token) {
      handleVerifyVoucher(null, token);
    }
  }, [location]);

  const handleVerifyVoucher = async (voucherCode = null, token = null) => {
    if (!voucherCode && !token) {
      setError('Please enter a voucher code');
      return;
    }

    setVerifying(true);
    setError('');
    setVoucherDetails(null);

    try {
      const requestData = {};
      if (voucherCode) {
        requestData.voucher_code = voucherCode.trim().toUpperCase();
      }
      if (token) {
        requestData.token = token;
      }

      const response = await api.post('/api/vouchers/redeem/', requestData);

      if (response.data.error) {
        let errorMsg = response.data.error;
        let errorDetails = response.data.details || '';
        
        if (response.data.error === 'This voucher has already been redeemed') {
          errorMsg = 'Already redeemed';
          if (response.data.voucher?.redeemed_by) {
            errorDetails = `Used by: ${response.data.voucher.redeemed_by}`;
          }
        } else if (response.data.error === 'This voucher has expired') {
          errorMsg = 'Expired';
        } else if (response.data.error === 'This voucher has been cancelled') {
          errorMsg = 'Cancelled';
        }
        
        setError(errorDetails ? `${errorMsg}. ${errorDetails}` : errorMsg);
        
        toast.error(
          <div className="flex items-center">
            <FaTimes className="mr-2 text-red-500" />
            <span>{errorMsg}</span>
          </div>,
          { autoClose: 5000 }
        );
        return;
      }

      setVoucherDetails({
        ...response.data.voucher,
        service_id: response.data.service_id,
        service_name: response.data.service_name,
        value: response.data.value,
        is_own_voucher: response.data.is_own_voucher || false,
      });

      toast.success(
        <div className="flex items-center">
          <FaCheckCircle className="mr-2 text-green-500" />
          <span>Voucher verified successfully!</span>
        </div>,
        { autoClose: 3000 }
      );

    } catch (error) {
      console.error('Voucher verification error:', error);
      
      let errorMsg = 'Unable to verify voucher';
      if (error.response?.status === 404) {
        errorMsg = 'Invalid voucher code';
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      }
      
      setError(errorMsg);
      
      toast.error(
        <div className="flex items-center">
          <FaExclamationTriangle className="mr-2 text-red-500" />
          <span>{errorMsg}</span>
        </div>,
        { autoClose: 5000 }
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleRedeemToCart = () => {
    if (!voucherDetails) return;

    setLoading(true);
    
    try {
      if (!isAuthenticated) {
        toast.info('Please sign in to redeem your voucher');
        navigate('/auth/login', { 
          state: { 
            from: '/redeem',
            voucherCode: code 
          } 
        });
        return;
      }

      const alreadyInCart = cart.some(item => 
        item.service_id === voucherDetails.service_id && 
        item.voucher_code === voucherDetails.code
      );

      if (alreadyInCart) {
        toast.info('This voucher is already in your cart');
        navigate('/cart');
        return;
      }

      const fetchServiceDetails = async () => {
        try {
          const serviceResponse = await api.get(`/api/services/${voucherDetails.service_id}/`);
          const service = serviceResponse.data;
          
          addToCart(
            voucherDetails.service_id, 
            service.name || voucherDetails.service_name, 
            0,
            1,
            {
              is_voucher_redeem: true,
              voucher_code: voucherDetails.code,
              voucher_value: voucherDetails.value,
              voucher_id: voucherDetails.id,
              service_type: service.service_type,
              included_quantity: service.included_quantity || 1,
              is_bundle_service: service.service_type?.startsWith('PACKAGE_') || false,
              original_price: service.price,
            }
          );

          toast.success(
            <div className="flex items-center">
              <FaCheckCircle className="mr-2 text-green-500" />
              <p className="font-medium">{service.name} added to your cart!</p>
            </div>
          );

          setTimeout(() => {
            navigate('/cart');
          }, 1500);

        } catch (error) {
          console.error('Error fetching service details:', error);
          
          addToCart(
            voucherDetails.service_id, 
            voucherDetails.service_name, 
            0,
            1,
            {
              is_voucher_redeem: true,
              voucher_code: voucherDetails.code,
              voucher_value: voucherDetails.value,
              voucher_id: voucherDetails.id
            }
          );

          toast.success(
            <div className="flex items-center">
              <FaCheckCircle className="mr-2 text-green-500" />
              {voucherDetails.service_name} added to your cart!
            </div>
          );

          setTimeout(() => {
            navigate('/cart');
          }, 1500);
        }
      };

      fetchServiceDetails();

    } catch (error) {
      console.error('Redeem error:', error);
      toast.error('Failed to add voucher to cart');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCode(text);
      toast.success('Code pasted!');
      setTimeout(() => handleVerifyVoucher(text), 300);
    } catch (err) {
      toast.error('Unable to paste from clipboard');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (voucherDetails) {
      handleRedeemToCart();
    } else {
      handleVerifyVoucher(code);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const clearForm = () => {
    setCode('');
    setError('');
    setVoucherDetails(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl mb-4 border border-green-200">
            <FaGift className="text-3xl text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Redeem Your <span className="text-green-600">Gift Voucher</span>
          </h1>
          <p className="text-gray-600 text-lg">
            Enter your voucher code to claim your sneaker cleaning service
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Redemption Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Enter Voucher Code</h2>
                  <p className="text-gray-600">Gift code or token</p>
                </div>
                {code && (
                  <button
                    onClick={clearForm}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Code Input */}
                <div>
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value.toUpperCase())}
                          placeholder="XXXX-XXXX-XXXX"
                          className="w-full px-4 py-4 text-lg font-medium tracking-wider border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 uppercase transition-colors"
                          disabled={verifying || loading}
                          autoFocus
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handlePaste}
                        className="px-4 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 whitespace-nowrap"
                        disabled={verifying || loading}
                      >
                        <FaCopy />
                        Paste
                      </button>
                    </div>
                    
                    {/* Error Message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3"
                        >
                          <div className="flex items-center gap-2 text-red-600 text-sm">
                            <FaExclamationTriangle />
                            {error}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={verifying || loading || !code.trim()}
                    className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 ${
                      verifying || loading
                        ? 'bg-gray-300 cursor-not-allowed'
                        : voucherDetails
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:opacity-90'
                    }`}
                  >
                    {verifying ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Verifying...
                      </>
                    ) : loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Adding to Cart...
                      </>
                    ) : voucherDetails ? (
                      <>
                        <FaShoppingBag />
                        Add to Cart & Continue
                        <FaArrowRight />
                      </>
                    ) : (
                      <>
                        <FaSearch />
                        Verify Voucher
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <p className="text-gray-500 text-sm mb-3">OR</p>
                    <button
                      type="button"
                      onClick={() => navigate('/vouchers')}
                      className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Buy New Vouchers
                    </button>
                  </div>
                </div>
              </form>

              {/* Tips */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="font-medium text-gray-900 mb-3">Tips for success:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Codes are case-insensitive
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Check for typos (0 vs O, 1 vs I)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Vouchers expire 6 months from purchase
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Details/Instructions */}
          <div className="space-y-6">
            {/* Voucher Details or Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {voucherDetails ? (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-green-200">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FaCheckCircle className="text-2xl" />
                        <div>
                          <h2 className="text-xl font-bold">Voucher Verified</h2>
                          <p className="text-sm opacity-90">Ready to redeem</p>
                        </div>
                      </div>
                      <div className="text-sm font-mono bg-white/20 px-3 py-1 rounded-full">
                        {voucherDetails.code}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-xl">
                        <div className="text-lg font-bold text-green-700 mb-1">
                          {voucherDetails.service_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          Cleaning service included
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-500 mb-1">Value</div>
                          <div className="text-xl font-bold text-gray-900">
                            ₵{voucherDetails.value}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-500 mb-1">Expires</div>
                          <div className="font-medium text-gray-900">
                            {formatDate(voucherDetails.valid_until)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <FaCheckCircle className="text-blue-500" />
                          <div>
                            <div className="font-medium text-blue-800">Valid for redemption</div>
                            <p className="text-sm text-blue-600 mt-1">
                              This voucher is ready to be added to your cart
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FaKey className="text-xl text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">How to Redeem</h2>
                        <p className="text-gray-600">Simple 3-step process</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center flex-shrink-0 font-bold">
                          1
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Enter Code</h4>
                          <p className="text-sm text-gray-600">
                            Type or paste your unique 12-character voucher code
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center flex-shrink-0 font-bold">
                          2
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Verify & Add</h4>
                          <p className="text-sm text-gray-600">
                            We'll verify your code and add the service to cart
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center flex-shrink-0 font-bold">
                          3
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Book Service</h4>
                          <p className="text-sm text-gray-600">
                            Complete checkout to schedule your cleaning appointment
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <FaClock className="text-gray-400" />
                        <span>Most vouchers process instantly</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <button
                onClick={() => navigate('/services')}
                className="p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all flex items-center justify-center gap-3"
              >
                <FaShoppingBag className="text-gray-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Browse Services</div>
                  <div className="text-xs text-gray-500">See all cleaning options</div>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/account/vouchers')}
                className="p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all flex items-center justify-center gap-3"
              >
                <FaGift className="text-purple-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">My Vouchers</div>
                  <div className="text-xs text-gray-500">View all your vouchers</div>
                </div>
              </button>
            </motion.div>

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-blue-50 border border-blue-100 rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaUserFriends className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Need Help?</h4>
                  <p className="text-sm text-blue-700">We're here to assist you</p>
                </div>
              </div>
              <div className="text-sm text-blue-600">
                <p className="mb-2">Common issues:</p>
                <ul className="space-y-1 ml-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                    Invalid or expired code
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                    Already redeemed voucher
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                    Technical issues
                  </li>
                </ul>
                <p className="mt-3">
                  Contact: {' '}
                  <a 
                    href="mailto:support@kleankickx.com" 
                    className="text-blue-700 font-medium underline"
                  >
                    support@kleankickx.com
                  </a>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedeemVoucher;