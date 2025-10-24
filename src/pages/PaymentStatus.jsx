import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from "../context/AuthContext";
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaArrowRight, FaHome, FaReceipt, FaRedo } from 'react-icons/fa';
import { useCheckoutState } from '../hooks/useCheckoutState';
import { CartContext } from "../context/CartContext"; 

const PaymentStatus = () => {
    const { api } = useContext(AuthContext);
    // Destructure URL parameters: /payment/:status/:reference
    // 'status' is the success/failure segment, 'reference' is the ORIGINAL Order Reference
    const { reference, status } = useParams(); 
    
    // Get the cleanup functions
    const { clearCart } = useContext(CartContext);
    const { resetCheckoutState } = useCheckoutState(); 

    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Flag to control cleanup actions (only run on success path)
    const [shouldCleanup, setShouldCleanup] = useState(false);

    useEffect(() => {
        if (!reference) {
            setError("Order reference is missing.");
            setLoading(false);
            return;
        }

        const fetchOrderStatus = async () => {
            try {
                // Ensure the endpoint is correct: /api/orders/{reference}/
                const response = await api.get(`/api/orders/${reference}/`); 
                const fetchedOrder = response.data;
                setOrder(fetchedOrder);

                // Cleanup logic: Only run cleanup (cart/checkout state) if the order is confirmed paid.
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
    
    // Dedicated useEffect for cleanup to run ONLY when payment is confirmed successful
    useEffect(() => {
        if (shouldCleanup) {
            clearCart(); // Clears cart state and storage
            resetCheckoutState(); // Resets checkout form state
            // After successful payment, we only need to clear it once
            setShouldCleanup(false); 
        }
    }, [shouldCleanup, clearCart, resetCheckoutState]);


    // Loading State (No change)
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

    // Error State (No change, but robust for missing order)
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
    // Determine status based on the actual Order object fetched from the backend
    const isSuccess = order?.status === 'PROCESSING' || order?.status === 'FULFILLED';
    // Use total_amount if available, otherwise fallback to total
    const orderAmount = order?.total_amount 
        ? `₵${parseFloat(order.total_amount).toFixed(2)}` 
        : (order?.total ? `₵${parseFloat(order.total).toFixed(2)}` : '');

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${
            isSuccess 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50' 
                : 'bg-gradient-to-br from-amber-50 to-orange-50'
        }`}>
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className={`p-6 text-center ${
                    isSuccess ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}>
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            {isSuccess ? (
                                <FaCheckCircle className="h-8 w-8 text-white" />
                            ) : (
                                <FaTimesCircle className="h-8 w-8 text-white" />
                            )}
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {isSuccess ? 'Payment Successful! 🎉' : 'Payment Failed'}
                    </h1>
                    <p className="text-white text-opacity-90">
                        {isSuccess ? 'Your order has been confirmed' : 'We could not process your payment'}
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Order Summary */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium text-gray-600">Order Reference</span>
                            <span className="text-sm font-bold text-gray-900">#{order.reference_code}</span>
                        </div>
                        {orderAmount && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Amount Due</span>
                                <span className={`text-lg font-bold ${isSuccess ? 'text-green-600' : 'text-gray-900'}`}>{orderAmount}</span>
                            </div>
                        )}
                    </div>

                    {/* Status Message */}
                    <div className={`p-4 rounded-lg mb-6 ${
                        isSuccess ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                    }`}>
                        <p className={`text-sm ${
                            isSuccess ? 'text-green-700' : 'text-amber-700'
                        }`}>
                            {isSuccess 
                                ? `Your order has been successfully paid for and is now being processed. You will receive a confirmation email shortly.`
                                : `The payment for this order was not completed. The order status is currently: ${order.status}. You may retry your payment.`
                            }
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => navigate(`/orders/${reference}`)}
                            className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                isSuccess
                                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                                    : 'bg-gray-800 text-white hover:bg-gray-700 shadow-md' // Primary button for failure leads to details
                            }`}
                        >
                            <FaReceipt className="w-4 h-4" />
                            View Order Details
                            <FaArrowRight className="w-4 h-4" />
                        </button>
                        
                        {/* 🌟 NEW: Retry Payment Button for Failed Status 🌟 */}
                        {!isSuccess && (
                            <button
                                onClick={() => navigate(`/checkout/retry/${order.reference_code}`)}
                                className="w-full py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <FaRedo className="w-4 h-4" />
                                Retry Payment
                            </button>
                        )}
                        
                        <button 
                            onClick={() => navigate('/services')}
                            className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            {isSuccess ? 'Place Another Order' : 'Go Back to Services'}
                        </button>
                    </div>

                    {/* Support Info (No change) */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            Need help?{' '}
                            <a 
                                href="mailto:support@kleankickx.com"
                                className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                            >
                                Contact Support
                            </a>
                        </p>
                    </div>
                </div>

                {/* Success Confetti Effect (visual only) */}
                {isSuccess && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {/* Confetti JSX elements here */}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentStatus;