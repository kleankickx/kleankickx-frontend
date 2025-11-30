import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from "../context/AuthContext";
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaArrowRight, FaHome, FaReceipt, FaRedo } from 'react-icons/fa';
import { useCheckoutState } from '../hooks/useCheckoutState';
import { CartContext } from "../context/CartContext"; 
import { motion, AnimatePresence } from 'framer-motion';

const PaymentStatus = () => {
    const { api } = useContext(AuthContext);
    const { reference, status } = useParams(); 
    const { clearCart } = useContext(CartContext);
    const { resetCheckoutState } = useCheckoutState(); 
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [shouldCleanup, setShouldCleanup] = useState(false);

    useEffect(() => {
        if (!reference) {
            setError("Order reference is missing.");
            setLoading(false);
            return;
        }

        const fetchOrderStatus = async () => {
            try {
                const response = await api.get(`/api/orders/${reference}/`); 
                const fetchedOrder = response.data;
                setOrder(fetchedOrder);

                if (fetchedOrder.status === 'PROCESSING' || fetchedOrder.status === 'FULFILLED') {
                    setShouldCleanup(true);
                }

            } catch (err) {
                console.error("Failed to fetch order status:", err);
                setError("Could not retrieve order details. Please check your Orders page.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrderStatus();
    }, [reference, api]);
    
    useEffect(() => {
        if (shouldCleanup) {
            clearCart();
            resetCheckoutState();
            setShouldCleanup(false); 
        }
    }, [shouldCleanup, clearCart, resetCheckoutState]);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    const cardVariants = {
        hidden: { 
            opacity: 0, 
            y: 50,
            scale: 0.9
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.8,
                delay: 0.2
            }
        }
    };

    const headerVariants = {
        hidden: { opacity: 0, y: -30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 20,
                stiffness: 200,
                delay: 0.4
            }
        }
    };

    const contentVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.6
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 25,
                stiffness: 200
            }
        }
    };

    const iconVariants = {
        hidden: { 
            opacity: 0, 
            scale: 0,
            rotate: -180 
        },
        visible: {
            opacity: 1,
            scale: 1,
            rotate: 0,
            transition: {
                type: "spring",
                damping: 15,
                stiffness: 200,
                duration: 0.8,
                delay: 0.3
            }
        }
    };

    const pulseVariants = {
        pulse: {
            scale: [1, 1.05, 1],
            opacity: [0.2, 0.4, 0.2],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    // Loading State
    if (loading) {
        return (
            <div className="h-[calc(100vh-5rem)] bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <FaSpinner className="animate-spin h-8 w-8 text-green-600" />
                            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Verifying Payment</h2>
                    <p className="text-gray-600 mb-6">We're confirming your payment details. This will just take a moment.</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                            <FaExclamationTriangle className="h-10 w-10 text-red-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Transaction Error</h2>
                    <p className="text-gray-600 mb-2">{error}</p>
                    <p className="text-sm text-gray-500 mb-6">Reference: **{reference}**. Please contact support if this issue persists.</p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => navigate('/')}
                            className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <FaHome className="w-4 h-4" />
                            Go to Homepage
                        </button>
                        <button 
                            onClick={() => navigate('/orders')}
                            className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            View All Orders
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Success/Failure States
    const isSuccess = order?.status === 'PROCESSING' || order?.status === 'FULFILLED';
    const orderAmount = order?.total_amount 
        ? `₵${parseFloat(order.total_amount).toFixed(2)}` 
        : (order?.total ? `₵${parseFloat(order.total).toFixed(2)}` : '');

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className={`min-h-screen flex items-center justify-center p-4 ${
                isSuccess 
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50' 
                    : 'bg-gradient-to-br from-amber-50 to-orange-50'
            }`}
        >
            <motion.div
                variants={cardVariants}
                className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden"
            >
                {/* Header */}
                <motion.div
                    variants={headerVariants}
                    className={`p-6 text-center ${
                        isSuccess ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}
                >
                    <motion.div 
                        variants={iconVariants}
                        className="flex justify-center mb-4"
                    >
                        <div className="relative">
                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                {isSuccess ? (
                                    <FaCheckCircle className="h-8 w-8 text-white" />
                                ) : (
                                    <FaTimesCircle className="h-8 w-8 text-white" />
                                )}
                            </div>
                            {isSuccess && (
                                <motion.div
                                    variants={pulseVariants}
                                    animate="pulse"
                                    className="absolute inset-0 bg-white bg-opacity-30 rounded-full"
                                />
                            )}
                        </div>
                    </motion.div>
                    <motion.h1 
                        variants={headerVariants}
                        className="text-2xl font-bold text-white mb-2"
                    >
                        {isSuccess ? 'Payment Successful! 🎉' : 'Payment Failed'}
                    </motion.h1>
                    <motion.p 
                        variants={headerVariants}
                        className="text-white text-opacity-90"
                    >
                        {isSuccess ? 'Your order has been confirmed' : 'We could not process your payment'}
                    </motion.p>
                </motion.div>

                {/* Content */}
                <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    className="p-6"
                >
                    {/* Order Summary */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-gray-50 rounded-xl p-4 mb-6"
                    >
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium text-gray-600">Order Reference</span>
                            <span className="text-sm font-bold text-gray-900">#{order.reference_code}</span>
                        </div>
                        {orderAmount && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Total Cost</span>
                                <span className={`text-lg font-bold ${isSuccess ? 'text-green-600' : 'text-gray-900'}`}>{orderAmount}</span>
                            </div>
                        )}
                    </motion.div>

                    {/* Status Message */}
                    <motion.div
                        variants={itemVariants}
                        className={`p-4 rounded-lg mb-6 ${
                            isSuccess ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                        }`}
                    >
                        <p className={`text-sm ${
                            isSuccess ? 'text-green-700' : 'text-amber-700'
                        }`}>
                            {isSuccess 
                                ? `Your order has been successfully paid for and is now being processed. You will receive a confirmation email shortly.`
                                : `The payment for this order was not completed. The order status is currently: ${order.status}. You may retry your payment.`
                            }
                        </p>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col gap-3"
                    >
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/orders/${reference}`)}
                            className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                isSuccess
                                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                                    : 'bg-gray-800 text-white hover:bg-gray-700 shadow-md'
                            }`}
                        >
                            <FaReceipt className="w-4 h-4" />
                            View Order Details
                            <FaArrowRight className="w-4 h-4" />
                        </motion.button>
                        
                        {/* Retry Payment Button for Failed Status */}
                        {!isSuccess && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(`/checkout/retry/${order.reference_code}`)}
                                className="w-full py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <FaRedo className="w-4 h-4" />
                                Retry Payment
                            </motion.button>
                        )}
                        
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/services')}
                            className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            {isSuccess ? 'Place Another Order' : 'Go Back to Services'}
                        </motion.button>
                    </motion.div>

                    {/* Support Info */}
                    <motion.div
                        variants={itemVariants}
                        className="mt-6 pt-4 border-t border-gray-200"
                    >
                        <p className="text-xs text-gray-500 text-center">
                            Need help?{' '}
                            <a 
                                href="mailto:support@kleankickx.com"
                                className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                            >
                                Contact Support
                            </a>
                        </p>
                    </motion.div>
                </motion.div>

                {/* Success Confetti Effect */}
                {isSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                        className="absolute inset-0 pointer-events-none overflow-hidden"
                    >
                        {/* Confetti JSX elements here */}
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default PaymentStatus;