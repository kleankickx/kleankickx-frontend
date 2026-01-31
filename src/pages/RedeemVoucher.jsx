import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { 
  FaGift, FaCheckCircle, FaArrowRight, 
  FaSpinner, FaQrcode, FaCopy, FaTimes,
  FaShoppingBag, FaExclamationTriangle,
  FaCalendarAlt, FaUserFriends
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const RedeemVoucher = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [voucherDetails, setVoucherDetails] = useState(null);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { api, isAuthenticated } = useContext(AuthContext);
  const { addToCart, cart } = useContext(CartContext);

  // Check for code in URL params (from "Redeem This Voucher" button)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlCode = params.get('apply_voucher');
    const token = params.get('token');
    
    console.log('URL Params:', { urlCode, token }); // Debug log
    
    if (urlCode) {
        setCode(urlCode);
        // Only auto-verify if code looks valid
        if (urlCode.trim().length >= 8) {
        handleVerifyVoucher(urlCode, null);
        }
    }
    
    if (token) {
        // If token exists, verify using token only
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
        // Prepare request data
        const requestData = {};
        if (voucherCode) {
        requestData.voucher_code = voucherCode.trim().toUpperCase();
        }
        if (token) {
        requestData.token = token;
        }

        const response = await api.post('/api/vouchers/redeem/', requestData);

        if (response.data.error) {
        // Handle specific error cases with better messages
        let errorMsg = response.data.error;
        let errorDetails = response.data.details || '';
        
        // Create a more user-friendly error message
        if (response.data.error === 'This voucher has already been redeemed') {
            errorMsg = `Voucher already redeemed`;
            if (response.data.voucher?.redeemed_by) {
            errorDetails = `Used by: ${response.data.voucher.redeemed_by}`;
            }
            if (response.data.voucher?.redeemed_at) {
            const redeemedDate = new Date(response.data.voucher.redeemed_at).toLocaleDateString();
            errorDetails += ` on ${redeemedDate}`;
            }
        } else if (response.data.error === 'This voucher has expired') {
            errorMsg = `Voucher expired`;
            if (response.data.voucher?.valid_until) {
            const expiryDate = new Date(response.data.voucher.valid_until).toLocaleDateString();
            errorDetails = `Expired on: ${expiryDate}`;
            }
        } else if (response.data.error === 'This voucher has been cancelled') {
            errorMsg = `Voucher cancelled`;
            errorDetails = 'This voucher is no longer valid';
        } else if (response.data.error === 'This voucher is pending payment') {
            errorMsg = `Voucher not activated`;
            errorDetails = 'This voucher has not been paid for yet';
        } else if (response.data.error === 'Voucher not found') {
            errorMsg = `Invalid voucher code`;
            errorDetails = 'Please check the code and try again';
        }
        
        setError(errorDetails ? `${errorMsg}. ${errorDetails}` : errorMsg);
        
        // Show toast with appropriate icon and message
        if (response.data.error.includes('already been redeemed')) {
            toast.error(
            <div className="flex items-center">
                <FaTimes className="mr-2 text-red-500" />
                <span>{errorMsg}. {errorDetails}</span>
            </div>,
            { autoClose: 5000 }
            );
        } else if (response.data.error.includes('expired') || response.data.error.includes('cancelled')) {
            toast.error(
            <div className="flex items-center">
                <FaTimes className="mr-2 text-red-500" />
                <span>{errorMsg}. {errorDetails}</span>
            </div>,
            { autoClose: 5000 }
            );
        } else {
            toast.error(errorMsg);
        }
        
        return;
        }

        // Success - store voucher details
        setVoucherDetails({
        ...response.data.voucher,
        service_id: response.data.service_id,
        service_name: response.data.service_name,
        value: response.data.value,
        is_own_voucher: response.data.is_own_voucher || false,
        message: response.data.message || null
        });

        // Show success message
        if (response.data.is_own_voucher) {
        toast.info(
            <div className="flex items-center">
            <FaCheckCircle className="mr-2 text-blue-500" />
            <span>{response.data.message || 'This is your own voucher. You can use it!'}</span>
            </div>,
            { autoClose: 4000 }
        );
        } else {
        toast.success(
            <div className="flex items-center">
            <FaCheckCircle className="mr-2 text-green-500" />
            <span>{response.data.message || 'Voucher verified! Ready to redeem'}</span>
            </div>,
            { autoClose: 4000 }
        );
        }

    } catch (error) {
        console.error('Voucher verification error:', error);
        
        // Handle network errors or other issues
        let errorMsg = 'Unable to verify voucher. Please try again.';
        
        if (error.response?.status === 404) {
        errorMsg = 'Voucher not found. Please check the code and try again.';
        } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
        } else if (error.response?.data?.token) {
        errorMsg = error.response.data.token[0];
        } else if (error.response?.data?.voucher_code) {
        errorMsg = error.response.data.voucher_code[0];
        }
        
        setError(errorMsg);
        
        // Show error toast
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
        // Check if user is authenticated
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

        // Check if voucher service is already in cart
        const alreadyInCart = cart.some(item => 
        item.service_id === voucherDetails.service_id && 
        item.voucher_code === voucherDetails.code
        );

        if (alreadyInCart) {
        toast.info('This voucher is already in your cart');
        navigate('/cart');
        return;
        }

        // Fetch service details to get package info
        const fetchServiceDetails = async () => {
        try {
            const serviceResponse = await api.get(`/api/services/${voucherDetails.service_id}/`);
            const service = serviceResponse.data;
            
            // Check if this is a bundle service
            const isBundle = service?.service_type?.startsWith('PACKAGE_');
            const includedQuantity = service?.included_quantity || 1;
            
            // Add voucher service to cart with proper package info
            addToCart(
            voucherDetails.service_id, 
            service.name || voucherDetails.service_name, 
            0, // Price is 0 for vouchers
            1, // Quantity
            {
                is_voucher_redeem: true,
                voucher_code: voucherDetails.code,
                voucher_value: voucherDetails.value,
                voucher_id: voucherDetails.id,
                service_type: service.service_type,
                included_quantity: service.included_quantity || 1,
                is_bundle_service: service.service_type?.startsWith('PACKAGE_') || false,
                original_price: service.price, // For display purposes
                // Add any other fields you need
            }
            );

            toast.success(
            <div className="flex items-center">
                <FaCheckCircle className="mr-2 text-green-500" />
                <div>
                <p className="font-medium">{service.name} added to your cart!</p>
                {isBundle && (
                    <p className="text-sm text-gray-600">
                    {includedQuantity}-pair bundle via voucher
                    </p>
                )}
                </div>
            </div>
            );

            // Navigate to cart after 1.5 seconds
            setTimeout(() => {
            navigate('/cart');
            }, 1500);

        } catch (error) {
            console.error('Error fetching service details:', error);
            
            // Fallback - add without service details
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
      toast.success('Code pasted from clipboard!');
      // Auto-verify after paste
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

  const handleScanQR = () => {
    setShowCamera(true);
    toast.info('QR Scanner will be available soon!');
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Redeem Your <span className="text-purple-600">Gift Voucher</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Enter your voucher code to claim your sneaker cleaning service
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Redemption Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <FaGift className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Enter Voucher Code</h2>
                    <p className="text-sm opacity-90">Gift code or token</p>
                  </div>
                </div>
                <button
                  onClick={clearForm}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Code Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voucher Code
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX-XXXX"
                      className="w-full px-4 py-4 text-lg font-bold text-center tracking-widest border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase transition-all duration-300 group-hover:border-purple-400"
                      disabled={verifying || loading}
                      autoFocus
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                      <button
                        type="button"
                        onClick={handlePaste}
                        className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Paste from clipboard"
                        disabled={verifying || loading}
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                  
                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div className="flex items-center gap-2 text-red-700">
                          <FaExclamationTriangle />
                          <span className="text-sm font-medium">{error}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={verifying || loading || !code.trim()}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95"
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
                        <FaCheckCircle />
                        Verify Voucher
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleScanQR}
                    className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <FaQrcode />
                    Scan QR Code
                  </button>
                </div>
              </form>

              {/* Info Tips */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="font-medium text-gray-900 mb-3">Tips:</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Codes are case-insensitive</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Check for typos (0 vs O, 1 vs I)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Vouchers expire 6 months from purchase</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Voucher Details / Instructions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Voucher Details Card */}
            {voucherDetails ? (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-green-200">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-2xl" />
                    <div>
                      <h2 className="text-xl font-bold">Voucher Verified! ✅</h2>
                      <p className="text-sm opacity-90">Ready to redeem</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-bold text-lg text-gray-900">
                        {voucherDetails.service_name}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Value:</span>
                      <span className="font-bold text-xl text-green-600">
                        ₵{voucherDetails.value}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Expires:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(voucherDetails.valid_until)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Code:</span>
                      <code className="font-mono font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded">
                        {voucherDetails.code}
                      </code>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      Click "Add to Cart & Continue" to claim your free cleaning service
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Instructions Card */
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <FaUserFriends className="text-2xl" />
                    <div>
                      <h2 className="text-xl font-bold">How to Redeem</h2>
                      <p className="text-sm opacity-90">Step-by-step guide</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Enter Code</h4>
                        <p className="text-sm text-gray-600">
                          Type or paste your unique voucher code
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Verify</h4>
                        <p className="text-sm text-gray-600">
                          We'll check the code validity and details
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Add to Cart</h4>
                        <p className="text-sm text-gray-600">
                          The service will be added to your cart for free
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Checkout</h4>
                        <p className="text-sm text-gray-600">
                          Complete checkout to schedule your cleaning
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <FaCalendarAlt />
                      <span className="font-medium">Need Help?</span>
                    </div>
                    <p className="text-sm text-blue-600">
                      Contact support at{' '}
                      <a href="mailto:support@kleankickx.com" className="underline">
                        support@kleankickx.com
                      </a>{' '}
                      for assistance with voucher redemption.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/services')}
                className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2 text-gray-700 hover:text-primary"
              >
                <FaShoppingBag />
                Browse Services
              </button>
              
              <button
                onClick={() => navigate('/account/vouchers')}
                className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2 text-gray-700 hover:text-purple-600"
              >
                <FaGift />
                My Vouchers
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RedeemVoucher;