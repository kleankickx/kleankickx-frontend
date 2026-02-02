import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Confetti from 'react-confetti';
import { 
  FaCheckCircle, FaGift, FaArrowRight, FaShoppingBag,
  FaRedo, FaHome, FaSmile
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const VoucherPurchaseSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const order = params.get('order');
    const status = params.get('payment_status');
    
    if (order && status === 'success') {
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
      
      // Handle window resize for confetti
      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    } else {
      // If no success parameters, redirect to vouchers page
      navigate('/vouchers');
    }
  }, [location, navigate]);

  // Stop confetti after 5 seconds
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);


  const handleViewVouchers = () => {
    navigate('/account/vouchers');
  };

  const handleBuyMore = () => {
    navigate('/vouchers');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={150}
          gravity={0.1}
          colors={['#10B981', '#059669', '#047857', '#065F46']}
        />
      )}

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full mx-auto"
      >
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <FaCheckCircle className="text-4xl" />
            </motion.div>
            
            <h1 className="text-4xl font-bold mb-3">Thank You! 🎉</h1>
            <p className="text-xl opacity-90">
              Your voucher purchase was successful
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Success Message */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaGift className="text-2xl text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Your Vouchers Are Ready!
              </h3>
              <p className="text-gray-600 mb-2">
                Your vouchers have been purchased successfully.
              </p>
              <p className="text-gray-600">
                You will receive the voucher codes via email shortly.
              </p>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-50 rounded-xl p-5 mb-8"
            >
              <h4 className="font-semibold text-gray-900 mb-4 text-center">
                What's next?
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Check your email</p>
                    <p className="text-sm text-gray-600">
                      Look for an email with your voucher codes
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Access your vouchers</p>
                    <p className="text-sm text-gray-600">
                      View and manage all your vouchers in your account
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Redeem anytime</p>
                    <p className="text-sm text-gray-600">
                      Use your vouchers when booking cleaning services
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleViewVouchers}
                  className="py-3 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition-all flex items-center justify-center gap-2"
                >
                  <FaGift />
                  My Vouchers
                </button>
                
                <button
                  onClick={handleBuyMore}
                  className="py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <FaRedo />
                  Buy More
                </button>
              </div>
              
              <button
                onClick={handleGoHome}
                className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <FaHome />
                Go to Homepage
              </button>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 pt-6 border-t border-gray-200 text-center"
            >
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
                <FaSmile className="text-green-500" />
                <span>Your support means the world to us!</span>
              </div>
              <p className="text-sm text-gray-500">
                Need help? Contact us at{' '}
                <a 
                  href="mailto:support@kleankickx.com" 
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  support@kleankickx.com
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Floating Celebration Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-green-200"
            initial={{ 
              y: -50,
              x: Math.random() * windowSize.width,
              rotate: 0
            }}
            animate={{ 
              y: windowSize.height + 100,
              rotate: 360
            }}
            transition={{
              duration: Math.random() * 8 + 6,
              repeat: Infinity,
              delay: Math.random() * 3
            }}
            style={{
              fontSize: Math.random() * 20 + 12,
            }}
          >
            {['🎉', '✨', '🎁', '👟', '⭐', '💫'][Math.floor(Math.random() * 6)]}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VoucherPurchaseSuccess;