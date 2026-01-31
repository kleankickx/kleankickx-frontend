// src/pages/VoucherPurchaseSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Confetti from 'react-confetti';
import { 
  FaCheckCircle, FaGift, FaArrowRight, FaShoppingBag,
  FaEnvelope, FaCopy, FaSpinner
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const VoucherPurchaseSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderNumber, setOrderNumber] = useState('');
  const [showConfetti, setShowConfetti] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [loadingVoucher, setLoadingVoucher] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    // Get order number from URL
    const params = new URLSearchParams(location.search);
    const order = params.get('order');
    const status = params.get('payment_status');
    
    if (order && status === 'success') {
      setOrderNumber(order);
      
      // Clear URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Show success message
      toast.success(
        <div className="flex items-center">
          <FaCheckCircle className="mr-2 text-green-500" />
          Voucher purchase completed successfully!
        </div>
      );
      
      // Try to fetch voucher code from localStorage
      const pendingOrder = localStorage.getItem('pending_voucher_order');
      if (pendingOrder) {
        try {
          const orderData = JSON.parse(pendingOrder);
          if (orderData.order_number === order) {
            // We can fetch the actual voucher code from API
            fetchVoucherCode(order);
          }
        } catch (e) {
          console.error('Error parsing pending order:', e);
        }
      }
      
      // Clear localStorage after 5 seconds
      setTimeout(() => {
        localStorage.removeItem('pending_voucher_order');
      }, 5000);
      
      // Stop confetti after 5 seconds
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      
      // Handle window resize for confetti
      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        clearTimeout(confettiTimer);
        window.removeEventListener('resize', handleResize);
      };
    } else {
      // If no success parameters, redirect to vouchers page
      navigate('/vouchers');
    }
  }, [location, navigate]);

  const fetchVoucherCode = async (orderNumber) => {
    setLoadingVoucher(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
      const response = await axios.get(`${API_BASE_URL}/api/vouchers/order/${orderNumber}/vouchers/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.vouchers && response.data.vouchers.length > 0) {
        setVoucherCode(response.data.vouchers[0].code);
      }
    } catch (error) {
      console.error('Error fetching voucher code:', error);
    } finally {
      setLoadingVoucher(false);
    }
  };

  const copyToClipboard = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success(`Copied voucher code: ${code}`);
  };

  const handleRedeemNow = () => {
    if (voucherCode) {
      navigate(`/services?apply_voucher=${voucherCode}`);
    } else {
      navigate('/services');
    }
  };

  const handleViewVouchers = () => {
    navigate('/account/vouchers');
  };

  const handleBuyMore = () => {
    navigate('/vouchers');
  };

  const handleShare = () => {
    if (voucherCode) {
      // Simple share functionality
      const shareText = `I just gifted you a sneaker cleaning voucher from KleanKickx! 🎁\n\nUse code: ${voucherCode}\n\nRedeem at: ${window.location.origin}/redeem`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Your KleanKickx Gift Voucher',
          text: shareText,
          url: window.location.origin,
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText);
        toast.success('Share text copied to clipboard!');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
        />
      )}
      
      {/* Floating gifts animation */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-purple-300"
            initial={{ y: -100, x: Math.random() * windowSize.width }}
            animate={{ 
              y: windowSize.height + 100,
              rotate: Math.random() * 360
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          >
            <FaGift size={24} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <FaCheckCircle className="text-5xl" />
            </motion.div>
            
            <h1 className="text-4xl font-bold mb-3">Payment Successful! 🎉</h1>
            <p className="text-xl opacity-90">
              Your voucher purchase is complete
            </p>
            {orderNumber && (
              <p className="text-sm opacity-80 mt-2">
                Order: {orderNumber}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Voucher Code Display (if available) */}
            {voucherCode ? (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-dashed border-purple-300 rounded-2xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <FaGift className="text-purple-600" />
                    <h3 className="text-lg font-semibold text-purple-900">Your Voucher Code</h3>
                  </div>
                  
                  <div className="flex items-center justify-center mb-4">
                    <code className="text-3xl font-bold text-gray-900 bg-white px-6 py-3 rounded-lg border-2 border-purple-200">
                      {voucherCode}
                    </code>
                    <button
                      onClick={() => copyToClipboard(voucherCode)}
                      className="ml-4 p-3 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                      title="Copy to clipboard"
                    >
                      <FaCopy />
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    This code has been sent to your email. Copy it to redeem now!
                  </p>
                </div>
              </motion.div>
            ) : loadingVoucher ? (
              <div className="text-center py-8">
                <FaSpinner className="animate-spin text-2xl text-purple-600 mx-auto mb-3" />
                <p className="text-gray-600">Loading your voucher code...</p>
              </div>
            ) : (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <FaEnvelope className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900">Check Your Email</h3>
                  </div>
                  <p className="text-gray-700">
                    Your voucher code has been sent to your email address.
                    Check your inbox (and spam folder) for the details.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              {voucherCode && (
                <button
                  onClick={handleRedeemNow}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 text-lg"
                >
                  <FaShoppingBag />
                  Redeem Now
                  <FaArrowRight />
                </button>
              )}
              
              <button
                onClick={handleViewVouchers}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 text-lg"
              >
                <FaGift />
                View All My Vouchers
              </button>
              
              {voucherCode && (
                <button
                  onClick={handleShare}
                  className="w-full py-3 border-2 border-purple-300 text-purple-700 rounded-xl font-medium hover:bg-purple-50 transition-all flex items-center justify-center gap-3"
                >
                  <FaEnvelope />
                  Share with a Friend
                </button>
              )}
              
              <button
                onClick={handleBuyMore}
                className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                Buy More Vouchers
              </button>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 pt-6 border-t border-gray-200"
            >
              <h4 className="font-bold text-gray-900 mb-3">What's Next?</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">📧</div>
                  <p className="text-sm text-gray-700">Check email for voucher</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">👟</div>
                  <p className="text-sm text-gray-700">Book cleaning service</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">✨</div>
                  <p className="text-sm text-gray-700">Enjoy clean sneakers!</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-6 text-center border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Need help? <a href="mailto:support@kleankickx.com" className="text-purple-600 hover:underline">Contact support</a>
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Your voucher is valid for 6 months from purchase date
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VoucherPurchaseSuccess;