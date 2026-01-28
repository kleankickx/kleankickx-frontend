import React, { useEffect, useState, useContext } from 'react';
import {
  FaShoppingCart,
  FaExclamationCircle,
  FaUserCircle,
  FaBox,
  FaStore,
  FaChevronLeft,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaTruck,
  FaBroom,
  FaCheckDouble,
  FaCalendarAlt,
  FaTag,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaCreditCard,
  FaImage,
  FaExpand,
  FaCamera,
  FaTimes,
  FaHandsHelping, // New icon for self-handled
  FaShippingFast, // For regular delivery
  FaUserCheck // For self-service
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';

// Helper Components
const PaymentStatusBanner = ({ order, onRetryPayment }) => {
    const paymentStatus = order.payment_status.toUpperCase();

    if (paymentStatus === 'SUCCESS' || paymentStatus === 'REFUNDED' || paymentStatus === 'PARTIAL_REFUND') {
        return null;
    }

    const isFailed = paymentStatus === 'FAILED';

    const config = {
        icon: isFailed ? <FaTimesCircle className="text-white text-2xl" /> : <FaCreditCard className="text-white text-2xl" />,
        bgColor: isFailed ? 'bg-red-600' : 'bg-amber-500',
        borderColor: isFailed ? 'border-red-800' : 'border-amber-700',
        title: isFailed ? 'Payment Failed' : 'Payment Required',
        message: isFailed
            ? order.payment_failure_reason || "Your payment was unsuccessful. Please retry or contact support if the issue persists."
            : "This order is awaiting payment confirmation. Please complete the transaction to start processing your items.",
        retryText: isFailed ? 'Retry Payment' : 'Complete Payment'
    };

    if (paymentStatus !== 'PENDING' && !isFailed) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 mb-8 rounded-xl shadow-lg border-b-4 ${config.borderColor} ${config.bgColor} text-white`}
        >
            <div className="flex items-start md:items-center justify-between flex-wrap gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-[200px]">
                    {config.icon}
                    <div>
                        <h2 className="text-xl font-bold">{config.title}</h2>
                        <p className="mt-1 text-sm opacity-90">{config.message}</p>
                    </div>
                </div>
                <button
                    onClick={onRetryPayment}
                    className="flex-shrink-0 ml-0 md:ml-4 px-6 py-3 bg-white text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-colors text-sm cursor-pointer"
                >
                    {config.retryText}
                </button>
            </div>
        </motion.div>
    );
};

// Image Modal Component (remains the same)
const ImageModal = ({ isOpen, onClose, imageUrl, imageAlt }) => {
    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={onClose}
        >
            <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
                <button
                    onClick={onClose}
                    className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <FaTimes className="w-6 h-6" />
                </button>
                <img
                    src={imageUrl}
                    alt={imageAlt || 'Order item photo'}
                    className="w-full h-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                    Click outside or press ESC to close
                </div>
            </div>
        </motion.div>
    );
};

// Order Item Card with Image Support (remains the same)
const OrderItemCard = ({ item, onImageClick }) => {
    const hasPhoto = item.image_url || item.photo;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-white border border-gray-100 hover:shadow-sm transition-all gap-4"
        >
            <div className="flex items-start gap-4 w-full sm:w-auto">
                {/* Service Image */}
                <div className="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.service?.image ? (
                        <img
                            src={item.service.image}
                            alt={item.service.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <FaBox className="text-gray-400 text-xl" />
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <h4 className="text-base font-medium text-gray-900 truncate">{item.service.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">Quantity: {item.quantity}</p>
                    
                    {/* Item Photo (Customer Uploaded) */}
                    {hasPhoto && (
                        <div className="mt-3">
                            <div 
                                className="flex items-center gap-2 cursor-pointer group max-w-fit"
                                onClick={() => onImageClick(item.image_url || item.photo, item.service.name)}
                            >
                                <div className="relative">
                                    <img
                                        src={item.image_url || item.photo}
                                        alt={`Photo for ${item.service.name}`}
                                        className="w-10 h-10 object-cover rounded border border-gray-200 group-hover:border-blue-500 transition-colors"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded"></div>
                                    <FaExpand className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white opacity-0 group-hover:opacity-100 transition-opacity w-3 h-3" />
                                </div>
                                <span className="text-xs text-blue-600 group-hover:text-blue-800 font-medium">
                                    View uploaded photo
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="text-right w-full sm:w-auto sm:min-w-[120px]">
                <p className="text-base font-semibold text-gray-900">
                    GHS {parseFloat(item.total_price || item.unit_price * item.quantity).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    GHS {parseFloat(item.unit_price || item.price).toFixed(2)} each
                </p>
                
                {/* Photo Status Badge */}
                {!hasPhoto && (
                    <div className="mt-2 flex items-center justify-end gap-1 text-xs text-gray-500">
                        <FaCamera className="w-3 h-3" />
                        <span>No photo uploaded</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Order Items Gallery (remains the same)
const OrderItemsGallery = ({ items }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const handleImageClick = (imageUrl, serviceName) => {
        setSelectedImage({ url: imageUrl, alt: serviceName });
        setModalOpen(true);
    };

    const itemsWithPhotos = items.filter(item => item.image_url || item.photo);
    const itemsWithoutPhotos = items.filter(item => !item.image_url && !item.photo);

    return (
        <div className="space-y-6">
            {/* Image Modal */}
            <ImageModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                imageUrl={selectedImage?.url}
                imageAlt={selectedImage?.alt}
            />

            {/* Photo Gallery Section */}
            {itemsWithPhotos.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl border border-gray-200 p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Uploaded Photos</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {itemsWithPhotos.length} item{itemsWithPhotos.length !== 1 ? 's' : ''} with photos
                            </p>
                        </div>
                        <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            <FaImage className="inline mr-2" />
                            Photo Gallery
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {itemsWithPhotos.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative cursor-pointer"
                                onClick={() => handleImageClick(item.image_url || item.photo, item.service.name)}
                            >
                                <div className="aspect-square rounded-lg overflow-hidden border-2 border-transparent group-hover:border-blue-500 transition-all duration-300">
                                    <img
                                        src={item.image_url || item.photo}
                                        alt={`Photo for ${item.service.name}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="absolute bottom-2 left-2 right-2">
                                            <p className="text-white text-xs truncate">{item.service.name}</p>
                                            <p className="text-white/80 text-xs">Click to enlarge</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FaExpand className="w-3 h-3 text-gray-700" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* All Order Items */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Order Items ({items.length})
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {itemsWithPhotos.length} with photos
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                            {itemsWithoutPhotos.length} without photos
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    {items.map((item, index) => (
                        <OrderItemCard
                            key={index}
                            item={item}
                            onImageClick={handleImageClick}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// New Self-Handled Address Card Component
const SelfHandledAddressCard = () => (
    <div className="p-5 rounded-lg border border-amber-200 bg-amber-50">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-full">
                <FaHandsHelping className="text-amber-600 text-lg" />
            </div>
            <h3 className="font-semibold text-amber-800">
                Self-Handled Service
            </h3>
        </div>
        <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
                <FaUserCheck className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-medium text-amber-700">You'll handle pickup and delivery</p>
                    <p className="text-amber-600 mt-1">
                        No pickup or delivery fees included. You'll bring items to our facility 
                        and pick them up when ready.
                    </p>
                </div>
            </div>
            <div className="flex items-start gap-2 pt-3 border-t border-amber-200">
                <FaInfoCircle className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-medium text-amber-700">Facility Information</p>
                    <ul className="mt-1 space-y-1 text-amber-600">
                        <li>• Please contact us for facility location and hours</li>
                        <li>• Phone: +233 53 627 8834</li>
                        <li>• Email: support@kleankickx.com</li>
                    </ul>
                </div>
            </div>
            <div className="flex items-center gap-2 pt-3 mt-2 border-t border-amber-200">
                <FaMoneyBillWave className="text-amber-500" />
                <span className="font-medium text-amber-700">
                    Pickup/Delivery Cost: GHS 0.00 (self-handled)
                </span>
            </div>
        </div>
    </div>
);

// Regular Address Card Component
const RegularAddressCard = ({ type, address, cost }) => (
    <div className="p-5 rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center gap-3 mb-4">
            {type === 'delivery' ? (
                <>
                    <div className="p-2 bg-blue-100 rounded-full">
                        <FaShippingFast className="text-blue-600 text-lg" />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                        Delivery Address
                    </h3>
                </>
            ) : (
                <>
                    <div className="p-2 bg-green-100 rounded-full">
                        <FaStore className="text-green-600 text-lg" />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                        Pickup Address
                    </h3>
                </>
            )}
        </div>
        <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start gap-2">
                <FaMapMarkerAlt className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-medium">{address.location_name}</p>
                    <p>{address.street_address}</p>
                    <p>{address.region}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 pt-2 mt-2 border-t border-gray-100">
                <FaMoneyBillWave className="text-gray-400" />
                <span className="font-medium">
                    Cost: GHS {parseFloat(cost).toFixed(2)}
                </span>
            </div>
        </div>
    </div>
);

// Main Component
const GetOrder = () => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams] = useSearchParams();
    const { api } = useContext(AuthContext);
    const navigate = useNavigate();
    const { orderReferenceCode } = useParams();

    const handlePaymentRetry = () => {
        if (order?.total && order.reference_code) {
            toast.info(`Redirecting to payment for GHS ${parseFloat(order.total).toFixed(2)}...`, { autoClose: 2000 });
            navigate(`/checkout/retry/${order.reference_code}`);
        } else {
            toast.error("Cannot process payment. Order reference code or total amount is missing.", { autoClose: 3000 });
        }
    };

    useEffect(() => {
        const paymentStatus = searchParams.get('payment');
        
        if (paymentStatus === 'success') {
            toast.success('Payment completed successfully!');
            localStorage.removeItem('pending_order_ref');
            localStorage.removeItem('paystack_ref');
        } else if (paymentStatus === 'failed') {
            toast.error('Payment was not completed');
        }
        
        if (paymentStatus) {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await api.get(`/api/orders/${orderReferenceCode}/`);
                setOrder(response.data);
            } catch (err) {
                console.error('Error fetching order:', err);
                const errorMessage = err.response?.status === 404
                    ? 'Order not found or access denied.'
                    : 'Failed to load order details. Please try again.';
                setError(errorMessage);
                toast.error(errorMessage, {
                    position: 'top-right',
                    autoClose: 3000,
                });
            } finally {
                setLoading(false);
            }
        };

        if (!orderReferenceCode) {
            setError('Invalid order URL');
            return;
        }

        fetchOrder();
    }, [orderReferenceCode, navigate, api]);

    const getStatusDisplay = (status, isSelfHandled = false) => {
        const statusConfig = {
            pending: {
                icon: <FaInfoCircle className="text-blue-500" />,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                displayText: 'Order Pending'
            },
            processing: {
                icon: <FaSpinner className="animate-spin text-amber-500" />,
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                displayText: 'Processing'
            },
            pickup: {
                icon: isSelfHandled ? <FaUserCheck className="text-indigo-500" /> : <FaTruck className="text-indigo-500" />,
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
                displayText: isSelfHandled ? 'Ready for Drop-off' : 'Ready for Pickup'
            },
            cleaning_ongoing: {
                icon: <FaBroom className="text-purple-500" />,
                color: 'text-purple-600',
                bg: 'bg-purple-50',
                displayText: 'Cleaning in Progress'
            },
            cleaning_completed: {
                icon: <FaCheckDouble className="text-green-500" />,
                color: 'text-green-600',
                bg: 'bg-green-50',
                displayText: isSelfHandled ? 'Ready for Collection' : 'Cleaning Completed'
            },
            scheduled_for_delivery: {
                icon: <FaCalendarAlt className="text-teal-500" />,
                color: 'text-teal-600',
                bg: 'bg-teal-50',
                displayText: 'Scheduled Delivery'
            },
            delivered: {
                icon: isSelfHandled ? <FaHandsHelping className="text-emerald-500" /> : <FaCheckCircle className="text-emerald-500" />,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                displayText: isSelfHandled ? 'Collected by Customer' : 'Delivered'
            },
            cancelled: {
                icon: <FaTimesCircle className="text-red-500" />,
                color: 'text-red-600',
                bg: 'bg-red-50',
                displayText: 'Cancelled'
            },
            default: {
                icon: <FaInfoCircle className="text-gray-500" />,
                color: 'text-gray-600',
                bg: 'bg-gray-50',
                displayText: 'Unknown'
            }
        };

        const statusKey = status?.toLowerCase().replace(/ /g, '_') || 'default';
        const config = statusConfig[statusKey] || statusConfig.default;

        return (
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${config.color} ${config.bg}`}>
                {config.icon}
                <span className="ml-2 text-xs">{config.displayText}</span>
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const colorMap = {
        "redeemed_points": {
            bgFrom: "from-blue-50",
            bgTo: "to-blue-50",
            border: "border-blue-200",
            iconBg: "bg-blue-100",
            iconText: "text-blue-600",
            titleText: "text-blue-800",
            text: "text-blue-600",
            amountText: "text-blue-700",
        },
        "referral": {
            bgFrom: "from-purple-50",
            bgTo: "to-purple-50",
            border: "border-purple-200",
            iconBg: "bg-purple-100",
            iconText: "text-purple-600",
            titleText: "text-purple-800",
            text: "text-purple-600",
            amountText: "text-purple-700",
        },
        "default": {
            bgFrom: "from-green-50",
            bgTo: "to-emerald-50",
            border: "border-emerald-200",
            iconBg: "bg-emerald-100",
            iconText: "text-emerald-600",
            titleText: "text-emerald-800",
            text: "text-emerald-600",
            amountText: "text-emerald-700",
        },
    };

    const DiscountBadge = ({ order, discount, percentage }) => {
        const colorScheme = colorMap[discount.discount_type] || colorMap["default"];
        const formattedDiscountType = discount.discount_type.replace('_', ' ');
        return (
            <div className={`flex items-center gap-3 p-3 bg-gradient-to-r ${colorScheme.bgFrom} ${colorScheme.bgTo} rounded-lg border ${colorScheme.border}`}>
                <div className={`p-2 ${colorScheme.iconBg} rounded-lg`}>
                    <FaTag className={`${colorScheme.iconText} text-lg`} />
                </div>
                <div className="flex-1">
                    <p className={`text-sm font-semibold ${colorScheme.titleText} capitalize`}>
                        {formattedDiscountType} Discount
                    </p>
                    <p className={`text-xs ${colorScheme.text}`}>
                        {percentage}% discount applied
                    </p>
                </div>
                <div className={`${colorScheme.amountText} font-bold`}>
                    -GHS {parseFloat(order.subtotal * percentage / 100).toFixed(2)}
                </div>
            </div>
        );
    };

    const getPaymentStatusDisplay = (status) => {
        const statusConfig = {
            SUCCESS: {
                text: 'Successful',
                colorClasses: 'bg-emerald-100 text-emerald-800',
            },
            PENDING: {
                text: 'Pending',
                colorClasses: 'bg-amber-100 text-amber-800',
            },
            FAILED: {
                text: 'Failed',
                colorClasses: 'bg-red-100 text-red-800',
            },
            REFUNDED: {
                text: 'Refunded',
                colorClasses: 'bg-blue-100 text-blue-800',
            },
            PARTIAL_REFUND: {
                text: 'Partial Refund',
                colorClasses: 'bg-blue-100 text-blue-800',
            },
            DEFAULT: {
                text: 'N/A',
                colorClasses: 'bg-gray-100 text-gray-800',
            },
        };

        const s = status?.toUpperCase();
        const config = statusConfig[s] || statusConfig.DEFAULT;

        return (
            <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${config.colorClasses}`}
            >
                {config.text}
            </span>
        );
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="px-4 lg:px-24 py-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <button
                            onClick={() => navigate('/orders')}
                            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4 transition-colors cursor-pointer"
                        >
                            <FaChevronLeft className="text-gray-500" />
                            Back to orders
                        </button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                Order #{orderReferenceCode}
                            </h1>
                            {order?.is_self_handled && (
                                <span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                                    <FaHandsHelping className="mr-1" />
                                    Self-Handled
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                            {order?.created_at && `Placed on ${formatDate(order.created_at)}`}
                        </p>
                    </div>
                </div>

                {/* PAYMENT STATUS BANNER */}
                {order && (
                    <PaymentStatusBanner
                        order={order}
                        onRetryPayment={handlePaymentRetry}
                    />
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                        <FaSpinner className="animate-spin text-primary w-8 h-8" />
                        <p className="text-gray-600">Loading order details...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-white rounded-xl shadow-md border border-red-200">
                        <FaExclamationCircle className="text-red-500 w-10 h-10" />
                        <p className="text-gray-700 max-w-md text-center">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium shadow-md"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Order Content */}
                <AnimatePresence>
                    {order && !loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                        >
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Customer & Order Info */}
                                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                                    <div className="w-full flex justify-between items-center border-gray-200 border-b pb-6">
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900">
                                                Order Information
                                            </h2>
                                            {order.is_self_handled && (
                                                <p className="text-sm text-amber-600 mt-1">
                                                    <FaHandsHelping className="inline mr-1" />
                                                    You'll handle pickup and delivery yourself
                                                </p>
                                            )}
                                        </div>
                                        {order && (
                                            <div className="">
                                                {getStatusDisplay(order.status, order.is_self_handled)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 mb-3">CUSTOMER DETAILS</h3>
                                            <div className="flex items-start gap-3 mb-4">
                                                <FaUserCircle className="text-gray-400 w-6 h-6" />
                                                <div>
                                                    <p className="font-medium">
                                                        {order.first_name || 'N/A'} {order.last_name || 'N/A'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{order.email || ''}</p>
                                                    {order.phone_number && (
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            <FaPhone className="inline mr-1" />
                                                            {order.phone_number}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 mb-3">ORDER SUMMARY</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Order Ref</span>
                                                    <span className="font-medium">{order.reference_code}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Order Date</span>
                                                    <span className="font-medium">{formatDate(order.created_at)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Payment Method</span>
                                                    <span className="font-medium capitalize">
                                                        {order.payment_method || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Payment Status</span>
                                                    {getPaymentStatusDisplay(order.payment_status)}
                                                </div>
                                                {order.is_self_handled && (
                                                    <div className="flex justify-between pt-2 border-t border-gray-100">
                                                        <span className="text-gray-600">Service Type</span>
                                                        <span className="font-medium text-amber-600">
                                                            Self-Handled
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Discount Display */}
                                {order.discounts_applied?.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-3"
                                    >
                                        {order.discounts_applied?.map((discount, index) => {
                                            const percentage = discount.discount_type === "redeemed_points"
                                                ? order.redeemed_discount_percentage
                                                : discount.percentage;

                                            return (
                                                <DiscountBadge key={index} order={order} discount={discount} percentage={percentage} />
                                            );
                                        })}
                                    </motion.div>
                                )}

                                {/* Order Items with Photos */}
                                {order.items && order.items.length > 0 && (
                                    <OrderItemsGallery items={order.items} />
                                )}

                                {/* Delivery & Pickup Section */}
                                {order.is_self_handled ? (
                                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                                        <h2 className="text-xl font-semibold mb-6 text-gray-900 border-gray-200 border-b pb-4">
                                            Service Information
                                        </h2>
                                        <SelfHandledAddressCard />
                                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-700 flex items-start">
                                                <FaInfoCircle className="mr-2 mt-0.5 flex-shrink-0" />
                                                <span>
                                                    <strong>Important:</strong> After payment, please bring your items to our facility 
                                                    for cleaning. We'll notify you when they're ready for collection.
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                ) : (order.delivery_address || order.pickup_address) && (
                                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                                        <h2 className="text-xl font-semibold mb-6 text-gray-900 border-gray-200 border-b pb-4">
                                            Delivery & Pickup
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {order.delivery_address && (
                                                <RegularAddressCard type="delivery" address={order.delivery_address} cost={order.delivery_cost} />
                                            )}
                                            {order.pickup_address && (
                                                <RegularAddressCard type="pickup" address={order.pickup_address} cost={order.pickup_cost} />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Order Total */}
                                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 top-8">
                                    <h2 className="text-xl font-semibold mb-6 text-gray-900 border-gray-200 border-b pb-4">
                                        Order Total
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-medium">GHS {parseFloat(order.subtotal || order.total).toFixed(2)}</span>
                                        </div>

                                        {order.discounts_applied?.map((discount, index) => {
                                            const isRedeemedPoints = discount.discount_type === "redeemed_points";
                                            const percentageToDisplay = isRedeemedPoints
                                                ? (order.redeemed_discount_percentage || 0)
                                                : (discount.percentage || 0);
                                            const discountAmount = parseFloat(order.subtotal * percentageToDisplay / 100).toFixed(2);
                                            const formattedDiscountType = discount.discount_type.replace('_', ' ');

                                            return (
                                                <div key={index} className="flex justify-between text-emerald-600">
                                                    <span className='capitalize'>
                                                        {formattedDiscountType} Discount ({percentageToDisplay}%)
                                                    </span>
                                                    <span className="font-medium">-GHS {discountAmount}</span>
                                                </div>
                                            );
                                        })}

                                        {/* Pickup/Delivery Fees */}
                                        {order.is_self_handled ? (
                                            <div className="flex justify-between text-amber-600">
                                                <span className="flex items-center gap-1">
                                                    <FaHandsHelping className="w-3 h-3" />
                                                    Self-Handled Service
                                                </span>
                                                <span className="font-medium">GHS 0.00</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Delivery Fee</span>
                                                    <span className="font-medium">
                                                        {order.delivery_cost ? `GHS ${parseFloat(order.delivery_cost).toFixed(2)}` : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Pickup Fee</span>
                                                    <span className="font-medium">
                                                        {order.pickup_cost ? `GHS ${parseFloat(order.pickup_cost).toFixed(2)}` : 'N/A'}
                                                    </span>
                                                </div>
                                            </>
                                        )}

                                        <div className="border-t border-gray-200 pt-4 mt-2 flex justify-between">
                                            <span className="font-semibold text-lg">Total Amount</span>
                                            <div className="text-right">
                                                {order.discounts_applied?.length > 0 && (
                                                    <div className="text-sm text-gray-400 line-through mb-1">
                                                        GHS {(parseFloat(order.subtotal) +
                                                            (order.is_self_handled ? 0 : parseFloat(order.delivery_cost || 0)) +
                                                            (order.is_self_handled ? 0 : parseFloat(order.pickup_cost || 0))).toFixed(2)}
                                                    </div>
                                                )}
                                                <span className="font-bold text-xl text-emerald-600">
                                                    GHS {parseFloat(order.total_amount || order.total).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Self-Handled Note */}
                                        {order.is_self_handled && (
                                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <p className="text-xs text-amber-700">
                                                    <FaInfoCircle className="inline mr-1" />
                                                    No pickup or delivery fees included. You'll handle transportation yourself.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                

                                {/* Photo Summary */}
                                {order.items && order.items.some(item => item.image_url || item.photo) && (
                                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                                        <h2 className="text-xl font-semibold mb-6 text-gray-900 border-gray-200 border-b pb-4">
                                            Photo Summary
                                        </h2>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FaImage className="text-blue-600" />
                                                    <span className="text-gray-700">Items with photos</span>
                                                </div>
                                                <span className="font-bold text-blue-600">
                                                    {order.items.filter(item => item.image_url || item.photo).length}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FaBox className="text-gray-600" />
                                                    <span className="text-gray-700">Items without photos</span>
                                                </div>
                                                <span className="font-bold text-gray-600">
                                                    {order.items.filter(item => !item.image_url && !item.photo).length}
                                                </span>
                                            </div>
                                            <div className="pt-4 border-t border-gray-200">
                                                <p className="text-sm text-gray-500">
                                                    <FaInfoCircle className="inline mr-2 text-gray-400" />
                                                    Click on any photo to view it in full size
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Customer Support */}
                                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                                    <h2 className="text-xl font-semibold mb-6 text-gray-900 border-gray-200 border-b pb-4">
                                        Need Help?
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 rounded-full">
                                                <FaEnvelope className="text-green-600 w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Email us at</p>
                                                <a
                                                    href="mailto:support@kleankickx.com"
                                                    className="font-medium text-gray-900 hover:text-green-600 transition-colors"
                                                >
                                                    support@kleankickx.com
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 rounded-full">
                                                <FaPhone className="text-green-600 w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Call us</p>
                                                <a
                                                    href="tel:+233536278834"
                                                    className="font-medium text-gray-900 hover:text-green-600 transition-colors"
                                                >
                                                    +233 53 627 8834
                                                </a>
                                            </div>
                                        </div>
                                        {order.is_self_handled && (
                                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <p className="text-xs text-amber-700 flex items-center">
                                                    <FaInfoCircle className="inline mr-1" />
                                                    For facility location and hours, please contact us.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <Footer />
        </div>
    );
};

export default GetOrder;