import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  FaShoppingCart,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle,
  FaInfoCircle,
  FaTimesCircle,
  FaChevronRight,
  FaBoxOpen,
  FaSearch,
  FaBroom,
  FaTruck,
  FaCalendarAlt,
  FaCheckDouble,
  

} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const MyOrders = () => {
  const { isAuthenticated, user, api } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
 

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/api/orders/');
        setOrders(response.data);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
        toast.error('Failed to load orders', {
          position: 'top-right',
          autoClose: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    if (!isAuthenticated) {
      setLoading(false);
      setError('Please log in to view your orders.');
      navigate('/login');
      return;
    }
    if (user && !user.is_verified) {
      setLoading(false);
      setError('Please verify your email to view orders.');
      navigate(`/temp-verify-email/?email=${user.email}`);
      toast.warn('Please verify your email before viewing orders.');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, user, navigate]);

  const filteredOrders = orders.filter(order => 
    order.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    const statusKey = status?.toLowerCase().replace(/ /g, '_') || 'default';
    const config = statusConfig[statusKey] || statusConfig.default;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.color}`}>
        {config.icon}
        {config.displayText}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const OrderItemCard = ({ item }) => (
    <div className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="w-16 h-16 rounded-md bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
        {item.service.image ? (
          <img
            src={item.service.image}
            alt={item.service.name}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <FaBoxOpen className="text-gray-400 text-xl" />
        )}
      </div>
      <div className="ml-4 flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{item.service.name}</h4>
        <p className="text-xs text-gray-500 mt-1">GHS {parseFloat(item.service.price).toFixed(2)} × {item.quantity}</p>
      </div>
    </div>
  );

  return (
    <div className="px-4 lg:px-24 py-8 max-w-6xl mx-auto">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              My Orders
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              {orders.length > 0 
                ? `${orders.length} order${orders.length !== 1 ? 's' : ''} in total` 
                : 'Your order history will appear here'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Link
              to="/services"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors text-sm font-medium flex items-center justify-center"
            >
              Browse Services
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <FaSpinner className="animate-spin text-primary text-4xl" />
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-gray-50 rounded-xl">
            <FaExclamationCircle className="text-red-500 text-4xl" />
            <p className="text-gray-700 max-w-md text-center">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Refresh Page
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl">
            <FaBoxOpen className="text-gray-300 text-5xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching orders' : 'No orders yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md text-center">
              {searchTerm 
                ? 'Try adjusting your search query'
                : 'When you place orders, they will appear here'}
            </p>
            <Link
              to="/services"
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
            >
              Explore Services
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <motion.div
                  key={order.slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 justify-between">
                          <span>Order #{order.slug}</span>
                          {getStatusDisplay(order.status)}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Placed on {formatDate(order.created_at)}
                        </p>
                      </div>
                      
                      <Link
                        to={`/orders/${order.slug}`}
                        className="lg:flex hidden items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors text-sm font-medium"
                      >
                        View Details <FaChevronRight className="text-xs" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                      <div className="lg:col-span-3">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          Order Items
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {order.items?.slice(0, 4).map((item, index) => (
                            <OrderItemCard key={index} item={item} />
                          ))}
                          {order.items?.length > 4 && (
                            <div className="flex items-center justify-center p-3 rounded-lg bg-gray-50">
                              <span className="text-sm text-gray-500">
                                +{order.items.length - 4} more items
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="lg:col-span-2">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Order Summary
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Subtotal</span>
                              <span className="text-sm font-medium">GHS {parseFloat(order.subtotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Delivery</span>
                              <span className="text-sm font-medium">{order.delivery_cost ? `GHS ${parseFloat(order.delivery_cost).toFixed(2)}` : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Pickup</span>
                              <span className="text-sm font-medium">{order.pickup_cost ? `GHS ${parseFloat(order.pickup_cost).toFixed(2)}` : 'N/A'}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-3 flex justify-between">
                              <span className="text-base font-semibold">Total</span>
                              <span className="text-base font-bold">
                                GHS {parseFloat(order.total).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-[2rem] block lg:hidden">
                      <Link
                        to={`/orders/${order.slug}`}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors text-sm font-medium"
                      >
                        View Details <FaChevronRight className="text-xs" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;