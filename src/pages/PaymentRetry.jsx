import React, { useEffect, useState, useContext } from 'react';
import {
    FaChevronLeft,
    FaSpinner,
    FaExclamationCircle,
    FaCreditCard,
    FaShieldAlt,
    FaCheckCircle,
    FaClock,
    FaTimesCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PaymentRetry = () => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const { orderReferenceCode } = useParams();
    const navigate = useNavigate();
    const { api } = useContext(AuthContext);

    // Payment status configuration
    const paymentStatusConfig = {
        'SUCCESS': { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: FaCheckCircle },
        'PENDING': { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: FaClock },
        'FAILED': { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: FaTimesCircle },
        'REFUNDED': { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: FaCreditCard },
        'PARTIAL_REFUND': { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: FaCreditCard },
        'UNPAID': { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: FaTimesCircle },
    };

    const getPaymentStatusDisplay = (status) => {
        const s = status?.toUpperCase();
        const config = paymentStatusConfig[s] || paymentStatusConfig.UNPAID;
        const IconComponent = config.icon;
        
        return (
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.color} ${config.border} border`}>
                <IconComponent className="w-4 h-4" />
                {s?.replace('_', ' ') || 'Unpaid'}
            </span>
        );
    };

    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true);
            setError(null);
            
            if (!orderReferenceCode) {
                setError('Invalid order reference.');
                setLoading(false);
                return;
            }

            try {
                const response = await api.get(`/api/orders/${orderReferenceCode}/`);
                const fetchedOrder = response.data;
                setOrder(fetchedOrder);

                const status = fetchedOrder.payment_status?.toUpperCase();
                if (status === 'SUCCESS' || status === 'REFUNDED') {
                    toast.warn("This order is already paid. Redirecting to order details.", { autoClose: 3000 });
                    navigate(`/orders/${orderReferenceCode}`);
                    return;
                }

            } catch (err) {
                console.error('Error fetching order for retry:', err);
                const errorMessage = err.response?.status === 404
                    ? `Order #${orderReferenceCode} not found.`
                    : 'Failed to load order details. Please try again.';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderReferenceCode, navigate, api]);

    const handleInitiatePayment = async () => {
        if (!order || isProcessingPayment) return;

        setIsProcessingPayment(true);
        toast.info("Preparing secure payment...", { autoClose: false, toastId: 'payment-init' });

        try {
            const response = await api.post('/api/payments/initialize_retry/', {
                reference_code: order.reference_code,
                amount: order.total,
            });

            toast.dismiss('payment-init');

            if (response.data.success && response.data.payment_url) {
                toast.success("Redirecting to secure payment gateway...", { autoClose: 2000 });
                setTimeout(() => {
                    window.location.href = response.data.payment_url;
                }, 1500);
            } else {
                toast.error(response.data.message || "Failed to initialize payment.", { autoClose: 5000 });
            }

        } catch (err) {
            toast.dismiss('payment-init');
            console.error('Payment initialization error:', err);
            toast.error("Payment service temporarily unavailable. Please try again.", { autoClose: 5000 });
        } finally {
            setIsProcessingPayment(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-6rem)] bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="relative inline-block">
                        <FaSpinner className="animate-spin text-primary w-12 h-12 mb-4" />
                        <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-20"></div>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Order Details</h2>
                    <p className="text-gray-600">Preparing your payment information...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="h-[calc(100vh-6rem)] bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaExclamationCircle className="text-red-600 w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">Order Not Found</h1>
                    <p className="text-gray-600 mb-6">{error || "We couldn't find this order for payment."}</p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate('/orders')}
                            className="flex items-center cursor-pointer justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <FaChevronLeft className="w-4 h-4" />
                            Back to Orders
                        </button>
                        <button
                            onClick={() => navigate('/services')}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg cursor-pointer font-medium hover:bg-gray-50 transition-colors"
                        >
                            Browse Services
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const OrderItemCard = ({ item }) => (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {item.service?.image ? (
                    <img
                        src={item.service.image}
                        alt={item.service.name}
                        className="w-10 h-10 rounded object-cover"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/100x100/A0AEC0/ffffff?text=Item';
                        }}
                    />
                ) : (
                    <FaCreditCard className="text-gray-400 text-lg" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{item.service?.name}</h4>
                <p className="text-sm text-gray-500 mt-0.5">Quantity: {item.quantity}</p>
            </div>
            <div className="text-right">
                <p className="font-semibold text-gray-900">
                    ₵{parseFloat(item.total_price || item.unit_price * item.quantity).toFixed(2)}
                </p>
            </div>
        </div>
    );

    const totalAmount = parseFloat(order.total_amount || order.total || 0).toFixed(2);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-8 flex-row-reverse">
                    <button
                        onClick={() => navigate(`/orders/${orderReferenceCode}`)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors group"
                    >
                        <FaChevronLeft className="text-gray-500 group-hover:text-gray-700 transition-colors" />
                        Back to Order
                    </button>
                    <div className="">
                        <h1 className="text-xl font-bold text-gray-900">Complete Payment</h1>
                        <p className="text-gray-600">Secure payment for your order</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Order Summary */}
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Order #{order.reference_code}</h2>
                                    <p className="text-gray-600 mt-1">
                                        Created on {new Date(order.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                {getPaymentStatusDisplay(order.payment_status)}
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 text-lg">Order Items</h3>
                                <div className="space-y-3">
                                    {order.items?.map((item, index) => (
                                        <OrderItemCard key={index} item={item} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Customer Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
                        >
                            <h3 className="font-semibold text-gray-900 text-lg mb-4">Customer Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Customer Name</p>
                                    <p className="font-medium text-gray-900">{order.first_name} {order.last_name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Email</p>
                                    <p className="font-medium text-gray-900">{order.email}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Order Date</p>
                                    <p className="font-medium text-gray-900">
                                        {new Date(order.created_at).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Payment Status</p>
                                    <div className="mt-1">{getPaymentStatusDisplay(order.payment_status)}</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Payment Section */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl shadow-xl border border-gray-200 sticky top-8"
                        >
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <FaCreditCard className="text-green-600" />
                                    Payment Summary
                                </h2>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>₵{parseFloat(order.subtotal || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Delivery & Pickup</span>
                                        <span>₵{parseFloat(order.delivery_cost) + parseFloat(order.pickup_cost)}.00</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3">
                                        <div className="flex justify-between text-lg font-bold text-gray-900">
                                            <span>Total Amount</span>
                                            <span className="">₵{totalAmount}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleInitiatePayment}
                                    disabled={isProcessingPayment}
                                    className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-lg cursor-pointer bg-primary disabled:bg-primary/50 disabled:cursor-not-allowed`}
                                >
                                    <AnimatePresence mode="wait">
                                        {isProcessingPayment ? (
                                            <motion.div
                                                key="loading"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center gap-3"
                                            >
                                                <FaSpinner className="animate-spin w-5 h-5" />
                                                Processing...
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="pay"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center gap-3"
                                            >
                                                
                                                Pay ₵{totalAmount} Now
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>

                                <div className="flex items-center gap-2 text-xs text-gray-500 pt-4 border-t border-gray-100">
                                    <FaShieldAlt className="text-green-600 flex-shrink-0" />
                                    <span>Your payment is secured with 256-bit SSL encryption</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentRetry;