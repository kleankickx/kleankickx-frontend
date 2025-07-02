import React, { useEffect, useState, useContext } from 'react';
import {
  FaShoppingCart,
  FaExclamationCircle,
  FaUserCircle,
  FaBox,
  FaStore,
  FaChevronRight,
  FaInfoCircle, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaSpinner,
  FaTruck,
  FaBroom,
  FaCheckDouble,
  FaCalendarAlt,
} from 'react-icons/fa';

import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';

const GetOrder = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, user, api } = useContext(AuthContext);
  const navigate = useNavigate();
  const { orderSlug } = useParams();

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/api/orders/${orderSlug}/`);
        setOrder(response.data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
        toast.error('Failed to load order', {
          position: 'top-right',
          autoClose: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    if (!orderSlug) {
      setError('Invalid order URL');
      navigate('/orders');
      return;
    }
    if (!isAuthenticated) {
      setError('Please log in to view order');
      navigate('/login');
      return;
    }
    if (user && !user.is_verified) {
      setError('Please verify your email');
      navigate('/verify-email');
      return;
    }
    fetchOrder();
  }, [orderSlug, isAuthenticated, user, navigate]);

  const getStatusDisplay = (status) => {
    const statusConfig = {
    pending: {
      icon: <FaInfoCircle className="text-blue-400" />,
      color: 'text-blue-600',
      bg: 'bg-blue-50/80',
      displayText: 'Pending'
    },
    processing: {
      icon: <FaSpinner className="animate-spin text-amber-400" />,
      color: 'text-amber-600',
      bg: 'bg-amber-50/80',
      displayText: 'Processing'
    },
    pickup: {
      icon: <FaTruck className="text-indigo-400" />,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50/80',
      displayText: 'Pickup'
    },
    cleaning_ongoing: {
      icon: <FaBroom className="text-purple-400" />,
      color: 'text-purple-600',
      bg: 'bg-purple-50/80',
      displayText: 'Cleaning Ongoing'
    },
    cleaning_completed: {
      icon: <FaCheckDouble className="text-green-400" />,
      color: 'text-green-600',
      bg: 'bg-green-50/80',
      displayText: 'Cleaning Completed'
    },
    scheduled_for_delivery: {
      icon: <FaCalendarAlt className="text-teal-400" />,
      color: 'text-teal-600',
      bg: 'bg-teal-50/80',
      displayText: 'Scheduled for Delivery'
    },
    delivered: {
      icon: <FaCheckCircle className="text-emerald-400" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50/80',
      displayText: 'Delivered'
    },
    cancelled: {
      icon: <FaTimesCircle className="text-rose-400" />,
      color: 'text-rose-600',
      bg: 'bg-rose-50/80',
      displayText: 'Cancelled'
    },
    default: {
      icon: <FaInfoCircle className="text-gray-400" />,
      color: 'text-gray-600',
      bg: 'bg-gray-50/80',
      displayText: 'Unknown'
    }
  };

  // Convert status to lowercase and replace spaces with underscores to match the keys
  const statusKey = status?.toLowerCase().replace(/ /g, '_') || 'default';
  const config = statusConfig[statusKey] || statusConfig.default;
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
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
      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center">
          {item.service?.image ? (
            <img
              src={item.service.image}
              alt={item.service.name}
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <FaBox className="text-gray-400" />
          )}
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900">{item.service.name}</h4>
          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          GHS {parseFloat(item.total_price || item.price * item.quantity).toFixed(2)}
        </p>
        <p className="text-xs text-gray-500">
          GHS {parseFloat(item.unit_price || item.price).toFixed(2)} each
        </p>
      </div>
    </motion.div>
  );

  const AddressCard = ({ type, address }) => (
    <div className="p-4 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        {type === 'delivery' ? (
          <FaTruck className="text-blue-500" />
        ) : (
          <FaStore className="text-green-500" />
        )}
        <h3 className="font-medium text-gray-900">
          {type === 'delivery' ? 'Delivery' : 'Pickup'} Address
        </h3>
      </div>
      <div className="space-y-1 text-sm text-gray-600">
        <p>{address.location_name}</p>
        <p>{address.street_address}</p>
        <p>{address.region}</p>
        <p className="font-medium mt-2">
          Cost: GHS {parseFloat(address.cost).toFixed(2)}
        </p>
      </div>
    </div>
  );

  return (
    <div className="px-4 lg:px-24 py-8 mt-[4rem]">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Order Details
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Order ID: {orderSlug}
            </p>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white cursor-pointer transition-colors bg-primary hover:bg-primary/80 rounded-lg shadow-sm"
          >
            <FaChevronRight className="transform rotate-180" />
            Back to orders
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <FaSpinner className="animate-spin text-primary text-4xl" />
            <p className="text-gray-600">Loading order details...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-gray-50 rounded-xl">
            <FaExclamationCircle className="text-red-500 text-4xl" />
            <p className="text-gray-700 max-w-md text-center">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        ) : order ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">
                  Order Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-medium">{order.slug}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Status</p>
                    <div>{getStatusDisplay(order.status)}</div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Customer</p>
                    <div className="flex items-center gap-2">
                      <FaUserCircle className="text-gray-400 text-2xl" />
                      <span>
                        {order.first_name || 'N/A'} {order.last_name || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Order Date</p>
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-400" />
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">
                  Items ({order.items?.length || 0})
                </h2>
                {order.items && order.items.length > 0 ? (
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <OrderItemCard key={index} item={item} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No items found</p>
                )}
              </div>

              {/* Delivery/Pickup */}
              {(order.delivery_address || order.pickup_address) && (
                <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">
                    Shipping Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.delivery_address && (
                      <AddressCard type="delivery" address={order.delivery_address} />
                    )}
                    {order.pickup_address && (
                      <AddressCard type="pickup" address={order.pickup_address} />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Order Total */}
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">
                  Order Total
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>GHS {parseFloat(order.subtotal || order.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery</span>
                    <span>{order.delivery_address.cost ? `GHS ${parseFloat(order.delivery_address.cost).toFixed(2)}` : 'N/A'}</span>
                  </div>
                    <div className="flex justify-between">
                    <span className="text-gray-600">Pickup</span>
                    <span>{order.pickup_address.cost ? `GHS ${parseFloat(order.pickup_address.cost).toFixed(2)}` : 'N/A'}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">
                      GHS {parseFloat(order.total_amount || order.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">
                  Customer Support
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  Need help with your order?
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  Contact our support team at{' '}
                  <a
                    href="mailto:support@kleankickx.com"
                    className="text-blue-600 hover:underline"
                  >
                    support@kleankickx.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default GetOrder;