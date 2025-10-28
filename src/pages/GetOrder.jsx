// import React, { useEffect, useState, useContext } from 'react';
// import {
//   FaShoppingCart,
//   FaExclamationCircle,
//   FaUserCircle,
//   FaBox,
//   FaStore,
//   FaChevronLeft,
//   FaInfoCircle, 
//   FaCheckCircle, 
//   FaTimesCircle, 
//   FaSpinner,
//   FaTruck,
//   FaBroom,
//   FaCheckDouble,
//   FaCalendarAlt,
//   FaTag,
//   FaPercentage,
//   FaPhone,
//   FaEnvelope,
//   FaMapMarkerAlt,
//   FaMoneyBillWave
// } from 'react-icons/fa';
// import { toast } from 'react-toastify';
// import { AuthContext } from '../context/AuthContext';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useNavigate, useParams } from 'react-router-dom';


// const GetOrder = () => {
//   const [order, setOrder] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const { isAuthenticated, user, api } = useContext(AuthContext);
//   const navigate = useNavigate();
//   const { orderReferenceCode } = useParams();

//   useEffect(() => {
//     const fetchOrder = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         const response = await api.get(`/api/orders/${orderReferenceCode}/`);
//         setOrder(response.data);
//       } catch (err) {
//         console.error('Error fetching order:', err);
//         setError('Failed to load order details');
//         toast.error('Failed to load order', {
//           position: 'top-right',
//           autoClose: 3000,
//         });
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (!orderReferenceCode) {
//       setError('Invalid order URL');
//       navigate('/orders');
//       return;
//     }
    
//     fetchOrder();
//   }, [orderReferenceCode, navigate]);

//   const getStatusDisplay = (status) => {
//     const statusConfig = {
//       pending: {
//         icon: <FaInfoCircle className="text-blue-500" />,
//         color: 'text-blue-600',
//         bg: 'bg-blue-50',
//         displayText: 'Pending'
//       },
//       processing: {
//         icon: <FaSpinner className="animate-spin text-amber-500" />,
//         color: 'text-amber-600',
//         bg: 'bg-amber-50',
//         displayText: 'Processing'
//       },
//       pickup: {
//         icon: <FaTruck className="text-indigo-500" />,
//         color: 'text-indigo-600',
//         bg: 'bg-indigo-50',
//         displayText: 'Ready for Pickup'
//       },
//       cleaning_ongoing: {
//         icon: <FaBroom className="text-purple-500" />,
//         color: 'text-purple-600',
//         bg: 'bg-purple-50',
//         displayText: 'Cleaning in Progress'
//       },
//       cleaning_completed: {
//         icon: <FaCheckDouble className="text-green-500" />,
//         color: 'text-green-600',
//         bg: 'bg-green-50',
//         displayText: 'Cleaning Completed'
//       },
//       scheduled_for_delivery: {
//         icon: <FaCalendarAlt className="text-teal-500" />,
//         color: 'text-teal-600',
//         bg: 'bg-teal-50',
//         displayText: 'Scheduled Delivery'
//       },
//       delivered: {
//         icon: <FaCheckCircle className="text-emerald-500" />,
//         color: 'text-emerald-600',
//         bg: 'bg-emerald-50',
//         displayText: 'Delivered'
//       },
//       cancelled: {
//         icon: <FaTimesCircle className="text-red-500" />,
//         color: 'text-red-600',
//         bg: 'bg-red-50',
//         displayText: 'Cancelled'
//       },
//       default: {
//         icon: <FaInfoCircle className="text-gray-500" />,
//         color: 'text-gray-600',
//         bg: 'bg-gray-50',
//         displayText: 'Unknown'
//       }
//     };

//     const statusKey = status?.toLowerCase().replace(/ /g, '_') || 'default';
//     const config = statusConfig[statusKey] || statusConfig.default;
    
//     return (
//       <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${config.color} ${config.bg}`}>
//         {config.icon} <span className="ml-2">{config.displayText}</span>
//       </span>
//     );
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const OrderItemCard = ({ item }) => (
//     <motion.div
//       initial={{ opacity: 0, y: 10 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.2 }}
//       className="flex items-center justify-between p-4 rounded-lg bg-white border border-gray-100 hover:shadow-sm transition-all"
//     >
//       <div className="flex items-center gap-4">
//         <div className="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
//           {item.service?.image ? (
//             <img
//               src={item.service.image}
//               alt={item.service.name}
//               className="w-full h-full object-cover"
//             />
//           ) : (
//             <FaBox className="text-gray-400 text-xl" />
//           )}
//         </div>
//         <div>
//           <h4 className="text-base font-medium text-gray-900">{item.service.name}</h4>
//           <p className="text-xs text-gray-500 mt-1">Quantity: {item.quantity}</p>
//         </div>
//       </div>
//       <div className="text-right">
//         <p className="text-base font-semibold text-gray-900">
//           GHS {parseFloat(item.total_price || item.price * item.quantity).toFixed(2)}
//         </p>
//         <p className="text-xs text-gray-500 mt-1">
//           GHS {parseFloat(item.unit_price || item.price).toFixed(2)} each
//         </p>
//       </div>
//     </motion.div>
//   );

//   const AddressCard = ({ type, address }) => (
//     <div className="p-5 rounded-lg border border-gray-200 bg-white">
//       <div className="flex items-center gap-3 mb-4">
//         {type === 'delivery' ? (
//           <>
//             <div className="p-2 bg-blue-100 rounded-full">
//               <FaTruck className="text-blue-600 text-lg" />
//             </div>
//             <h3 className="font-semibold text-gray-900">
//               Delivery Address
//             </h3>
//           </>
//         ) : (
//           <>
//             <div className="p-2 bg-green-100 rounded-full">
//               <FaStore className="text-green-600 text-lg" />
//             </div>
//             <h3 className="font-semibold text-gray-900">
//               Pickup Address
//             </h3>
//           </>
//         )}
//       </div>
//       <div className="space-y-2 text-sm text-gray-700">
//         <div className="flex items-start gap-2">
//           <FaMapMarkerAlt className="text-gray-400 mt-0.5 flex-shrink-0" />
//           <div>
//             <p className="font-medium">{address.location_name}</p>
//             <p>{address.street_address}</p>
//             <p>{address.region}</p>
//           </div>
//         </div>
//         <div className="flex items-center gap-2 pt-2 mt-2 border-t border-gray-100">
//           <FaMoneyBillWave className="text-gray-400" />
//           <span className="font-medium">
//             Cost: GHS {parseFloat(address.cost).toFixed(2)}
//           </span>
//         </div>
//       </div>
//     </div>
//   );

  

// // Define a color map for different discount types
// const colorMap = {
//   "redeemed_points": {
//     bgFrom: "from-blue-50",
//     bgTo: "to-blue-50",
//     border: "border-blue-200",
//     iconBg: "bg-blue-100",
//     iconText: "text-blue-600",
//     titleText: "text-blue-800",
//     text: "text-blue-600",
//     amountText: "text-blue-700",
//   },
//   "referral": {
//     bgFrom: "from-purple-50",
//     bgTo: "to-purple-50",
//     border: "border-purple-200",
//     iconBg: "bg-purple-100",
//     iconText: "text-purple-600",
//     titleText: "text-purple-800",
//     text: "text-purple-600",
//     amountText: "text-purple-700",
//   },
//   "default": { // Use a default color for other types
//     bgFrom: "from-green-50",
//     bgTo: "to-emerald-50",
//     border: "border-emerald-200",
//     iconBg: "bg-emerald-100",
//     iconText: "text-emerald-600",
//     titleText: "text-emerald-800",
//     text: "text-emerald-600",
//     amountText: "text-emerald-700",
//   },
// };

// const DiscountBadge = ({ order, discount, percentage }) => {
//     // Get the color scheme based on the discount type
//     const colorScheme = colorMap[discount.discount_type] || colorMap["default"];
//     const formattedDiscountType = discount.discount_type.replace('_', ' ');
//     return (
//         <div className={`flex items-center gap-3 p-3 bg-gradient-to-r ${colorScheme.bgFrom} ${colorScheme.bgTo} rounded-lg border ${colorScheme.border}`}>
//             <div className={`p-2 ${colorScheme.iconBg} rounded-lg`}>
//                 <FaTag className={`${colorScheme.iconText} text-lg`} />
//             </div>
//             <div className="flex-1">
//                 <p className={`text-sm font-semibold ${colorScheme.titleText} capitalize`}>
//                     {formattedDiscountType} Discount  
//                 </p>
//                 <p className={`text-xs ${colorScheme.text}`}>
//                     {percentage}% discount applied
//                 </p>
//             </div>
//             <div className={`${colorScheme.amountText} font-bold`}>
//                 -GHS {parseFloat(order.subtotal * percentage / 100).toFixed(2)}
//             </div>
//         </div>
//     );
// };

//   return (
//     <div className="bg-gray-50 min-h-screen">
//       <div className="px-4 lg:px-24 py-8">
//         {/* Header Section */}
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
//           <div>
//             <button
//               onClick={() => navigate('/orders')}
//               className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4 transition-colors"
//             >
//               <FaChevronLeft className="text-gray-500" />
//               Back to orders
//             </button>
//             <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
//               Order #{orderReferenceCode}
//             </h1>
//             <p className="text-gray-500 text-sm mt-1">
//               {order?.created_at && `Placed on ${formatDate(order.created_at)}`}
//             </p>
//           </div>
//           {order && (
//             <div className="w-full sm:w-auto">
//               {getStatusDisplay(order.status)}
//             </div>
//           )}
//         </div>

//         {/* Loading State */}
//         {loading && (
//           <div className="flex flex-col items-center justify-center py-16 space-y-4">
//             <FaSpinner className="animate-spin text-primary text-4xl" />
//             <p className="text-gray-600">Loading order details...</p>
//           </div>
//         )}

//         {/* Error State */}
//         {error && !loading && (
//           <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-gray-50 rounded-xl">
//             <FaExclamationCircle className="text-red-500 text-4xl" />
//             <p className="text-gray-700 max-w-md text-center">{error}</p>
//             <button
//               onClick={() => window.location.reload()}
//               className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
//             >
//               Try Again
//             </button>
//           </div>
//         )}

//         {/* Order Content */}
//         {order && !loading && (
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//             {/* Main Content */}
//             <div className="lg:col-span-2 space-y-6">
//               {/* Customer & Order Info */}
//               <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
//                 <h2 className="text-xl font-semibold mb-6 text-gray-900 border-gray-200 border-b pb-4">
//                   Order Information
//                 </h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <h3 className="text-sm font-medium text-gray-500 mb-3">CUSTOMER DETAILS</h3>
//                     <div className="flex items-center gap-3 mb-4">
//                       <FaUserCircle className="text-gray-400 text-2xl" />
//                       <div>
//                         <p className="font-medium">
//                           {order.first_name || 'N/A'} {order.last_name || 'N/A'}
//                         </p>
//                         <p className="text-sm text-gray-500">{order.email}</p>
//                       </div>
//                     </div>
//                   </div>
//                   <div>
//                     <h3 className="text-sm font-medium text-gray-500 mb-3">ORDER SUMMARY</h3>
//                     <div className="space-y-2">
//                       <div className="flex justify-between">
//                         <span className="text-gray-600">Order ID</span>
//                         <span className="font-medium">{order.reference_code}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-gray-600">Order Date</span>
//                         <span className="font-medium">{formatDate(order.created_at)}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-gray-600">Payment Method</span>
//                         <span className="font-medium capitalize">{order.payment_method || 'Paystack'}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Discount Display */}
//               {order.discounts_applied?.length > 0 && (
//                 <motion.div
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.3 }}
//                   className="space-y-3"
//                 >
//                   {order.discounts_applied?.map((discount, index) => {
//                     // Determine the percentage based on the discount type
//                     const percentage = discount.discount_type === "redeemed_points"
//                         ? order.redeemed_discount_percentage 
//                         : discount.percentage;

//                     return (
//                         <DiscountBadge key={index} order={order} discount={discount} percentage={percentage} />
//                     );
//                   })}
//                 </motion.div>
//               )}

//               {/* Order Items */}
//               <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
//                 <h2 className="text-xl font-semibold mb-6 text-gray-900 border-gray-200 border-b pb-4">
//                   Order Items ({order.items?.length || 0})
//                 </h2>
//                 {order.items?.length > 0 ? (
//                   <div className="space-y-4">
//                     {order.items.map((item, index) => (
//                       <OrderItemCard key={index} item={item} />
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-8">
//                     <FaBox className="mx-auto text-gray-300 text-4xl" />
//                     <p className="text-gray-500 mt-2">No items found in this order</p>
//                   </div>
//                 )}
//               </div>

//               {/* Delivery & Pickup */}
//               {(order.delivery_address || order.pickup_address) && (
//                 <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
//                   <h2 className="text-xl font-semibold mb-6 text-gray-900 border-gray-200 border-b pb-4">
//                     Delivery & Pickup
//                   </h2>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     {order.delivery_address && (
//                       <AddressCard type="delivery" address={order.delivery_address} />
//                     )}
//                     {order.pickup_address && (
//                       <AddressCard type="pickup" address={order.pickup_address} />
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Sidebar */}
//             <div className="space-y-6">
//               {/* Order Total */}
//               <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
//                 <h2 className="text-xl font-semibold mb-6 text-gray-900 border-gray-200 border-b pb-4">
//                   Order Total
//                 </h2>
//                 <div className="space-y-4">
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Subtotal</span>
//                     <span className="font-medium">GHS {parseFloat(order.subtotal || order.total).toFixed(2)}</span>
//                   </div>
                  
//                   {order.discounts_applied?.map((discount, index) => {
//                         // Check if the current discount is the "redeemed_points" type
//                         const isRedeemedPoints = discount.discount_type === "redeemed_points";

//                         // Determine the percentage to display
//                         // Use the specific percentage from the order object if it's the redeemed points discount
//                         const percentageToDisplay = isRedeemedPoints
//                             ? (order.redeemed_discount_percentage || 0)
//                             : (discount.percentage || 0);

//                         // Calculate the discounted amount
//                         const discountAmount = parseFloat(order.subtotal * percentageToDisplay / 100).toFixed(2);

//                         // Format the discount type for a clean display
//                         const formattedDiscountType = discount.discount_type.replace('_', ' ');

//                         return (
//                             <div key={index} className="flex justify-between text-emerald-600">
//                                 <span className='capitalize'>
//                                     {formattedDiscountType} Discount ({percentageToDisplay}%)
//                                 </span>
//                                 <span className="font-medium">-GHS {discountAmount}</span>
//                             </div>
//                         );
//                     })}

//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Delivery Fee</span>
//                     <span className="font-medium">
//                       {order.delivery_address?.cost ? `GHS ${parseFloat(order.delivery_address.cost).toFixed(2)}` : 'N/A'}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Pickup Fee</span>
//                     <span className="font-medium">
//                       {order.pickup_address?.cost ? `GHS ${parseFloat(order.pickup_address.cost).toFixed(2)}` : 'N/A'}
//                     </span>
//                   </div>
                  
//                   <div className="border-t border-gray-200 pt-4 mt-2 flex justify-between">
//                     <span className="font-semibold text-lg">Total Amount</span>
//                     <div className="text-right">
//                       {order.discounts_applied?.length > 0 && (
//                         <div className="text-sm text-gray-400 line-through mb-1">
//                           GHS {(parseFloat(order.subtotal || order.total) + 
//                               parseFloat(order.delivery_address?.cost || 0) + 
//                               parseFloat(order.pickup_address?.cost || 0)).toFixed(2)}
//                         </div>
//                       )}
//                       <span className="font-bold text-xl text-emerald-600">
//                         GHS {parseFloat(order.total_amount || order.total).toFixed(2)}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Customer Support */}
//               <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
//                 <h2 className="text-xl font-semibold mb-6 text-gray-900 border-gray-200 border-b pb-4">
//                   Need Help?
//                 </h2>
//                 <div className="space-y-4">
//                   {/* <div className="flex items-center gap-3">
//                     <div className="p-2 bg-blue-100 rounded-full">
//                       <FaPhone className="text-blue-600" />
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-500">Call us at</p>
//                       <a href="tel:+1234567890" className="font-medium text-gray-900 hover:text-blue-600">
//                         +1 (234) 567-890
//                       </a>
//                     </div>
//                   </div> */}
//                   <div className="flex items-center gap-3">
//                     <div className="p-2 bg-green-100 rounded-full">
//                       <FaEnvelope className="text-green-600" />
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-500">Email us at</p>
//                       <a 
//                         href="mailto:support@kleankickx.comsupport" 
//                         className="font-medium text-gray-900 hover:text-green-600"
//                       >
//                         support@kleankickx.com
//                       </a>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default GetOrder;



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
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';


// Helper Components
const PaymentStatusBanner = ({ order, onRetryPayment }) => {
    // Uses the STATUS_CHOICES from your Django model: PENDING, SUCCESS, FAILED
    const paymentStatus = order.payment_status.toUpperCase();

    if (paymentStatus === 'SUCCESS' || paymentStatus === 'REFUNDED' || paymentStatus === 'PARTIAL_REFUND') {
        return null;
    }

    const isPending = paymentStatus === 'PENDING';
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

    if (!isPending && !isFailed) {
        return null; // Don't show the banner for unknown or other statuses
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 mb-8 rounded-xl shadow-lg border-b-4 ${config.borderColor} ${config.bgColor} text-white`}
        >
            <div className="flex items-start md:items-center justify-between flex-wrap gap-4">
                <div className="flex items-start md:items-center gap-4 flex-1 min-w-[200px]">
                    {config.icon}
                    <div>
                        <h2 className="text-xl font-bold">{config.title}</h2>
                        <p className="mt-1 text-sm opacity-90">{config.message}</p>
                    </div>
                </div>
                <button
                    onClick={onRetryPayment}
                    className="flex-shrink-0 ml-0 md:ml-4 px-6 py-3 bg-white text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-colors text-sm"
                >
                    {config.retryText}
                </button>
            </div>
        </motion.div>
    );
};

const GetOrder = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { api } = useContext(AuthContext);
  const navigate = useNavigate();
  const { orderReferenceCode } = useParams();

  // Placeholder function for handling payment retry/completion
  const handlePaymentRetry = () => {
      console.log(order?.total, order.reference_code)
      if (order?.total && order.reference_code) {
          toast.info(`Redirecting to payment for GHS ${parseFloat(order.total).toFixed(2)}...`, { autoClose: 2000 });
          // Redirection to a dedicated checkout page for retry payment
          navigate(`/checkout/retry/${order.reference_code}`);
      } else {
          toast.error("Cannot process payment. Order reference code or total amount is missing.", { autoClose: 3000 });
      }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);

      try {
        // --- REAL API CALL ---
        // This relies on your backend API to return the comprehensive order object,
        // including the payment_status (e.g., 'SUCCESS', 'PENDING', 'FAILED')
        // and payment_failure_reason (if applicable).
        const response = await api.get(`/api/orders/${orderReferenceCode}/`);
        setOrder(response.data);
      } catch (err) {
        console.error('Error fetching order:', err);
        // Check for 404/403 errors and provide a more specific message
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
      // navigate('/orders'); // Uncomment this if you want to redirect immediately on invalid URL
      return;
    }

    fetchOrder();
  }, [orderReferenceCode, navigate, api]); // Added 'api' to dependency array

  // ... (rest of the component's helper functions and render logic remain the same)

  const getStatusDisplay = (status) => {
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
        icon: <FaTruck className="text-indigo-500" />,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        displayText: 'Ready for Pickup'
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
        displayText: 'Cleaning Completed'
      },
      scheduled_for_delivery: {
        icon: <FaCalendarAlt className="text-teal-500" />,
        color: 'text-teal-600',
        bg: 'bg-teal-50',
        displayText: 'Scheduled Delivery'
      },
      delivered: {
        icon: <FaCheckCircle className="text-emerald-500" />,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        displayText: 'Delivered'
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
        {config.icon} <span className="ml-2">{config.displayText}</span>
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

  const OrderItemCard = ({ item }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-between p-4 rounded-lg bg-white border border-gray-100 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
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
        <div>
          <h4 className="text-base font-medium text-gray-900">{item.service.name}</h4>
          <p className="text-xs text-gray-500 mt-1">Quantity: {item.quantity}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-base font-semibold text-gray-900">
          GHS {parseFloat(item.total_price || item.unit_price * item.quantity).toFixed(2)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          GHS {parseFloat(item.unit_price || item.price).toFixed(2)} each
        </p>
      </div>
    </motion.div>
  );

  const AddressCard = ({ type, address, cost }) => (
    <div className="p-5 rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center gap-3 mb-4">
        {type === 'delivery' ? (
          <>
            <div className="p-2 bg-blue-100 rounded-full">
              <FaTruck className="text-blue-600 text-lg" />
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


  // Define a color map for different discount types
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
    "default": { // Use a default color for other types
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
    // Get the color scheme based on the discount type
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
    const s = status?.toUpperCase();
    switch(s) {
        case 'SUCCESS':
            return <span className='font-semibold text-emerald-600'>Successful</span>;
        case 'PENDING':
            return <span className='font-semibold text-amber-600'>Pending</span>;
        case 'FAILED':
            return <span className='font-semibold text-red-600'>Failed</span>;
        case 'REFUNDED':
        case 'PARTIAL_REFUND':
            return <span className='font-semibold text-blue-600'>{s.replace('_', ' ')}</span>;
        default:
            return <span className='font-semibold text-gray-600'>N/A</span>;
    }
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Order #{orderReferenceCode}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {order?.created_at && `Placed on ${formatDate(order.created_at)}`}
            </p>
          </div>
          {order && (
            <div className="w-full sm:w-auto">
              {getStatusDisplay(order.status)}
            </div>
          )}
        </div>

        {/* PAYMENT STATUS BANNER */}
        {order && (
            <PaymentStatusBanner
                order={order}
                onRetryPayment={handlePaymentRetry}
            />
        )}
        {/* END PAYMENT STATUS BANNER */}

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
                <h2 className="text-xl font-semibold mb-6 text-gray-900 border-gray-200 border-b pb-4">
                  Order Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">CUSTOMER DETAILS</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <FaUserCircle className="text-gray-400 w-6 h-6" />
                      <div>
                        <p className="font-medium">
                          {order.first_name || 'N/A'} {order.last_name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">{order.email}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">ORDER SUMMARY</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order ID</span>
                        <span className="font-medium">{order.reference_code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date</span>
                        <span className="font-medium">{formatDate(order.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method</span>
                        <span className="font-medium capitalize">{order.payment_method || 'N/A'}</span>
                      </div>
                      {/* Payment Status Detail */}
                      <div className="flex justify-between">
                          <span className="text-gray-600">Payment Status</span>
                          {getPaymentStatusDisplay(order.payment_status)}
                      </div>
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
                    // Determine the percentage based on the discount type
                    const percentage = discount.discount_type === "redeemed_points"
                        ? order.redeemed_discount_percentage
                        : discount.percentage;

                    return (
                      <DiscountBadge key={index} order={order} discount={discount} percentage={percentage} />
                    );
                  })}
                </motion.div>
              )}

              {/* Order Items */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 border-gray-200 border-b pb-4">
                  Order Items ({order.items?.length || 0})
                </h2>
                {order.items?.length > 0 ? (
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <OrderItemCard key={index} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaBox className="mx-auto text-gray-300 w-10 h-10" />
                    <p className="text-gray-500 mt-2">No items found in this order</p>
                  </div>
                )}
              </div>

              {/* Delivery & Pickup */}
              {(order.delivery_address || order.pickup_address) && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-6 text-gray-900 border-gray-200 border-b pb-4">
                    Delivery & Pickup
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {order.delivery_address && (
                      <AddressCard type="delivery" address={order.delivery_address} cost={order.delivery_cost} />
                    )}
                    {order.pickup_address && (
                      <AddressCard type="pickup" address={order.pickup_address} cost={order.pickup_cost}  />
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
                    // Check if the current discount is the "redeemed_points" type
                    const isRedeemedPoints = discount.discount_type === "redeemed_points";

                    // Determine the percentage to display
                    const percentageToDisplay = isRedeemedPoints
                        ? (order.redeemed_discount_percentage || 0)
                        : (discount.percentage || 0);

                    // Calculate the discounted amount
                    const discountAmount = parseFloat(order.subtotal * percentageToDisplay / 100).toFixed(2);

                    // Format the discount type for a clean display
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

                  <div className="border-t border-gray-200 pt-4 mt-2 flex justify-between">
                    <span className="font-semibold text-lg">Total Amount</span>
                    <div className="text-right">
                      {order.discounts_applied?.length > 0 && (
                        <div className="text-sm text-gray-400 line-through mb-1">
                          {/* Calculate Gross Total (Subtotal + Fees) */}
                          GHS {(parseFloat(order.subtotal || order.total) +
                              parseFloat(order.delivery_address?.cost || 0) +
                              parseFloat(order.pickup_address?.cost || 0)).toFixed(2)}
                        </div>
                      )}
                      <span className="font-bold text-xl text-emerald-600">
                        GHS {parseFloat(order.total_amount || order.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>


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
                        href="mailto:support@kleankickx.comsupport"
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
                        href="tel:+233240000000"
                        className="font-medium text-gray-900 hover:text-green-600 transition-colors"
                      >
                        +233 24 000 0000
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GetOrder;